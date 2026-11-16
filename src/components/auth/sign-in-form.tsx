"use client";

import { useActionState } from "react";
import { requestMagicLink } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export function SignInForm({ next, submitLabel = "Email me a sign-in link" }: { next?: string; submitLabel?: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, null);

  if (state?.ok) {
    return (
      <Alert variant="success" className="text-base">
        {state.message}
        <span className="mt-1 block text-sm text-muted-foreground">The link expires after one hour. You can close this tab.</span>
      </Alert>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <FormField id="email" label="Email address" error={state && !state.ok ? state.error : undefined}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          aria-invalid={state && !state.ok ? true : undefined}
          aria-describedby={state && !state.ok ? "email-error" : undefined}
        />
      </FormField>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
