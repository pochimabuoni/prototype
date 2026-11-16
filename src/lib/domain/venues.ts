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
