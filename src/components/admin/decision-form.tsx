"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { decideApplication } from "@/actions/admissions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DecisionForm({ applicationId, current }: { applicationId: string; current: string }) {
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [pending, start] = useTransition();
  const decide = (decision: "APPROVED" | "REJECTED" | "WAITLISTED") =>
    start(async () => {
      const r = await decideApplication({ applicationId, decision, note, notify });
      if (r.ok) toast.success(r.message ?? "Saved");
      else toast.error(r.error);
    });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Internal note</Label>
        <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to administrators only" maxLength={1000} />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
        Email the applicant about this decision
      </label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || current === "APPROVED"} onClick={() => decide("APPROVED")}>Approve</Button>
        <Button variant="outline" disabled={pending || current === "WAITLISTED"} onClick={() => decide("WAITLISTED")}>Waitlist</Button>
        <Button variant="ghost" disabled={pending || current === "REJECTED"} onClick={() => decide("REJECTED")}>Reject</Button>
      </div>
    </div>
  );
}
