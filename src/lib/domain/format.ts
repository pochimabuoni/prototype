/** Formatting helpers (New York time). */
export function formatInvitationWhen(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T12:00:00Z`);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  const hour = ((h ?? 0) % 12) || 12;
  const suffix = (h ?? 0) < 12 ? "am" : "pm";
  return `${day}, ${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

export function formatRelative(iso: string, now = new Date()): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));
}

export function formatMessageTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

export function todayInNewYork(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}
