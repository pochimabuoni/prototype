"use client";

import { useActionState } from "react";
import { deleteAccount } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, null);
  return (
    <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <FormField id="confirm" label='Type "DELETE" to confirm' error={state && !state.ok ? state.error : undefined} className="flex-1">
        <Input id="confirm" name="confirm" autoComplete="off" />
      </FormField>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Deleting…" : "Delete my account"}</Button>
    </form>
  );
}
