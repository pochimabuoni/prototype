import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const RATE_LIMITS = {
  signIn: { limit: 5, windowSeconds: 15 * 60 },
  application: { limit: 3, windowSeconds: 60 * 60 },
  connectionRequest: { limit: 20, windowSeconds: 24 * 60 * 60 },
  invitation: { limit: 20, windowSeconds: 24 * 60 * 60 },
  message: { limit: 60, windowSeconds: 60 },
  report: { limit: 10, windowSeconds: 24 * 60 * 60 },
  checkout: { limit: 10, windowSeconds: 60 * 60 },
  dataExport: { limit: 3, windowSeconds: 24 * 60 * 60 },
  upload: { limit: 20, windowSeconds: 60 * 60 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * Fixed-window limiter backed by Postgres (works across serverless instances).
 * Fails CLOSED: if the limiter cannot be reached the action is refused.
 */
export async function rateLimit(name: RateLimitName, subject: string): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[name];
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: `${name}:${subject}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] error", error.message);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("[rate-limit] unavailable", e);
    return false;
  }
}
