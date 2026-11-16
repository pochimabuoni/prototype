"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { requestConnection, respondToConnection } from "@/actions/connections";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ConnectionState } from "@/lib/data/members";

export function ConnectButton({ memberId, state, compact = false }: { memberId: string; state: ConnectionState; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const size = compact ? "sm" : "default";

  if (state.kind === "connected") {
    return (
      <Button asChild size={size} variant="outline">
        <Link href={`/members/${memberId}#message`}>Connected</Link>
      </Button>
    );
  }
  if (state.kind === "outgoing") {
    return (
      <Button size={size} variant="ghost" disabled>
        Request sent
      </Button>
    );
  }
  if (state.kind === "incoming") {
    return (
      <Button
        size={size}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await respondToConnection(state.id, true);
            if (r.ok) toast.success(r.message ?? "Connected");
            else toast.error(r.error);
          })
        }
      >
        Accept request
      </Button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size}>Connect</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request to connect</DialogTitle>
          <DialogDescription>Add a short note — mention what you&apos;d like to play. Connected members can message each other.</DialogDescription>
        </DialogHeader>
        <label htmlFor={`note-${memberId}`} className="sr-only">
          Note
        </label>
        <Textarea id={`note-${memberId}`} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (300 characters)" />
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await requestConnection({ memberId, note });
              if (r.ok) {
                toast.success(r.message ?? "Request sent");
                setOpen(false);
              } else toast.error(r.error);
            })
          }
        >
          {pending ? "Sending…" : "Send request"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
