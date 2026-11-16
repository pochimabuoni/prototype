import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import { neighborhoodName } from "@/lib/domain/neighborhoods";

export type Venue = Pick<
  Tables<"venues">,
  "id" | "slug" | "name" | "neighborhood" | "location" | "description" | "access" | "access_note" | "indoor" | "seasonal" | "website"
> & { neighborhoodName: string; note: string | null };

export interface SportVenues {
  sport: { id: string; slug: string; name: string };
  venues: Venue[];
}



/**
 * Every active sport with its active venues (RLS hides inactive ones from
 * visitors and members). Sports without venues are included with an empty list.
 */
export async function getVenueDirectory(): Promise<SportVenues[]> {
  const supabase = await createClient();
  const [{ data: sports, error: e1 }, { data: venues, error: e2 }, { data: links, error: e3 }] = await Promise.all([
    supabase.from("sports").select("id, slug, name").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("venues").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("venue_sports").select("venue_id, sport_id, note"),
  ]);
  if (e1 || e2 || e3) {
    console.error("[venues] load failed", (e1 ?? e2 ?? e3)?.message);
    return [];
  }
  const byId = new Map(venues.map((v) => [v.id, v]));
  return sports.map((sport) => ({
    sport,
    venues: links
      .filter((l) => l.sport_id === sport.id && byId.has(l.venue_id))
      .map((l) => ({ row: byId.get(l.venue_id)!, note: l.note }))
      .sort((a, b) => a.row.sort_order - b.row.sort_order || a.row.name.localeCompare(b.row.name))
      .map(({ row, note }) => toVenue(row, note)),
  }));
}

function toVenue(row: Tables<"venues">, note: string | null): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    neighborhood: row.neighborhood,
    neighborhoodName: neighborhoodName(row.neighborhood),
    location: row.location,
    description: row.description,
    access: row.access,
    access_note: row.access_note,
    indoor: row.indoor,
    seasonal: row.seasonal,
    website: row.website,
    note,
  };
}

export async function getSportVenues(slug: string): Promise<SportVenues | null> {
  const all = await getVenueDirectory();
  return all.find((s) => s.sport.slug === slug) ?? null;
}

/** Venue names per sport id, for invitation suggestions. */
export async function venueNamesBySport(): Promise<Record<string, string[]>> {
  const all = await getVenueDirectory();
  return Object.fromEntries(all.map((s) => [s.sport.id, s.venues.map((v) => v.name)]));
}
