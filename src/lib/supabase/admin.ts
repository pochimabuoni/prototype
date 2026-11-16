import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Service-role client. BYPASSES Row Level Security.
 * Use only from trusted server code AFTER explicit authorization checks
 * (Stripe webhooks, application intake, audited admin actions).
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminSupabase = ReturnType<typeof createAdminClient>;
