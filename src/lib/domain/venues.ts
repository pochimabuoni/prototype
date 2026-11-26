import type { Enums } from "@/types/database";

export type VenueAccess = Enums<"venue_access">;

export const VENUE_ACCESS: { value: VenueAccess; label: string; short: string }[] = [
  { value: "FREE_PUBLIC", label: "Free and open to the public", short: "Free, public" },
  { value: "PERMIT_OR_RESERVATION", label: "Public, permit or reservation needed", short: "Permit or reservation" },
  { value: "PAID_OR_MEMBERSHIP", label: "Paid entry, court fees or membership", short: "Paid or membership" },
];

export function venueAccessLabel(v: VenueAccess, short = false): string {
  const a = VENUE_ACCESS.find((x) => x.value === v);
  return a ? (short ? a.short : a.label) : v;
}

/** Shown wherever venues appear. */
export const VENUE_DISCLAIMER =
  "Pochi Ma Buoni does not own, operate, manage or book any of these venues. Details are offered as a guide only and can change. Check access, permits, seasons and fees with each venue before you play.";

/**
 * Official and community registers for the thousands of public courts and
 * fields not listed one by one in the directory.
 */
export const PUBLIC_FACILITY_REGISTERS: { label: string; detail: string; href: string }[] = [
  { label: "NYC Parks", detail: "Search every park by facility and borough", href: "https://www.nycgovparks.org/parks" },
  { label: "Tennis courts", detail: "NYC Parks courts and permits", href: "https://www.nycgovparks.org/facilities/tennis" },
  { label: "Basketball courts", detail: "NYC Parks courts by borough", href: "https://www.nycgovparks.org/facilities/basketball" },
  { label: "Recreation centres", detail: "Gyms, pools and courts run by NYC Parks", href: "https://www.nycgovparks.org/facilities/recreationcenters" },
  { label: "Indoor pools", detail: "Year-round NYC Parks pools", href: "https://www.nycgovparks.org/facilities/indoor-pools" },
  { label: "Outdoor pools", detail: "Free summer pools", href: "https://www.nycgovparks.org/facilities/outdoor-pools" },
  { label: "Golf courses", detail: "NYC public courses and tee times", href: "https://www.nycgovparks.org/facilities/golf" },
  { label: "Athletic facilities data", detail: "NYC Open Data, every listed facility", href: "https://data.cityofnewyork.us/d/qnem-b8re" },
  { label: "Tennis City court map", detail: "Public court map for the five boroughs", href: "https://nyc.tenniscity.org/map/" },
  { label: "Field Permits", detail: "Searchable citywide fields", href: "https://fieldpermits.com/nyc" },
];
