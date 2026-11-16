import { describe, expect, it } from "vitest";
import { buildGroups } from "@/lib/matching/group";
import { DEFAULT_WEIGHTS, type MatchProfile } from "@/lib/matching/score";
import { styleForGroupSize } from "@/lib/domain/play-styles";

const tennis = (rank: number, formats: string[] = ["Doubles"]) => ({
  sportId: "tennis", sportName: "Tennis", level: ["Beginner", "Improver", "Intermediate", "Advanced", "Competitive"][rank], levelRank: rank, levelCount: 5, formats,
});
const member = (userId: string, rank: number, availability: string[], neighborhood = "west-village"): MatchProfile => ({
  userId, neighborhood, sports: [tennis(rank)], availability,
});

const organiser = member("me", 2, ["5:MORNING", "2:EVENING"]);

describe("group matchmaking", () => {
  it("builds a doubles four where everyone shares a slot", () => {
    const pool = [
      member("a", 2, ["5:MORNING"]),
      member("b", 3, ["5:MORNING", "2:EVENING"]),
      member("c", 2, ["5:MORNING"], "tribeca"),
      member("d", 2, ["1:EVENING"]), // never free with the organiser
    ];
    const [best] = buildGroups(organiser, pool, DEFAULT_WEIGHTS, { sportId: "tennis", size: 4 });
    expect(best.memberIds).toHaveLength(3);
    expect(best.memberIds).not.toContain("d");
    expect(best.sharedSlots).toEqual(["5:MORNING"]);
    expect(best.reasons[0]).toMatch(/Everyone is free/);
    expect(best.score).toBeGreaterThan(0);
  });

  it("returns nothing when there aren't enough players free together", () => {
    const pool = [member("a", 2, ["5:MORNING"]), member("b", 2, ["2:EVENING"])];
    expect(buildGroups(organiser, pool, DEFAULT_WEIGHTS, { sportId: "tennis", size: 3 })).toEqual([]);
  });

  it("requires the organiser to play the sport", () => {
    const pool = [member("a", 2, ["5:MORNING"]), member("b", 2, ["5:MORNING"])];
    expect(buildGroups(organiser, pool, DEFAULT_WEIGHTS, { sportId: "padel", size: 3 })).toEqual([]);
  });

  it("prefers members who suit the whole group, not only the organiser", () => {
    const pool = [
      member("close", 2, ["5:MORNING"]),
      member("far-level", 4, ["5:MORNING"]),
      member("good", 2, ["5:MORNING"]),
    ];
    const [best] = buildGroups(organiser, pool, DEFAULT_WEIGHTS, { sportId: "tennis", size: 3 });
    expect(best.memberIds.sort()).toEqual(["close", "good"]);
  });

  it("is deterministic and de-duplicates identical groups", () => {
    const pool = [member("a", 2, ["5:MORNING", "2:EVENING"]), member("b", 2, ["5:MORNING", "2:EVENING"])];
    const run = () => buildGroups(organiser, pool, DEFAULT_WEIGHTS, { sportId: "tennis", size: 3 });
    expect(run()).toEqual(run());
    expect(run()).toHaveLength(1);
    expect(run()[0].sharedSlots).toEqual(["2:EVENING", "5:MORNING"]);
  });

  it("maps group sizes to play styles", () => {
    expect(styleForGroupSize(2)).toBe("one_on_one");
    expect(styleForGroupSize(4)).toBe("small_group");
    expect(styleForGroupSize(10)).toBe("large_group");
  });
});
