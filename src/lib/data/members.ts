import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { slotKey } from "@/lib/domain/availability";
import { rankMatches, scoreMatch, type MatchProfile, type MatchResult, type MatchWeights } from "@/lib/matching/score";
import { parseStoredWeights } from "@/lib/matching/weights";
import { signAvatarUrls } from "@/lib/storage";
import { getNeighborhood, neighborhoodName } from "@/lib/domain/neighborhoods";

export type ProfileRow = Tables<"member_profiles">;

export interface MemberSummary {
  userId: string;
  displayName: string;
  firstName: string;
  neighborhood: string;
  neighborhoodName: string;
  bio: string | null;
  occupation: string | null;
  photoUrl: string | null;
  /** Discovery only lists members whose visibility is MEMBERS. */
  discoverable: boolean;
  sports: { sportId: string; name: string; level: string; formats: string[] }[];
  availability: string[];
}

export interface MemberMatch extends MemberSummary {
  match: MatchResult | null;
}

export function displayName(p: Pick<ProfileRow, "first_name" | "last_name" | "show_last_name">): string {
  if (!p.last_name) return p.first_name;
  return p.show_last_name ? `${p.first_name} ${p.last_name}` : `${p.first_name} ${p.last_name.charAt(0)}.`;
}

export async function getMatchingWeights(supabase: ServerSupabase): Promise<MatchWeights> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "matching_weights").maybeSingle();
  return parseStoredWeights(data?.value);
}

/**
 * Loads member summaries + match profiles. All reads use the viewer's client,
 * so RLS limits results to members the viewer is allowed to see (active,
 * visible, not blocked in either direction).
 */
export async function loadMembers(
  supabase: ServerSupabase,
  opts: { userIds?: string[]; limit?: number } = {},
): Promise<{ summaries: Map<string, MemberSummary>; profiles: Map<string, MatchProfile> }> {
  let profileQuery = supabase
    .from("member_profiles")
    .select("user_id, first_name, last_name, show_last_name, bio, neighborhood, occupation, show_occupation, photo_path, visibility")
    .not("completed_at", "is", null)
    .limit(opts.limit ?? 500);
  if (opts.userIds) {
    if (opts.userIds.length === 0) return { summaries: new Map(), profiles: new Map() };
    profileQuery = profileQuery.in("user_id", opts.userIds);
  }
  const { data: profiles, error } = await profileQuery;
  if (error) throw new Error(`member load failed: ${error.message}`);
  const ids = profiles.map((p) => p.user_id);
  if (ids.length === 0) return { summaries: new Map(), profiles: new Map() };

  const [{ data: sportsRows }, { data: availRows }, { data: catalogue }, urls] = await Promise.all([
    supabase.from("member_sports").select("user_id, sport_id, skill_level, formats").in("user_id", ids),
    supabase.from("member_availability").select("user_id, day_of_week, time_block").in("user_id", ids),
    supabase.from("sports").select("id, name, skill_levels"),
    signAvatarUrls(supabase, profiles.map((p) => p.photo_path)),
  ]);
  const sportById = new Map((catalogue ?? []).map((s) => [s.id, s]));

  const summaries = new Map<string, MemberSummary>();
  const matchProfiles = new Map<string, MatchProfile>();
  for (const p of profiles) {
    const sports = (sportsRows ?? []).filter((s) => s.user_id === p.user_id && sportById.has(s.sport_id));
    const availability = (availRows ?? []).filter((a) => a.user_id === p.user_id).map((a) => slotKey(a.day_of_week, a.time_block));
    summaries.set(p.user_id, {
      userId: p.user_id,
      displayName: displayName(p),
      firstName: p.first_name,
      neighborhood: p.neighborhood,
      neighborhoodName: neighborhoodName(p.neighborhood),
      bio: p.bio,
      occupation: p.show_occupation ? p.occupation : null,
      photoUrl: p.photo_path ? urls.get(p.photo_path) ?? null : null,
      discoverable: p.visibility === "MEMBERS",
      sports: sports.map((s) => ({ sportId: s.sport_id, name: sportById.get(s.sport_id)!.name, level: s.skill_level, formats: s.formats })),
      availability,
    });
    matchProfiles.set(p.user_id, {
      userId: p.user_id,
      neighborhood: p.neighborhood,
      availability,
      sports: sports.map((s) => {
        const sport = sportById.get(s.sport_id)!;
        return {
          sportId: s.sport_id,
          sportName: sport.name,
          level: s.skill_level,
          levelRank: Math.max(0, sport.skill_levels.indexOf(s.skill_level)),
          levelCount: sport.skill_levels.length,
          formats: s.formats,
        };
      }),
    });
  }
  return { summaries, profiles: matchProfiles };
}

