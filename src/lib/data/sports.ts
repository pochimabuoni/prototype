import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Sport = Pick<Tables<"sports">, "id" | "slug" | "name" | "skill_levels" | "formats">;

export async function getActiveSports(): Promise<Sport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports")
    .select("id, slug, name, skill_levels, formats")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("[sports] load failed", error.message);
    return [];
  }
  return data;
}
