import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveMemberStage, type MemberStage } from "./stage";
import type { Tables } from "@/types/database";

export interface Viewer {
  id: string;
  email: string;
  role: Tables<"users">["role"];
  accountStatus: Tables<"users">["account_status"];
  stage: MemberStage;
  application: Pick<Tables<"membership_applications">, "id" | "status" | "created_at" | "full_name"> | null;
  subscription: Pick<
    Tables<"subscriptions">,
    "status" | "current_period_end" | "cancel_at_period_end" | "stripe_customer_id"
  > | null;
  profile: Pick<Tables<"member_profiles">, "first_name" | "last_name" | "photo_path" | "completed_at" | "neighborhood"> | null;
  canUseCommunity: boolean;
}

/**
 * Data Access Layer entry point. Verifies the session with Supabase Auth
 * (server-side, not just by decoding the cookie) and loads the viewer's
 * role/entitlements from the database. Memoised per request.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: row }, { data: apps }, { data: sub }, { data: profile }] = await Promise.all([
    supabase.from("users").select("id, email, role, account_status").eq("id", user.id).maybeSingle(),
    supabase
      .from("membership_applications")
      .select("id, status, created_at, full_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("member_profiles")
      .select("first_name, last_name, photo_path, completed_at, neighborhood")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!row) return null;
  const application = apps?.[0] ?? null;

  const stage = resolveMemberStage({
    role: row.role,
    accountStatus: row.account_status,
    applicationStatus: application?.status ?? null,
    subscriptionStatus: sub?.status ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    profileCompleted: Boolean(profile?.completed_at),
  });

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status,
    stage,
    application,
    subscription: sub ?? null,
    profile: profile ?? null,
    canUseCommunity: stage === "ACTIVE" || stage === "ADMIN",
  };
});

export async function requireViewer(next = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** Active, paying member with a completed profile (or an administrator). */
export async function requireCommunityAccess(next = "/home"): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (viewer.stage === "ACTIVE") return viewer;
  if (viewer.stage === "ADMIN") return viewer;
  if (viewer.stage === "SUSPENDED") redirect("/suspended");
  if (["AWAITING_PAYMENT", "PAYMENT_ISSUE", "PROFILE_INCOMPLETE"].includes(viewer.stage)) redirect("/onboarding");
  redirect("/application-status");
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (viewer.role !== "ADMIN" || viewer.accountStatus !== "ACTIVE") {
    redirect("/");
  }
  return viewer;
}

/** For server actions: returns the viewer or throws (never redirects silently). */
export class AuthorizationError extends Error {
  constructor(message = "You are not authorised to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function assertCommunityAccess(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || !viewer.canUseCommunity) throw new AuthorizationError();
  return viewer;
}

export async function assertAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "ADMIN" || viewer.accountStatus !== "ACTIVE") throw new AuthorizationError();
  return viewer;
}
