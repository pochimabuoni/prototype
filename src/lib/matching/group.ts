/**
 * Group matchmaking: suggests a full group (doubles, a foursome, a pickup
 * game) for one sport, rather than a single partner.
 *
 * Deterministic and explainable, like the pairwise engine it builds on:
 *  - Every member of a suggested group plays the chosen sport.
 *  - Every member is free in at least one shared time slot.
 *  - Members are added greedily: each pick is the candidate with the best
 *    average pairwise score against everyone already in the group, so the
 *    group works as a whole and not only with the organiser.
 *  - The group score is the mean of all pairwise scores (0..100).
 */
import { getNeighborhood } from "@/lib/domain/neighborhoods";
import { describeSlots } from "@/lib/domain/availability";
import { scoreMatch, type MatchProfile, type MatchWeights } from "./score";

export interface GroupSuggestion {
  sportId: string;
  sportName: string;
  /** Other members, in the order they were picked (organiser excluded). */
  memberIds: string[];
  /** Slots every member of the group is free. */
  sharedSlots: string[];
  /** Mean pairwise compatibility, 0..100. */
  score: number;
  reasons: string[];
}

export interface GroupOptions {
  sportId: string;
  /** Total group size, organiser included. */
  size: number;
  /** Maximum number of distinct suggestions. */
  limit?: number;
}

function pairScore(a: MatchProfile, b: MatchProfile, weights: Partial<MatchWeights>, sportId: string, cache: Map<string, number>): number {
  const key = a.userId < b.userId ? `${a.userId}|${b.userId}` : `${b.userId}|${a.userId}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const s = scoreMatch(a, b, weights, { sportId })?.score ?? 0;
  cache.set(key, s);
  return s;
}

export function buildGroups(
  organiser: MatchProfile,
  candidates: MatchProfile[],
  weights: Partial<MatchWeights>,
  options: GroupOptions,
): GroupSuggestion[] {
  const { sportId, size } = options;
  const limit = options.limit ?? 3;
  const needed = size - 1;
  const mySport = organiser.sports.find((s) => s.sportId === sportId);
  if (!mySport || needed < 1) return [];

  const pool = candidates.filter((c) => c.userId !== organiser.userId && c.sports.some((s) => s.sportId === sportId));
  if (pool.length < needed) return [];

  const cache = new Map<string, number>();
  const found = new Map<string, GroupSuggestion>();

  for (const slot of [...new Set(organiser.availability)].sort()) {
    let available = pool.filter((c) => c.availability.includes(slot));
    if (available.length < needed) continue;

    const group: MatchProfile[] = [organiser];
    while (group.length < size && available.length > 0) {
      let best: MatchProfile | null = null;
      let bestScore = -1;
      for (const c of available) {
        const avg = group.reduce((s, g) => s + pairScore(g, c, weights, sportId, cache), 0) / group.length;
        if (avg > bestScore || (avg === bestScore && best && c.userId < best.userId)) {
          best = c;
          bestScore = avg;
        }
      }
      group.push(best!);
      available = available.filter((c) => c.userId !== best!.userId);
    }
    if (group.length < size) continue;

    const others = group.slice(1);
    const key = others.map((m) => m.userId).sort().join(",");
    if (found.has(key)) continue;

    let total = 0;
    let pairs = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        total += pairScore(group[i], group[j], weights, sportId, cache);
        pairs++;
      }
    }
    const sharedSlots = group
      .slice(1)
      .reduce((acc, m) => acc.filter((s) => m.availability.includes(s)), [...organiser.availability])
      .sort();

    found.set(key, {
      sportId,
      sportName: mySport.sportName,
      memberIds: others.map((m) => m.userId),
      sharedSlots,
      score: Math.round(total / pairs),
      reasons: groupReasons(group, sportId, sharedSlots),
    });
  }

  return [...found.values()]
    .sort((a, b) => b.score - a.score || b.sharedSlots.length - a.sharedSlots.length || a.memberIds.join().localeCompare(b.memberIds.join()))
    .slice(0, limit);
}

function groupReasons(group: MatchProfile[], sportId: string, sharedSlots: string[]): string[] {
  const reasons: string[] = [];
  const when = describeSlots(sharedSlots);
  if (when) reasons.push(`Everyone is free ${when}`);

  const levels = group
    .map((m) => m.sports.find((s) => s.sportId === sportId))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .sort((a, b) => a.levelRank - b.levelRank);
  if (levels.length > 0) {
    const lo = levels[0];
    const hi = levels[levels.length - 1];
    reasons.push(lo.level === hi.level ? `All play at ${lo.level.toLowerCase()} level` : `Levels from ${lo.level.toLowerCase()} to ${hi.level.toLowerCase()}`);
  }

  const areas = new Map<string, number>();
  for (const m of group) {
    const a = getNeighborhood(m.neighborhood)?.area;
    if (a) areas.set(a, (areas.get(a) ?? 0) + 1);
  }
  const [topArea, count] = [...areas.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (topArea && count === group.length) reasons.push(`Everyone is based ${areaPhrase(topArea)}`);
  else if (topArea && count && count >= Math.ceil(group.length / 2)) reasons.push(`Most of the group is based ${areaPhrase(topArea)}`);

  return reasons;
}

function areaPhrase(area: string): string {
  const names: Record<string, string> = {
    downtown: "downtown",
    midtown: "in Midtown",
    uptown: "uptown",
    "north-brooklyn": "in north Brooklyn",
    "brownstone-brooklyn": "in brownstone Brooklyn",
    "western-queens": "in western Queens",
    "hudson-waterfront": "on the Hudson waterfront",
  };
  return names[area] ?? "nearby";
}
