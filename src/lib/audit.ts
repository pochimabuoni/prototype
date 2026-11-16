import "server-only";
import type { AdminSupabase } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export async function logAdminAction(
  admin: AdminSupabase,
  entry: { actorId: string; action: string; targetType: string; targetId?: string | null; metadata?: Record<string, Json | undefined> },
) {
  const { error } = await admin.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    target_type: entry.targetType,
    target_id: entry.targetId ?? null,
    metadata: (entry.metadata ?? {}) as Json,
  });
  if (error) {
    // Audit failures must be visible; never silently drop them.
    console.error("[audit] failed to record", entry.action, error.message);
    throw new Error("Could not record audit log entry.");
  }
}

/** Throttled "last seen" stamp used for the admin activity metric. */
export async function touchLastActive(admin: AdminSupabase, userId: string) {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  await admin
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId)
    .or(`last_active_at.is.null,last_active_at.lt.${hourAgo}`);
}
