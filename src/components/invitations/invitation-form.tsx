"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { invitationDetailsSchema, type InvitationDetailsInput } from "@/lib/validation/community";
import { createGroupInvitation, createInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";

export function InvitationForm({
  recipientIds,
  sports,
  defaultSportId,
  minDate,
  venuesBySport = {},
}: {
  /** One id for a one-on-one invitation, several for a group. */
  recipientIds: string[];
  sports: { id: string; name: string }[];
  defaultSportId?: string;
  minDate: string;
  /** Directory venue names per sport id, offered as suggestions. */
  venuesBySport?: Record<string, string[]>;
}) {
  const isGroup = recipientIds.length > 1;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError, control } = useForm<InvitationDetailsInput>({
    resolver: zodResolver(invitationDetailsSchema),
    defaultValues: { sportId: defaultSportId ?? sports[0]?.id ?? "", proposedDate: "", proposedTime: "08:00", locationNote: "", message: "" },
  });
  const e = formState.errors;
  const sportId = useWatch({ control, name: "sportId" });
  const suggestions = venuesBySport[sportId] ?? [];
  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={handleSubmit((data) =>
        start(async () => {
          setErr(null);
          const r = isGroup ? await createGroupInvitation({ ...data, recipientIds }) : await createInvitation({ ...data, recipientId: recipientIds[0] });
          if (r.ok) {
            toast.success(r.message ?? "Invitation sent");
            router.push("/invitations");
          } else {
            setErr(r.error);
            for (const [k, v] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof InvitationDetailsInput, { message: v });
          }
        }),
      )}
    >
      {error ? <Alert variant="destructive">{error}</Alert> : null}
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
        <Input id="locationNote" maxLength={160} list={suggestions.length ? "venue-suggestions" : undefined} {...register("locationNote")} />
      </FormField>
      {suggestions.length ? (
        <datalist id="venue-suggestions">
          {suggestions.map((v) => <option key={v} value={v} />)}
        </datalist>
      ) : null}
      <FormField id="message" label="Message" error={e.message?.message}>
        <Textarea id="message" rows={3} maxLength={500} placeholder="Optional" {...register("message")} />
      </FormField>
      <Button type="submit" size="lg" disabled={pending} className="self-start">{pending ? "Sending…" : isGroup ? `Send ${recipientIds.length} invitations` : "Send invitation"}</Button>
    </form>
  );
}
