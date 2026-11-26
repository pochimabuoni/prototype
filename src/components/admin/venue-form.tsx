"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { saveVenue, setVenueActive } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { NeighborhoodSelect } from "@/components/forms/neighborhood-select";
import { VENUE_NEIGHBORHOODS } from "@/lib/domain/neighborhoods";
import { VENUE_ACCESS, type VenueAccess } from "@/lib/domain/venues";

export interface VenueRow {
  id: string;
  name: string;
  slug: string;
  neighborhood: string;
  location: string;
  description: string | null;
  access: VenueAccess;
  access_note: string | null;
  indoor: boolean;
  seasonal: boolean;
  website: string | null;
  sort_order: number;
  sportIds: string[];
}

export function VenueForm({ venue, sports }: { venue?: VenueRow; sports: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveVenue, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const p = venue?.id ?? "new";
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      {state ? <Alert variant={state.ok ? "success" : "destructive"} className="sm:col-span-2">{state.ok ? state.message : state.error}</Alert> : null}
      {venue?.id ? <input type="hidden" name="id" value={venue.id} /> : null}
      <FormField id={`${p}-name`} label="Name" error={fe.name}><Input id={`${p}-name`} name="name" defaultValue={venue?.name} required /></FormField>
      <FormField id={`${p}-slug`} label="Slug" error={fe.slug}><Input id={`${p}-slug`} name="slug" defaultValue={venue?.slug} required /></FormField>
      <FormField id={`${p}-hood`} label="Neighbourhood" error={fe.neighborhood}>
        <NeighborhoodSelect id={`${p}-hood`} name="neighborhood" options={VENUE_NEIGHBORHOODS} placeholder="Select an area…" defaultValue={venue?.neighborhood ?? ""} />
      </FormField>
      <FormField id={`${p}-location`} label="Location" error={fe.location} hint="A street, pier or park entrance. No booking details.">
        <Input id={`${p}-location`} name="location" defaultValue={venue?.location} required />
      </FormField>
      <FormField id={`${p}-description`} label="Description" error={fe.description} className="sm:col-span-2">
        <Textarea id={`${p}-description`} name="description" rows={3} maxLength={600} defaultValue={venue?.description ?? ""} />
      </FormField>
      <FormField id={`${p}-access`} label="Access" error={fe.access}>
        <NativeSelect id={`${p}-access`} name="access" defaultValue={venue?.access ?? "FREE_PUBLIC"}>
          {VENUE_ACCESS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </NativeSelect>
      </FormField>
      <FormField id={`${p}-access-note`} label="Access note" error={fe.accessNote} hint="e.g. permit needed, first come first served.">
        <Input id={`${p}-access-note`} name="accessNote" maxLength={300} defaultValue={venue?.access_note ?? ""} />
      </FormField>
      <FormField id={`${p}-website`} label="Website" error={fe.website}>
        <Input id={`${p}-website`} name="website" type="url" placeholder="https://" defaultValue={venue?.website ?? ""} />
      </FormField>
      <FormField id={`${p}-sort`} label="Sort order"><Input id={`${p}-sort`} name="sortOrder" type="number" defaultValue={venue?.sort_order ?? 100} /></FormField>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="indoor" defaultChecked={venue?.indoor} className="size-4 accent-[var(--ink)]" /> Indoor</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="seasonal" defaultChecked={venue?.seasonal} className="size-4 accent-[var(--ink)]" /> Seasonal</label>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="mb-3 text-sm font-medium">Sports played here</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {sports.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sportIds" value={s.id} defaultChecked={venue?.sportIds.includes(s.id)} className="size-4 accent-[var(--ink)]" />
              {s.name}
            </label>
          ))}
        </div>
        {fe.sportIds ? <p role="alert" className="mt-2 text-xs text-destructive">{fe.sportIds}</p> : null}
      </fieldset>
      <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : venue ? "Save changes" : "Add venue"}</Button></div>
    </form>
  );
}

export function VenueToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant={active ? "ghost" : "outline"} disabled={pending} onClick={() => start(async () => {
      const r = await setVenueActive(id, !active);
      if (!r.ok) toast.error(r.error);
    })}>{active ? "Hide from directory" : "Show in directory"}</Button>
  );
}
