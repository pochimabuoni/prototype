"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { respondToConnection, cancelConnection } from "@/actions/connections";
import { Button } from "@/components/ui/button";

export function ConnectionActions({ id, kind }: { id: string; kind: "incoming" | "outgoing" | "connected" }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Done");
      else toast.error(r.error ?? "Something went wrong");
    });
  if (kind === "incoming") {
    return (
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => run(() => respondToConnection(id, true))}>Accept</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => respondToConnection(id, false))}>Decline</Button>
      </div>
    );
  }
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => cancelConnection(id))}>
      {kind === "outgoing" ? "Withdraw" : "Remove"}
    </Button>
  );
}
