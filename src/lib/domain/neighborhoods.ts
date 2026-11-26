/**
 * Neighbourhoods are the ONLY location granularity stored or shown.
 * Exact addresses are never collected. `area` clusters adjacent
 * neighbourhoods so the matching engine can reward proximity.
 */
export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island" | "Outside NYC";

export interface Neighborhood {
  slug: string;
  name: string;
  borough: Borough;
  area: string;
}

export const NEIGHBORHOODS: readonly Neighborhood[] = [
  // Manhattan — Downtown
  { slug: "financial-district", name: "Financial District", borough: "Manhattan", area: "downtown" },
  { slug: "battery-park-city", name: "Battery Park City", borough: "Manhattan", area: "downtown" },
  { slug: "tribeca", name: "Tribeca", borough: "Manhattan", area: "downtown" },
  { slug: "soho", name: "SoHo", borough: "Manhattan", area: "downtown" },
  { slug: "nolita", name: "Nolita", borough: "Manhattan", area: "downtown" },
  { slug: "lower-east-side", name: "Lower East Side", borough: "Manhattan", area: "downtown" },
  { slug: "east-village", name: "East Village", borough: "Manhattan", area: "downtown" },
  { slug: "west-village", name: "West Village", borough: "Manhattan", area: "downtown" },
  { slug: "greenwich-village", name: "Greenwich Village", borough: "Manhattan", area: "downtown" },
  // Manhattan — Midtown
  { slug: "chelsea", name: "Chelsea", borough: "Manhattan", area: "midtown" },
  { slug: "flatiron", name: "Flatiron & NoMad", borough: "Manhattan", area: "midtown" },
  { slug: "gramercy", name: "Gramercy", borough: "Manhattan", area: "midtown" },
  { slug: "murray-hill", name: "Murray Hill", borough: "Manhattan", area: "midtown" },
  { slug: "hudson-yards", name: "Hudson Yards", borough: "Manhattan", area: "midtown" },
  { slug: "midtown", name: "Midtown", borough: "Manhattan", area: "midtown" },
  { slug: "midtown-east", name: "Midtown East", borough: "Manhattan", area: "midtown" },
  // Manhattan — Uptown
  { slug: "upper-west-side", name: "Upper West Side", borough: "Manhattan", area: "uptown" },
  { slug: "upper-east-side", name: "Upper East Side", borough: "Manhattan", area: "uptown" },
  { slug: "harlem", name: "Harlem", borough: "Manhattan", area: "uptown" },
  { slug: "morningside-heights", name: "Morningside Heights", borough: "Manhattan", area: "uptown" },
  { slug: "washington-heights", name: "Washington Heights", borough: "Manhattan", area: "uptown" },
  // Beyond Manhattan
  { slug: "brooklyn-heights", name: "Brooklyn Heights & DUMBO", borough: "Brooklyn", area: "north-brooklyn" },
  { slug: "williamsburg", name: "Williamsburg & Greenpoint", borough: "Brooklyn", area: "north-brooklyn" },
  { slug: "park-slope", name: "Park Slope & Prospect Heights", borough: "Brooklyn", area: "brownstone-brooklyn" },
  { slug: "cobble-hill", name: "Cobble Hill & Carroll Gardens", borough: "Brooklyn", area: "brownstone-brooklyn" },
  { slug: "long-island-city", name: "Long Island City", borough: "Queens", area: "western-queens" },
  { slug: "astoria", name: "Astoria", borough: "Queens", area: "western-queens" },
  { slug: "jersey-city", name: "Jersey City & Hoboken", borough: "Outside NYC", area: "hudson-waterfront" },
] as const;

/**
 * Extra areas used only to place venues (golf courses, tennis centres and
 * parks beyond the neighbourhoods members choose from). Members never pick
 * these, so they play no part in matching.
 */
export const VENUE_ONLY_NEIGHBORHOODS: readonly Neighborhood[] = [
  { slug: "roosevelt-island", name: "Roosevelt Island", borough: "Manhattan", area: "midtown" },
  { slug: "randalls-island", name: "Randall's Island", borough: "Manhattan", area: "uptown" },
  { slug: "inwood", name: "Inwood", borough: "Manhattan", area: "uptown" },
  { slug: "downtown-brooklyn", name: "Downtown Brooklyn", borough: "Brooklyn", area: "brownstone-brooklyn" },
  { slug: "south-brooklyn", name: "South Brooklyn", borough: "Brooklyn", area: "south-brooklyn" },
  { slug: "queens-east", name: "Central & eastern Queens", borough: "Queens", area: "eastern-queens" },
  { slug: "bronx", name: "The Bronx", borough: "Bronx", area: "bronx" },
  { slug: "staten-island", name: "Staten Island", borough: "Staten Island", area: "staten-island" },
] as const;

/** Every area a venue can be placed in: member neighbourhoods first. */
export const VENUE_NEIGHBORHOODS: readonly Neighborhood[] = [...NEIGHBORHOODS, ...VENUE_ONLY_NEIGHBORHOODS];

export const VENUE_NEIGHBORHOOD_SLUGS = VENUE_NEIGHBORHOODS.map((n) => n.slug) as [string, ...string[]];

const BY_SLUG = new Map(VENUE_NEIGHBORHOODS.map((n) => [n.slug, n]));

export const NEIGHBORHOOD_SLUGS = NEIGHBORHOODS.map((n) => n.slug) as [string, ...string[]];

export function getNeighborhood(slug: string | null | undefined): Neighborhood | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}

export function neighborhoodName(slug: string | null | undefined): string {
  return getNeighborhood(slug)?.name ?? "New York";
}

export const BOROUGH_ORDER: readonly Borough[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Outside NYC"];

/** Grouped by borough in a fixed order. Pass VENUE_NEIGHBORHOODS for venue forms. */
export function neighborhoodsByBorough(list: readonly Neighborhood[] = NEIGHBORHOODS) {
  const groups = new Map<Borough, Neighborhood[]>(BOROUGH_ORDER.map((b) => [b, []]));
  for (const n of list) {
    groups.set(n.borough, [...(groups.get(n.borough) ?? []), n]);
  }
  return [...groups.entries()].filter(([, l]) => l.length > 0);
}
