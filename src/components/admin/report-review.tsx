"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateReport } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReportReview({ reportId, status, note: initialNote }: { reportId: string; status: string; note: string | null }) {
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, start] = useTransition();
  const set = (s: "REVIEWING" | "RESOLVED" | "DISMISSED") =>
    start(async () => {
      const r = await updateReport({ reportId, status: s, note });
      if (r.ok) toast.success(r.message ?? "Updated"); else toast.error(r.error);
    });
  return (
    <div className="flex flex-col gap-3">
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Resolution note" aria-label="Resolution note" maxLength={2000} />
      <div className="flex flex-wrap gap-2">
        {status === "OPEN" ? <Button size="sm" variant="outline" disabled={pending} onClick={() => set("REVIEWING")}>Mark reviewing</Button> : null}
        <Button size="sm" disabled={pending} onClick={() => set("RESOLVED")}>Resolve</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => set("DISMISSED")}>Dismiss</Button>
      </div>
    </div>
  );
}
