import { describe, expect, it } from "vitest";
import { CLUB_GROUPS, HOTELS, HOTEL_TIERS, PRIVATE_CLUBS } from "@/lib/domain/city-guide";
import { NEIGHBORHOOD_SLUGS, VENUE_NEIGHBORHOOD_SLUGS, neighborhoodsByBorough } from "@/lib/domain/neighborhoods";
import { neighborhoodSchema, venueNeighborhoodSchema } from "@/lib/validation/common";

describe("city guide data", () => {
  it("has all 47 clubs and 55 hotels from the directory, each in a known group", () => {
    expect(PRIVATE_CLUBS).toHaveLength(47);
    expect(HOTELS).toHaveLength(55);
    const groups = new Set(CLUB_GROUPS.map((g) => g.value));
    const tiers = new Set(HOTEL_TIERS.map((t) => t.value));
    expect(PRIVATE_CLUBS.every((c) => groups.has(c.group))).toBe(true);
    expect(HOTELS.every((h) => tiers.has(h.tier))).toBe(true);
    expect(HOTELS.map((h) => h.rank)).toEqual(Array.from({ length: 55 }, (_, i) => i + 1));
  });
});

describe("venue areas", () => {
  it("lets venues sit in outer-borough areas that members cannot choose", () => {
    expect(venueNeighborhoodSchema.safeParse("bronx").success).toBe(true);
    expect(neighborhoodSchema.safeParse("bronx").success).toBe(false);
    expect(VENUE_NEIGHBORHOOD_SLUGS).toEqual(expect.arrayContaining(NEIGHBORHOOD_SLUGS));
  });

  it("keeps the member neighbourhood picker unchanged", () => {
    const slugs = neighborhoodsByBorough().flatMap(([, list]) => list.map((n) => n.slug));
    expect(slugs.sort()).toEqual([...NEIGHBORHOOD_SLUGS].sort());
  });
});
