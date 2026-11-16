"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/auth/viewer";
import { getStripe } from "@/lib/billing/stripe";
import { isStripeConfigured } from "@/lib/env.server";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

const deleteSchema = z.object({ confirm: z.literal("DELETE") });

/**
 * Permanent account deletion: cancels any Stripe subscription immediately,
 * removes stored photos, then deletes the auth user (cascading to all
 * personal rows). Audit/report rows keep only nulled references.
 */
export async function deleteAccount(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return fail("Please sign in.");
  if (!deleteSchema.safeParse({ confirm: formData.get("confirm") }).success) return fail('Type "DELETE" to confirm.');
  if (viewer.role === "ADMIN") return fail("Administrator accounts must be removed by another administrator.");

  const admin = createAdminClient();
  try {
    const { data: sub } = await admin.from("subscriptions").select("stripe_subscription_id, status").eq("user_id", viewer.id).maybeSingle();
    if (sub && isStripeConfigured() && !["canceled", "incomplete_expired"].includes(sub.status) && !sub.stripe_subscription_id.startsWith("sub_seed_")) {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id);
    }

    const { data: files } = await admin.storage.from("avatars").list(viewer.id);
    if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${viewer.id}/${f.name}`));
    const { data: apps } = await admin.from("membership_applications").select("photo_path").eq("user_id", viewer.id);
    const appPhotos = (apps ?? []).map((a) => a.photo_path).filter((p): p is string => !!p);
    if (appPhotos.length) await admin.storage.from("application-photos").remove(appPhotos);
    await admin.from("membership_applications").delete().eq("user_id", viewer.id);

    const { error } = await admin.auth.admin.deleteUser(viewer.id);
    if (error) throw error;
  } catch (e) {
    console.error("[account] deletion failed", e);
    return fail(GENERIC_ERROR);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
