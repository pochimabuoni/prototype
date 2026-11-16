"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { suspendMember, reinstateMember } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function MemberAdminActions({ userId, name, suspended, hasSubscription }: { userId: string; name: string; suspended: boolean; hasSubscription: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [cancel, setCancel] = useState(false);
  const [pending, start] = useTransition();
  if (suspended) {
    return (
      <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => {
        const r = await reinstateMember(userId);
        if (r.ok) toast.success(r.message ?? "Reinstated"); else toast.error(r.error);
      })}>Reinstate</Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost">Suspend</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {name}?</DialogTitle>
          <DialogDescription>Access to the community is revoked immediately (enforced in the database). The reason is recorded in the audit log.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" maxLength={500} aria-label="Reason" />
        {hasSubscription ? (
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={cancel} onCheckedChange={(c) => setCancel(c === true)} />
            Also cancel their subscription at the end of the billing period
          </label>
        ) : null}
        <Button variant="destructive" disabled={pending || reason.trim().length < 3} onClick={() => start(async () => {
          const r = await suspendMember({ userId, reason, cancelSubscription: cancel });
          if (r.ok) { toast.success(r.message ?? "Suspended"); setOpen(false); } else toast.error(r.error);
        })}>{pending ? "Suspending…" : "Suspend member"}</Button>
      </DialogContent>
    </Dialog>
  );
}
