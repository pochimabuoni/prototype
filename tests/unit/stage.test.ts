import { describe, expect, it } from "vitest";
import { hasEntitlement, resolveMemberStage, homeForStage, safeNextPath, type StageInput } from "@/lib/auth/stage";

const base: StageInput = {
  role: "MEMBER",
  accountStatus: "ACTIVE",
  applicationStatus: "APPROVED",
  subscriptionStatus: "active",
  currentPeriodEnd: "2030-01-01T00:00:00Z",
  profileCompleted: true,
};

describe("hasEntitlement", () => {
  const now = new Date("2026-11-16T12:00:00Z");
  it("grants access to active and trialing subscriptions", () => {
    expect(hasEntitlement("active", null, now)).toBe(true);
    expect(hasEntitlement("trialing", null, now)).toBe(true);
  });
  it("keeps past_due members during a 3-day grace window only", () => {
    expect(hasEntitlement("past_due", "2026-11-15T12:00:00Z", now)).toBe(true);
    expect(hasEntitlement("past_due", "2026-11-12T12:00:00Z", now)).toBe(false);
  });
  it("revokes access for every other status", () => {
    for (const s of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"] as const) {
      expect(hasEntitlement(s, "2030-01-01T00:00:00Z", now)).toBe(false);
    }
    expect(hasEntitlement(null, null, now)).toBe(false);
  });
});

describe("resolveMemberStage", () => {
  it("returns ACTIVE only for paid members with a completed profile", () => {
    expect(resolveMemberStage(base)).toBe("ACTIVE");
    expect(resolveMemberStage({ ...base, profileCompleted: false })).toBe("PROFILE_INCOMPLETE");
    expect(resolveMemberStage({ ...base, subscriptionStatus: null })).toBe("AWAITING_PAYMENT");
    expect(resolveMemberStage({ ...base, subscriptionStatus: "canceled" })).toBe("AWAITING_PAYMENT");
    expect(resolveMemberStage({ ...base, subscriptionStatus: "unpaid" })).toBe("PAYMENT_ISSUE");
  });
  it("suspension overrides everything, including admin", () => {
    expect(resolveMemberStage({ ...base, accountStatus: "SUSPENDED" })).toBe("SUSPENDED");
    expect(resolveMemberStage({ ...base, role: "ADMIN", accountStatus: "SUSPENDED" })).toBe("SUSPENDED");
  });
  it("keeps applicants out regardless of any subscription row", () => {
    expect(resolveMemberStage({ ...base, role: "APPLICANT", applicationStatus: "PENDING" })).toBe("APPLICATION_PENDING");
    expect(resolveMemberStage({ ...base, role: "APPLICANT", applicationStatus: "WAITLISTED" })).toBe("APPLICATION_WAITLISTED");
    expect(resolveMemberStage({ ...base, role: "APPLICANT", applicationStatus: "REJECTED" })).toBe("APPLICATION_REJECTED");
    expect(resolveMemberStage({ ...base, role: "APPLICANT", applicationStatus: null })).toBe("NO_APPLICATION");
  });
  it("maps stages to landing pages", () => {
    expect(homeForStage("ACTIVE")).toBe("/home");
    expect(homeForStage("AWAITING_PAYMENT")).toBe("/onboarding");
    expect(homeForStage("APPLICATION_PENDING")).toBe("/application-status");
    expect(homeForStage("ADMIN")).toBe("/admin");
  });
});

describe("safeNextPath", () => {
  it("allows only same-origin relative paths", () => {
    expect(safeNextPath("/discover?sport=tennis")).toBe("/discover?sport=tennis");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("/ok\r\nSet-Cookie: x")).toBe("/");
    expect(safeNextPath(undefined, "/home")).toBe("/home");
  });
});
