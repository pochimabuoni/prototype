"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { invitationSchema, type InvitationInput } from "@/lib/validation/community";
import { createInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export function InvitationForm({
  recipientId,
  sports,
  defaultSportId,
  minDate,
}: {
  recipientId: string;
  sports: { id: string; name: string }[];
  defaultSportId?: string;
  minDate: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError } = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: { recipientId, sportId: defaultSportId ?? sports[0]?.id ?? "", proposedDate: "", proposedTime: "08:00", locationNote: "", message: "" },
  });
  const e = formState.errors;
  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={handleSubmit((data) =>
        start(async () => {
          setErr(null);
          const r = await createInvitation(data);
          if (r.ok) {
            toast.success(r.message ?? "Invitation sent");
            router.push("/invitations");
          } else {
            setErr(r.error);
            for (const [k, v] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof InvitationInput, { message: v });
          }
        }),
      )}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <input type="hidden" {...register("recipientId")} />
      <FormField id="sportId" label="Sport" required error={e.sportId?.message}>
        <NativeSelect id="sportId" {...register("sportId")}>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
      </FormField>
      <div className="grid gap-8 sm:grid-cols-2">
        <FormField id="proposedDate" label="Date" required error={e.proposedDate?.message}>
          <Input id="proposedDate" type="date" min={minDate} {...register("proposedDate")} />
        </FormField>
        <FormField id="proposedTime" label="Time" required error={e.proposedTime?.message} hint="New York time">
          <Input id="proposedTime" type="time" step={900} {...register("proposedTime")} />
        </FormField>
      </div>
      <FormField id="locationNote" label="Venue or area" required error={e.locationNote?.message} hint="A general suggestion, e.g. “Hudson River Park courts” or “Central Park reservoir”. You arrange any booking together.">
        <Input id="locationNote" maxLength={160} {...register("locationNote")} />
      </FormField>
      <FormField id="message" label="Message" error={e.message?.message}>
        <Textarea id="message" rows={3} maxLength={500} placeholder="Optional" {...register("message")} />
      </FormField>
      <Button type="submit" size="lg" disabled={pending} className="self-start">{pending ? "Sending…" : "Send invitation"}</Button>
    </form>
  );
}
