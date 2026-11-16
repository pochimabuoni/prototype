import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { AdminSupabase } from "@/lib/supabase/admin";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/**
 * Batch-sign private avatar paths with the VIEWER's client, so storage RLS
 * decides who may see which portrait.
 */
export async function signAvatarUrls(supabase: ServerSupabase | AdminSupabase, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((p): p is string => !!p))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrls(unique, SIGNED_URL_TTL);
  if (error || !data) return map;
  for (const item of data) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}