export interface DiscoverFilters {
  sport?: string; // sport id
  area?: string; // neighbourhood area or slug
  when?: "weekday-mornings" | "weekday-evenings" | "weekends" | "any";
  format?: string;
  level?: "similar" | "any";
}

const WHEN_SLOTS: Record<string, (slot: string) => boolean> = {
  "weekday-mornings": (s) => /^[0-4]:(EARLY_MORNING|MORNING)$/.test(s),
  "weekday-evenings": (s) => /^[0-4]:EVENING$/.test(s),
  weekends: (s) => /^[56]:/.test(s),
};

/** Ranked, filtered discovery results for the viewer. */
export async function discoverMembers(supabase: ServerSupabase, viewerId: string, filters: DiscoverFilters, limit = 30) {
  const [{ summaries, profiles }, weights] = await Promise.all([loadMembers(supabase), getMatchingWeights(supabase)]);
  const me = profiles.get(viewerId);
  if (!me) return { me: null, results: [] as MemberMatch[], weights };

  const candidates = [...profiles.values()].filter((c) => {
    if (c.userId === viewerId) return false;
    if (!summaries.get(c.userId)?.discoverable) return false;
    if (filters.area) {
      const n = getNeighborhood(c.neighborhood);
      if (!n || (n.area !== filters.area && n.slug !== filters.area)) return false;
    }
    if (filters.when && filters.when !== "any") {
      const pred = WHEN_SLOTS[filters.when];
      if (pred && !c.availability.some(pred)) return false;
    }
    if (filters.format) {
      if (!c.sports.some((s) => (!filters.sport || s.sportId === filters.sport) && s.formats.includes(filters.format!))) return false;
    }
    return true;
  });

  let ranked = rankMatches(me, candidates, weights, { sportId: filters.sport || undefined });
  if (filters.level === "similar") ranked = ranked.filter((r) => (r.components.skill ?? 0) >= 0.65);

  return {
    me,
    weights,
    results: ranked.slice(0, limit).map((match) => ({ ...summaries.get(match.userId)!, match })),
  };
}

/** One member's summary plus the viewer's match explanation (RLS-checked). */
export async function getMemberWithMatch(supabase: ServerSupabase, viewerId: string, memberId: string): Promise<MemberMatch | null> {
  const [{ summaries, profiles }, weights] = await Promise.all([
    loadMembers(supabase, { userIds: [viewerId, memberId] }),
    getMatchingWeights(supabase),
  ]);
  const summary = summaries.get(memberId);
  if (!summary) return null;
  const me = profiles.get(viewerId);
  const them = profiles.get(memberId);
  return { ...summary, match: me && them && viewerId !== memberId ? scoreMatch(me, them, weights) : null };
}

export type ConnectionState =
  | { kind: "none" }
  | { kind: "connected"; id: string }
  | { kind: "outgoing"; id: string }
  | { kind: "incoming"; id: string };

export async function connectionStates(supabase: ServerSupabase, viewerId: string): Promise<Map<string, ConnectionState>> {
  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .in("status", ["PENDING", "ACCEPTED"])
    .or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`);
  const map = new Map<string, ConnectionState>();
  for (const c of data ?? []) {
    const other = c.requester_id === viewerId ? c.addressee_id : c.requester_id;
    if (c.status === "ACCEPTED") map.set(other, { kind: "connected", id: c.id });
    else map.set(other, c.requester_id === viewerId ? { kind: "outgoing", id: c.id } : { kind: "incoming", id: c.id });
  }
  return map;
}
