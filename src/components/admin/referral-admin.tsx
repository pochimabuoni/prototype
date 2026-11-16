"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { createReferralCode, setReferralActive } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export function ReferralForm() {
  const [state, action, pending] = useActionState(createReferralCode, null);
  const fe = state && !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      {state ? <Alert variant={state.ok ? "success" : "destructive"} className="sm:col-span-2 lg:col-span-5">{state.ok ? state.message : state.error}</Alert> : null}
      <FormField id="code" label="Code" error={fe.code}><Input id="code" name="code" className="uppercase" required /></FormField>
      <FormField id="description" label="Description" error={fe.description}><Input id="description" name="description" /></FormField>
      <FormField id="maxUses" label="Max uses" error={fe.maxUses}><Input id="maxUses" name="maxUses" type="number" min={1} placeholder="Unlimited" /></FormField>
      <FormField id="expiresAt" label="Expires" error={fe.expiresAt}><Input id="expiresAt" name="expiresAt" type="date" /></FormField>
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create code"}</Button>
    </form>
  );
}

export function ReferralToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
      const r = await setReferralActive(id, !active);
      if (!r.ok) toast.error(r.error);
    })}>{active ? "Deactivate" : "Activate"}</Button>
  );
}
