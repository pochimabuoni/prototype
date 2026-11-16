import { ArrowUpRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { venueAccessLabel } from "@/lib/domain/venues";
import type { Venue } from "@/lib/data/venues";

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <article className="flex h-full flex-col border border-border bg-card">
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={venue.access === "FREE_PUBLIC" ? "steel" : "outline"}>{venueAccessLabel(venue.access, true)}</Badge>
          <Badge variant="muted">{venue.indoor ? "Indoor" : "Outdoor"}</Badge>
          {venue.seasonal ? <Badge variant="muted">Seasonal</Badge> : null}
        </div>
        <div>
          <h3 className="font-serif text-2xl leading-tight">{venue.name}</h3>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-graphite">
            <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0 text-stone" />
            <span>
              {venue.location}
              <span className="text-stone"> · {venue.neighborhoodName}</span>
            </span>
          </p>
        </div>
        {venue.description ? <p className="text-sm leading-relaxed text-muted-foreground">{venue.description}</p> : null}
        {venue.note ? <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-steel">{venue.note}</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-xs text-muted-foreground">
        <span className="min-w-0 flex-1">{venue.access_note ?? venueAccessLabel(venue.access)}</span>
        {venue.website ? (
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline"
          >
            Website <ArrowUpRight aria-hidden className="size-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
