/**
 * POCHI MA BUONI compatibility engine.
 *
 * Deterministic and explainable by design:
 *  - A shared sport is REQUIRED; otherwise no match is produced.
 *  - Four weighted components (defaults: availability 35%, skill 30%,
 *    neighbourhood 20%, format 15%) each score 0..1.
 *  - Components with missing data are EXCLUDED and the remaining weights are
 *    renormalised, so incomplete profiles are neither punished nor inflated.
 *    `coverage` reports how much of the total weight was actually known.
 *  - Every result carries short human-readable reasons.
 */
import { getNeighborhood } from "@/lib/domain/neighborhoods";
import { describeSlots } from "@/lib/domain/availability";

export interface MatchWeights {
  availability: number;
  skill: number;
  neighborhood: number;
  format: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = { availability: 0.35, skill: 0.3, neighborhood: 0.2, format: 0.15 };

export type ComponentKey = keyof MatchWeights;
export const COMPONENT_KEYS: ComponentKey[] = ["availability", "skill", "neighborhood", "format"];

export interface SportPreference {
  sportId: string;
  sportName: string;
  level: string;
  /** Index of `level` within the sport's ordered skill levels. */
  levelRank: number;
  levelCount: number;
  formats: string[];
}

export interface MatchProfile {
  userId: string;
  neighborhood: string | null;
  sports: SportPreference[];
  /** Slot keys "<day>:<BLOCK>". */
  availability: string[];
}

export interface MatchResult {
  userId: string;
  sportId: string;
  sportName: string;
  /** 0..100, rounded. */
  score: number;
  /** Fraction (0..1) of total weight backed by known data. */
  coverage: number;
  components: Partial<Record<ComponentKey, number>>;
  reasons: string[];
  missing: ComponentKey[];
  sharedSports: string[];
}

export function normalizeWeights(input: Partial<MatchWeights> | null | undefined): MatchWeights {
  const w = { ...DEFAULT_WEIGHTS, ...(input ?? {}) };
  for (const k of COMPONENT_KEYS) {
    if (!Number.isFinite(w[k]) || w[k] < 0) w[k] = 0;
  }
  const total = COMPONENT_KEYS.reduce((s, k) => s + w[k], 0);
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  return {
    availability: w.availability / total,
    skill: w.skill / total,
    neighborhood: w.neighborhood / total,
    format: w.format / total,
  };
}

// ---------------------------------------------------------------------------
// Component scorers (pure, exported for testing)
// ---------------------------------------------------------------------------

export function availabilityScore(a: string[], b: string[]): { score: number; overlap: string[] } | null {
  if (a.length === 0 || b.length === 0) return null;
  const setB = new Set(b);
  const overlap = [...new Set(a)].filter((s) => setB.has(s));
  const denominator = Math.min(new Set(a).size, setB.size);
  return { score: overlap.length / denominator, overlap };
}

/** 0 levels apart → 1, 1 → 0.65, 2 → 0.25, 3+ → 0. */
export function skillScore(rankA: number, rankB: number): number {
  const diff = Math.abs(rankA - rankB);
  return [1, 0.65, 0.25][diff] ?? 0;
}

export type ProximityTier = "same" | "area" | "borough" | "far";

export function neighborhoodProximity(a: string | null, b: string | null): { score: number; tier: ProximityTier } | null {
  const na = getNeighborhood(a);
  const nb = getNeighborhood(b);
  if (!na || !nb) return null;
  if (na.slug === nb.slug) return { score: 1, tier: "same" };
  if (na.area === nb.area) return { score: 0.75, tier: "area" };
  if (na.borough === nb.borough) return { score: 0.45, tier: "borough" };
  return { score: 0.15, tier: "far" };
}

export function formatScore(a: string[], b: string[]): { score: number; shared: string[] } | null {
  if (a.length === 0 || b.length === 0) return null;
  const setB = new Set(b);
  const shared = [...new Set(a)].filter((f) => setB.has(f));
  return { score: shared.length / Math.min(new Set(a).size, setB.size), shared };
}

// ---------------------------------------------------------------------------
// Reasons
// ---------------------------------------------------------------------------

const AREA_LABELS: Record<string, string> = {
  downtown: "Downtown Manhattan",
  midtown: "Midtown Manhattan",
  uptown: "Uptown Manhattan",
};

function lower(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function skillReason(sport: string, a: SportPreference, b: SportPreference): string | null {
  const diff = Math.abs(a.levelRank - b.levelRank);
  if (diff === 0) return `Both play ${lower(a.level)} ${lower(sport)}`;
  if (diff === 1) return `Similar ${lower(sport)} levels`;
  return null;
}

function neighborhoodReason(a: string | null, b: string | null, tier: ProximityTier): string | null {
  const na = getNeighborhood(a);
  const nb = getNeighborhood(b);
  if (!na || !nb) return null;
  if (tier === "same") return `Both in ${na.name}`;
  if (tier === "area") return `Both based in ${AREA_LABELS[na.area] ?? na.borough}`;
  if (tier === "borough") return `Both prefer ${na.borough}`;
  return null;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function scoreMatch(
  viewer: MatchProfile,
  candidate: MatchProfile,
  weightsInput: Partial<MatchWeights> = DEFAULT_WEIGHTS,
  options: { sportId?: string } = {},
): MatchResult | null {
  if (viewer.userId === candidate.userId) return null;
  const weights = normalizeWeights(weightsInput);

  const candidateSports = new Map(candidate.sports.map((s) => [s.sportId, s]));
  const shared = viewer.sports.filter((s) => candidateSports.has(s.sportId));
  const considered = options.sportId ? shared.filter((s) => s.sportId === options.sportId) : shared;
  if (considered.length === 0) return null; // shared sport is required

  // Sport-independent components.
  const avail = availabilityScore(viewer.availability, candidate.availability);
  const hood = neighborhoodProximity(viewer.neighborhood, candidate.neighborhood);

  let best: MatchResult | null = null;
  for (const mine of considered) {
    const theirs = candidateSports.get(mine.sportId)!;
    const fmt = formatScore(mine.formats, theirs.formats);

    const components: Partial<Record<ComponentKey, number>> = {
      skill: skillScore(mine.levelRank, theirs.levelRank),
    };
    if (avail) components.availability = avail.score;
    if (hood) components.neighborhood = hood.score;
    if (fmt) components.format = fmt.score;

    const known = COMPONENT_KEYS.filter((k) => components[k] !== undefined);
    const knownWeight = known.reduce((s, k) => s + weights[k], 0);
    const weighted = known.reduce((s, k) => s + weights[k] * components[k]!, 0);
    const score = knownWeight > 0 ? Math.round((weighted / knownWeight) * 100) : 0;

    const reasons: string[] = [];
    const sr = skillReason(mine.sportName, mine, theirs);
    if (sr) reasons.push(sr);
    if (avail && avail.overlap.length > 0) {
      const phrase = describeSlots(avail.overlap);
      if (phrase) reasons.push(`Available on ${phrase}`);
    }
    if (hood) {
      const nr = neighborhoodReason(viewer.neighborhood, candidate.neighborhood, hood.tier);
      if (nr) reasons.push(nr);
    }
    if (fmt && fmt.shared.length > 0) {
      reasons.push(`Both enjoy ${fmt.shared.slice(0, 2).map(lower).join(" & ")}`);
    }

    const result: MatchResult = {
      userId: candidate.userId,
      sportId: mine.sportId,
      sportName: mine.sportName,
      score,
      coverage: Math.round(knownWeight * 100) / 100,
      components,
      reasons,
      missing: COMPONENT_KEYS.filter((k) => components[k] === undefined),
      sharedSports: shared.map((s) => s.sportName),
    };
    if (!best || result.score > best.score || (result.score === best.score && result.coverage > best.coverage)) {
      best = result;
    }
  }
  return best;
}

/** Rank candidates: score desc, then coverage desc, then stable by id. */
export function rankMatches(
  viewer: MatchProfile,
  candidates: MatchProfile[],
  weights?: Partial<MatchWeights>,
  options: { sportId?: string; minScore?: number } = {},
): MatchResult[] {
  return candidates
    .map((c) => scoreMatch(viewer, c, weights, options))
    .filter((r): r is MatchResult => r !== null && r.score >= (options.minScore ?? 0))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.userId.localeCompare(b.userId));
}

export const COMPONENT_LABELS: Record<ComponentKey, string> = {
  availability: "Availability",
  skill: "Skill",
  neighborhood: "Neighbourhood",
  format: "Format",
};
