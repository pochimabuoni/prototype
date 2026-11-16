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

const BY_SLUG = new Map(NEIGHBORHOODS.map((n) => [n.slug, n]));

export const NEIGHBORHOOD_SLUGS = NEIGHBORHOODS.map((n) => n.slug) as [string, ...string[]];

export function getNeighborhood(slug: string | null | undefined): Neighborhood | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}

export function neighborhoodName(slug: string | null | undefined): string {
  return getNeighborhood(slug)?.name ?? "New York";
}

export function neighborhoodsByBorough() {
  const groups = new Map<Borough, Neighborhood[]>();
  for (const n of NEIGHBORHOODS) {
    groups.set(n.borough, [...(groups.get(n.borough) ?? []), n]);
  }
  return [...groups.entries()];
}
