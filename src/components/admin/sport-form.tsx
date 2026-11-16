"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { saveSport, setSportActive } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export interface SportRow { id?: string; name: string; slug: string; skill_levels: string[]; formats: string[]; sort_order: number }

export function SportForm({ sport }: { sport?: SportRow }) {
  const [state, action, pending] = useActionState(saveSport, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  const p = sport?.id ?? "new";
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      {state ? <Alert variant={state.ok ? "success" : "destructive"} className="sm:col-span-2">{state.ok ? state.message : state.error}</Alert> : null}
      {sport?.id ? <input type="hidden" name="id" value={sport.id} /> : null}
      <FormField id={`${p}-name`} label="Name" error={fe.name}><Input id={`${p}-name`} name="name" defaultValue={sport?.name} required /></FormField>
      <FormField id={`${p}-slug`} label="Slug" error={fe.slug}><Input id={`${p}-slug`} name="slug" defaultValue={sport?.slug} required /></FormField>
      <FormField id={`${p}-levels`} label="Skill levels (ordered, one per line)" error={fe.skillLevels} hint="From least to most experienced — order drives matching.">
        <Textarea id={`${p}-levels`} name="skillLevels" rows={5} defaultValue={sport?.skill_levels.join("\n")} />
      </FormField>
      <FormField id={`${p}-formats`} label="Formats (one per line)" error={fe.formats}>
        <Textarea id={`${p}-formats`} name="formats" rows={5} defaultValue={sport?.formats.join("\n")} />
      </FormField>
      <FormField id={`${p}-sort`} label="Sort order"><Input id={`${p}-sort`} name="sortOrder" type="number" defaultValue={sport?.sort_order ?? 100} /></FormField>
      <div className="flex items-end"><Button type="submit" disabled={pending}>{pending ? "Saving…" : sport ? "Save changes" : "Add sport"}</Button></div>
    </form>
  );
}

export function SportToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant={active ? "ghost" : "outline"} disabled={pending} onClick={() => start(async () => {
      const r = await setSportActive(id, !active);
      if (!r.ok) toast.error(r.error);
    })}>{active ? "Deactivate" : "Activate"}</Button>
  );
}
