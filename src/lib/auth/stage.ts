import type { Enums } from "@/types/database";

/**
 * Pure membership-stage resolution — shared by layouts, the proxy-free
 * redirects and tests. Inputs MUST come from the database (server-side),
 * never from the client.
 */
export type SubscriptionStatus = Enums<"subscription_status">;

export interface StageInput {
  role: Enums<"user_role">;
  accountStatus: Enums<"account_status">;
  applicationStatus: Enums<"application_status"> | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  profileCompleted: boolean;
  now?: Date;
}

export type MemberStage =
  | "SUSPENDED"
  | "ADMIN"
  | "NO_APPLICATION"
  | "APPLICATION_PENDING"
  | "APPLICATION_WAITLISTED"
  | "APPLICATION_REJECTED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_ISSUE"
  | "PROFILE_INCOMPLETE"
  | "ACTIVE";

/** Grace window after period end while Stripe retries a failed renewal. Mirrors SQL is_active_member(). */
export const PAST_DUE_GRACE_DAYS = 3;

export function hasEntitlement(status: SubscriptionStatus | null, currentPeriodEnd: string | null, now = new Date()): boolean {
  if (status === "active" || status === "trialing") return true;
  if (status === "past_due" && currentPeriodEnd) {
    const graceEnds = new Date(currentPeriodEnd).getTime() + PAST_DUE_GRACE_DAYS * 86_400_000;
    return graceEnds > now.getTime();
  }
  return false;
}

export function resolveMemberStage(input: StageInput): MemberStage {
  if (input.accountStatus === "SUSPENDED") return "SUSPENDED";
  if (input.role === "ADMIN") return "ADMIN";
  if (input.role === "APPLICANT") {
    switch (input.applicationStatus) {
      case null:
        return "NO_APPLICATION";
      case "WAITLISTED":
        return "APPLICATION_WAITLISTED";
      case "REJECTED":
        return "APPLICATION_REJECTED";
      // APPROVED with an APPLICANT role should not persist (sign-up trigger and
      // admissions both promote), but treat it as pending until reconciled.
      default:
        return "APPLICATION_PENDING";
    }
  }
  // role === MEMBER (approved)
  if (!hasEntitlement(input.subscriptionStatus, input.currentPeriodEnd, input.now)) {
    if (input.subscriptionStatus && ["past_due", "unpaid", "incomplete"].includes(input.subscriptionStatus)) {
      return "PAYMENT_ISSUE";
    }
    return "AWAITING_PAYMENT";
  }
  if (!input.profileCompleted) return "PROFILE_INCOMPLETE";
  return "ACTIVE";
}

/** Where a signed-in user should land for a given stage. */
export function homeForStage(stage: MemberStage): string {
  switch (stage) {
    case "ACTIVE":
      return "/home";
    case "ADMIN":
      return "/admin";
    case "AWAITING_PAYMENT":
    case "PAYMENT_ISSUE":
    case "PROFILE_INCOMPLETE":
      return "/onboarding";
    case "NO_APPLICATION":
      return "/apply";
    default:
      return "/application-status";
  }
}

/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}
