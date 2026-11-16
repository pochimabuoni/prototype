"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { unblockMember } from "@/actions/safety";
import { Button } from "@/components/ui/button";

export function UnblockButton({ memberId }: { memberId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => {
      const r = await unblockMember(memberId);
      if (r.ok) toast.success(r.message ?? "Unblocked");
      else toast.error(r.error);
    })}>
      Unblock
    </Button>
  );
}
