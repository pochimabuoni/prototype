"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { siteUrl } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/stage";
import { type ActionResult, fail, GENERIC_ERROR } from "@/lib/action-result";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address.")),
  next: z.string().optional(),
});

/** Passwordless sign-in: emails a single-use magic link. */
export async function requestMagicLink(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ email: formData.get("email"), next: formData.get("next") ?? undefined });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check your email address.");

  const ip = await clientIp();
  const [ipOk, emailOk] = await Promise.all([rateLimit("signIn", `ip:${ip}`), rateLimit("signIn", `email:${parsed.data.email}`)]);
  if (!ipOk || !emailOk) return fail("Too many sign-in attempts. Please wait a few minutes and try again.");

  const next = safeNextPath(parsed.data.next, "/auth/continue");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: siteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      shouldCreateUser: true,
    },
  });
  if (error) {
    console.error("[auth] signInWithOtp", error.status, error.message);
    if (error.status === 429) return fail("Too many sign-in emails were requested. Please try again shortly.");
    return fail(GENERIC_ERROR);
  }
  // Same response whether or not the email belongs to an existing account.
  return { ok: true, message: "Check your inbox — we've sent you a secure sign-in link." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
