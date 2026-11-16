"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { blockMember, reportMember } from "@/actions/safety";
import { REPORT_REASONS } from "@/lib/validation/community";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function SafetyActions({ memberId, memberName, messageId }: { memberId: string; memberName: string; messageId?: string }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.16em]">
      <ReportDialog memberId={memberId} memberName={memberName} messageId={messageId} />
      <BlockDialog memberId={memberId} memberName={memberName} />
    </div>
  );
}

export function BlockDialog({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-stone underline-offset-4 hover:text-destructive hover:underline">Block</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block {memberName}?</DialogTitle>
          <DialogDescription>
            You won&apos;t see each other in the community, open invitations will be cancelled, and neither of you will be able to
            message the other. They are not notified. You can unblock from Settings.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await blockMember(memberId);
              if (r.ok) {
                toast.success(r.message ?? "Blocked");
                setOpen(false);
                router.push("/discover");
              } else toast.error(r.error);
            })
          }
        >
          {pending ? "Blocking…" : "Block member"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function ReportDialog({ memberId, memberName, messageId, label = "Report" }: { memberId: string; memberName: string; messageId?: string; label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-stone underline-offset-4 hover:text-ink hover:underline">{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {memberName}</DialogTitle>
          <DialogDescription>Reports are confidential and reviewed by our team. If you are in immediate danger, call 911.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-reason">Reason</Label>
          <NativeSelect id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Choose a reason…</option>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-details">Details</Label>
          <Textarea id="report-details" value={details} maxLength={2000} onChange={(e) => setDetails(e.target.value)} placeholder="What happened? (optional)" />
        </div>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox checked={alsoBlock} onCheckedChange={(c) => setAlsoBlock(c === true)} />
          Also block this member
        </label>
        <Button
          disabled={pending || !reason}
          onClick={() =>
            start(async () => {
              const r = await reportMember({ reportedUserId: memberId, messageId, reason, details, alsoBlock });
              if (r.ok) {
                toast.success(r.message ?? "Report submitted");
                setOpen(false);
                if (alsoBlock) router.push("/discover");
              } else toast.error(r.error);
            })
          }
        >
          {pending ? "Submitting…" : "Submit report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
