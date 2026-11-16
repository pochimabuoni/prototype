import { requireAdmin } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { VenueForm, VenueToggle } from "@/components/admin/venue-form";
import { neighborhoodName } from "@/lib/domain/neighborhoods";
import { venueAccessLabel, VENUE_DISCLAIMER } from "@/lib/domain/venues";

export const metadata = { title: "Venues" };

export default async function AdminVenues() {
  // Re-check per page (layouts and pages render concurrently).
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: venues }, { data: links }, { data: sports }] = await Promise.all([
    supabase.from("venues").select("*").order("sort_order").order("name"),
    supabase.from("venue_sports").select("venue_id, sport_id"),
    supabase.from("sports").select("id, name").order("sort_order").order("name"),
  ]);
  const sportName = new Map((sports ?? []).map((s) => [s.id, s.name]));
  return (
    <>
      <AdminHeader
        title="Venues"
        description="The public venue guide, shown by sport. Informational only: list places members can use, never imply that Pochi Ma Buoni owns, runs or books them."
      />
      <p className="mb-8 max-w-3xl text-sm text-muted-foreground">{VENUE_DISCLAIMER}</p>
      <section className="mb-12 border border-border bg-ivory p-6">
        <h2 className="mb-6 font-serif text-2xl">Add a venue</h2>
        <VenueForm sports={sports ?? []} />
      </section>
      <ul className="flex flex-col gap-4">
        {(venues ?? []).map((v) => {
          const sportIds = (links ?? []).filter((l) => l.venue_id === v.id).map((l) => l.sport_id);
          return (
            <li key={v.id}>
              <details className="group border border-border bg-card">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5">
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="font-serif text-2xl">{v.name}</span>
                    {!v.is_active ? <Badge variant="muted">hidden</Badge> : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {neighborhoodName(v.neighborhood)} · {venueAccessLabel(v.access, true)} · {sportIds.map((id) => sportName.get(id)).filter(Boolean).join(", ") || "no sports"} · edit
                  </span>
                </summary>
                <div className="border-t border-border p-5">
                  <VenueForm venue={{ ...v, sportIds }} sports={sports ?? []} />
                  <div className="mt-6 border-t border-border pt-4"><VenueToggle id={v.id} active={v.is_active} /></div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
