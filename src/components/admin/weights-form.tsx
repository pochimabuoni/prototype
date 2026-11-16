"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMatchingWeights } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import type { MatchWeights } from "@/lib/matching/score";

const FIELDS: { key: keyof MatchWeights; label: string }[] = [
  { key: "availability", label: "Availability overlap" },
  { key: "skill", label: "Skill compatibility" },
  { key: "neighborhood", label: "Neighbourhood proximity" },
  { key: "format", label: "Format compatibility" },
];

export function WeightsForm({ initial }: { initial: MatchWeights }) {
  const [w, setW] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, Math.round(initial[f.key] * 100)])) as Record<keyof MatchWeights, number>);
  const [pending, start] = useTransition();
  const total = FIELDS.reduce((s, f) => s + w[f.key], 0);
  return (
    <div className="flex flex-col gap-6">
      {FIELDS.map((f) => (
        <div key={f.key} className="grid items-center gap-3 sm:grid-cols-[14rem_1fr_4rem]">
          <label htmlFor={`w-${f.key}`} className="text-sm">{f.label}</label>
          <input id={`w-${f.key}`} type="range" min={0} max={100} step={5} value={w[f.key]} onChange={(e) => setW({ ...w, [f.key]: Number(e.target.value) })} className="accent-[var(--ink)]" />
          <span className="text-right font-serif text-xl tabular-nums">{w[f.key]}%</span>
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        Total {total}%. {total !== 100 ? "Weights are normalised to 100% when scoring." : ""} A shared sport is always required regardless of weights.
      </p>
      <Button className="self-start" disabled={pending || total === 0} onClick={() => start(async () => {
        const r = await updateMatchingWeights(Object.fromEntries(FIELDS.map((f) => [f.key, w[f.key] / 100])));
        if (r.ok) toast.success(r.message ?? "Saved"); else toast.error(r.error);
      })}>{pending ? "Saving…" : "Save weights"}</Button>
    </div>
  );
}
