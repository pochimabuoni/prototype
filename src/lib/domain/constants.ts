export const BRAND = {
  name: "Pochi Ma Buoni",
  wordmark: "POCHI MA BUONI",
  meaning: "Few but Good",
  tagline: "A better way to play. A better circle to belong to.",
  description:
    "A private community connecting people through sport, shared ambition, and meaningful experiences in New York City.",
  city: "New York City",
  priceMonthlyUsd: 60,
  contactEmail: "membership@example.com",
} as const;

export const MIN_AGE = 18;

export const INVITATION_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"] as const;
export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "WAITLISTED"] as const;
