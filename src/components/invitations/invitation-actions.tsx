"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateInvitationStatus } from "@/actions/invitations";
import { Button } from "@/components/ui/button";

type Action = "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";
const LABELS: Record<Action, string> = { ACCEPTED: "Accept", DECLINED: "Decline", CANCELLED: "Cancel", COMPLETED: "Mark as played" };

export function InvitationActions({ id, actions }: { id: string; actions: Action[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <Button
          key={a}
          size="sm"
          variant={i === 0 && (a === "ACCEPTED" || a === "COMPLETED") ? "default" : a === "CANCELLED" ? "ghost" : "outline"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await updateInvitationStatus(id, a);
              if (r.ok) toast.success(r.message ?? "Updated");
              else toast.error(r.error);
            })
          }
        >
          {LABELS[a]}
        </Button>
      ))}
    </div>
  );
}
