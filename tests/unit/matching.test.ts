import { describe, expect, it } from "vitest";
import {
  scoreMatch,
  rankMatches,
  normalizeWeights,
  availabilityScore,
  skillScore,
  neighborhoodProximity,
  formatScore,
  DEFAULT_WEIGHTS,
  type MatchProfile,
} from "@/lib/matching/score";
import { parseStoredWeights } from "@/lib/matching/weights";

const tennis = (level: string, rank: number, formats: string[] = []) => ({
  sportId: "tennis", sportName: "Tennis", level, levelRank: rank, levelCount: 5, formats,
});
const padel = (level: string, rank: number, formats: string[] = []) => ({
  sportId: "padel", sportName: "Padel", level, levelRank: rank, levelCount: 4, formats,
});

const viewer: MatchProfile = {
  userId: "viewer",
  neighborhood: "west-village",
  sports: [tennis("Intermediate", 2, ["Doubles", "Singles"])],
  availability: ["5:MORNING", "6:MORNING", "2:EVENING"],
};

describe("component scorers", () => {
  it("scores availability as overlap over the smaller set", () => {
    expect(availabilityScore(["5:MORNING", "6:MORNING"], ["5:MORNING", "6:MORNING", "1:EVENING"])?.score).toBe(1);
    expect(availabilityScore(["5:MORNING", "6:MORNING"], ["5:MORNING"])?.score).toBe(1);
    expect(availabilityScore(["5:MORNING", "6:MORNING"], ["1:EVENING"])?.score).toBe(0);
    expect(availabilityScore([], ["1:EVENING"])).toBeNull();
  });

  it("rewards close skill levels and drops off quickly", () => {
    expect(skillScore(2, 2)).toBe(1);
    expect(skillScore(2, 3)).toBe(0.65);
    expect(skillScore(1, 3)).toBe(0.25);
    expect(skillScore(0, 4)).toBe(0);
  });

  it("grades neighbourhood proximity by neighbourhood, area and borough", () => {
    expect(neighborhoodProximity("tribeca", "tribeca")?.tier).toBe("same");
    expect(neighborhoodProximity("tribeca", "west-village")?.tier).toBe("area");
    expect(neighborhoodProximity("tribeca", "harlem")?.tier).toBe("borough");
    expect(neighborhoodProximity("tribeca", "astoria")?.tier).toBe("far");
    expect(neighborhoodProximity("tribeca", "nowhere")).toBeNull();
  });

  it("scores format overlap and treats empty as unknown", () => {
    expect(formatScore(["Doubles"], ["Doubles", "Singles"])?.score).toBe(1);
    expect(formatScore(["Doubles"], ["Singles"])?.score).toBe(0);
    expect(formatScore([], ["Singles"])).toBeNull();
  });
});

describe("scoreMatch", () => {
  it("requires a shared sport", () => {
    const other: MatchProfile = { userId: "o", neighborhood: "west-village", sports: [padel("Advanced", 2)], availability: ["5:MORNING"] };
    expect(scoreMatch(viewer, other)).toBeNull();
  });

  it("never matches a member with themselves", () => {
    expect(scoreMatch(viewer, viewer)).toBeNull();
  });

  it("gives a perfect, fully-covered score to an ideal partner and explains it", () => {
    const ideal: MatchProfile = {
      userId: "ideal",
      neighborhood: "west-village",
      sports: [tennis("Intermediate", 2, ["Doubles"])],
      availability: ["5:MORNING", "6:MORNING"],
    };
    const r = scoreMatch(viewer, ideal)!;
    expect(r.score).toBe(100);
    expect(r.coverage).toBe(1);
    expect(r.missing).toEqual([]);
    expect(r.reasons).toContain("Both play intermediate tennis");
    expect(r.reasons).toContain("Available on weekend mornings");
    expect(r.reasons).toContain("Both in West Village");
    expect(r.reasons).toContain("Both enjoy doubles");
  });

  it("applies the default weights exactly", () => {
    const partial: MatchProfile = {
      userId: "p",
      neighborhood: "astoria", // far → 0.15
      sports: [tennis("Advanced", 3, ["Singles", "Doubles"])], // skill 0.65, format 1
      availability: ["5:MORNING", "1:EVENING"], // overlap 1 / min(3,2) = 0.5
    };
    const r = scoreMatch(viewer, partial)!;
    const expected = 0.35 * 0.5 + 0.3 * 0.65 + 0.2 * 0.15 + 0.15 * 1;
    expect(r.score).toBe(Math.round(expected * 100));
  });

  it("renormalises over known components when data is missing", () => {
    const sparse: MatchProfile = { userId: "s", neighborhood: null, sports: [tennis("Intermediate", 2)], availability: [] };
    const r = scoreMatch(viewer, sparse)!;
    // Only skill is known (perfect), so the score reflects it fully…
    expect(r.score).toBe(100);
    // …but coverage tells the truth about how much we knew.
    expect(r.coverage).toBe(0.3);
    expect(r.missing.sort()).toEqual(["availability", "format", "neighborhood"]);
  });

  it("chooses the best shared sport and can be restricted to one", () => {
    const v: MatchProfile = { ...viewer, sports: [tennis("Beginner", 0), padel("Advanced", 2)] };
    const c: MatchProfile = { userId: "c", neighborhood: "west-village", sports: [tennis("Competitive", 4), padel("Advanced", 2)], availability: ["5:MORNING"] };
    expect(scoreMatch(v, c)!.sportId).toBe("padel");
    expect(scoreMatch(v, c, DEFAULT_WEIGHTS, { sportId: "tennis" })!.sportId).toBe("tennis");
    expect(scoreMatch(v, c)!.sharedSports).toEqual(["Tennis", "Padel"]);
  });

  it("respects configurable weights", () => {
    const c: MatchProfile = { userId: "c", neighborhood: "astoria", sports: [tennis("Intermediate", 2)], availability: ["5:MORNING"] };
    const neighbourhoodHeavy = scoreMatch(viewer, c, { availability: 0, skill: 0, neighborhood: 1, format: 0 })!;
    expect(neighbourhoodHeavy.score).toBe(15);
  });
});

describe("weights", () => {
  it("normalises arbitrary positive weights to sum to 1", () => {
    const w = normalizeWeights({ availability: 2, skill: 2, neighborhood: 0, format: 0 });
    expect(w.availability).toBeCloseTo(0.5);
    expect(w.skill).toBeCloseTo(0.5);
  });
  it("falls back to defaults for invalid input", () => {
    expect(normalizeWeights({ availability: 0, skill: 0, neighborhood: 0, format: 0 })).toEqual(DEFAULT_WEIGHTS);
    expect(parseStoredWeights({ nonsense: true })).toEqual(DEFAULT_WEIGHTS);
    expect(normalizeWeights({ availability: -1 }).availability).toBe(0);
  });
});

describe("rankMatches", () => {
  it("orders by score then coverage and filters by minimum score", () => {
    const a: MatchProfile = { userId: "a", neighborhood: "west-village", sports: [tennis("Intermediate", 2, ["Doubles"])], availability: ["5:MORNING"] };
    const b: MatchProfile = { userId: "b", neighborhood: "harlem", sports: [tennis("Competitive", 4)], availability: ["1:EVENING"] };
    const ranked = rankMatches(viewer, [b, a]);
    expect(ranked.map((r) => r.userId)).toEqual(["a", "b"]);
    expect(rankMatches(viewer, [b, a], undefined, { minScore: 90 }).map((r) => r.userId)).toEqual(["a"]);
  });
});
