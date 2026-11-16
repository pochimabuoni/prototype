"use client";

import { DAY_SHORT, TIME_BLOCKS, slotKey } from "@/lib/domain/availability";
import { cn } from "@/lib/utils";

/** Week × time-of-day selector. Toggle buttons with aria-pressed (no drag gestures). */
export function AvailabilityGrid({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const selected = new Set(value);
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };
  return (
    <div role="group" aria-label="Weekly availability" aria-describedby={describedBy} className={cn("overflow-x-auto", invalid && "outline outline-1 outline-destructive")}>
      <table className="w-full min-w-[20rem] table-fixed border-collapse text-center">
        <thead>
          <tr>
            <th className="w-24 sm:w-28" />
            {DAY_SHORT.map((d) => (
              <th key={d} scope="col" className="pb-2 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-stone">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_BLOCKS.map((block) => (
            <tr key={block.value}>
              <th scope="row" className="pr-2 text-left align-middle">
                <span className="block text-xs text-ink">{block.label}</span>
                <span className="block text-[0.625rem] text-stone">{block.hours}</span>
              </th>
              {DAY_SHORT.map((d, day) => {
                const key = slotKey(day, block.value);
                const on = selected.has(key);
                return (
                  <td key={key} className="p-0.5">
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${d} ${block.label}`}
                      onClick={() => toggle(key)}
                      className={cn(
                        "h-9 w-full border transition-colors",
                        on ? "border-ink bg-ink" : "border-sand bg-card hover:border-ink/50",
                      )}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
