import type { Enums } from "@/types/database";

export type TimeBlock = Enums<"time_block">;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const TIME_BLOCKS: readonly { value: TimeBlock; label: string; hours: string }[] = [
  { value: "EARLY_MORNING", label: "Early morning", hours: "6–8am" },
  { value: "MORNING", label: "Morning", hours: "8–11am" },
  { value: "MIDDAY", label: "Midday", hours: "11am–2pm" },
  { value: "AFTERNOON", label: "Afternoon", hours: "2–6pm" },
  { value: "EVENING", label: "Evening", hours: "6–10pm" },
] as const;

export const TIME_BLOCK_VALUES = TIME_BLOCKS.map((t) => t.value) as [TimeBlock, ...TimeBlock[]];

/** Slot key: "<day 0-6>:<TIME_BLOCK>", day 0 = Monday. */
export type SlotKey = `${number}:${TimeBlock}`;

export function slotKey(day: number, block: TimeBlock): SlotKey {
  return `${day}:${block}` as SlotKey;
}

export function parseSlotKey(key: string): { day: number; block: TimeBlock } | null {
  const [d, b] = key.split(":");
  const day = Number(d);
  if (!Number.isInteger(day) || day < 0 || day > 6) return null;
  if (!TIME_BLOCK_VALUES.includes(b as TimeBlock)) return null;
  return { day, block: b as TimeBlock };
}

export const SLOT_KEY_REGEX = /^[0-6]:(EARLY_MORNING|MORNING|MIDDAY|AFTERNOON|EVENING)$/;

export function blockLabel(block: TimeBlock) {
  return TIME_BLOCKS.find((t) => t.value === block)?.label ?? block;
}

/**
 * Human summary of a set of slots, e.g. "weekend mornings" or "Tue & Thu evenings".
 */
export function describeSlots(slots: Iterable<string>): string {
  const parsed = [...slots].map(parseSlotKey).filter((s): s is NonNullable<typeof s> => !!s);
  if (parsed.length === 0) return "";
  const byBlock = new Map<TimeBlock, Set<number>>();
  for (const { day, block } of parsed) {
    byBlock.set(block, new Set([...(byBlock.get(block) ?? []), day]));
  }
  const phrases: string[] = [];
  for (const t of TIME_BLOCKS) {
    const days = byBlock.get(t.value);
    if (!days) continue;
    const sorted = [...days].sort();
    const blockWord = `${t.label.toLowerCase()}s`;
    const isWeekend = sorted.length === 2 && sorted[0] === 5 && sorted[1] === 6;
    const isWeekdays = sorted.length === 5 && sorted.every((d, i) => d === i);
    if (isWeekend || (sorted.length === 1 && sorted[0] >= 5)) {
      phrases.push(`weekend ${blockWord}`);
    } else if (isWeekdays) {
      phrases.push(`weekday ${blockWord}`);
    } else if (sorted.length === 7) {
      phrases.push(`${blockWord} all week`);
    } else {
      phrases.push(`${sorted.map((d) => DAY_SHORT[d]).join(" & ")} ${blockWord}`);
    }
  }
  return phrases.slice(0, 2).join(", ") + (phrases.length > 2 ? " and more" : "");
}
