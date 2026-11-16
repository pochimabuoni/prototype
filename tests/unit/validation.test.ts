import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/lib/validation/application";
import { ageOn, validateImageFile } from "@/lib/validation/common";
import { profileSchema } from "@/lib/validation/profile";
import { groupInvitationSchema } from "@/lib/validation/community";

const valid = {
  fullName: "Giulia Ricci",
  email: "Giulia@Example.com ",
  dateOfBirth: "1991-04-12",
  neighborhood: "west-village",
  occupation: "",
  sports: [{ sport: "tennis", level: "Advanced" }],
  availability: ["5:MORNING"],
  introduction: "Architect from Milan; varsity tennis, padel in Madrid, now six years in New York.",
  motivation: "I want a reliable circle of people who take the game seriously and are good company.",
  referralCode: "founding-circle",
  agreeToTerms: true,
};

describe("applicationSchema", () => {
  it("accepts and normalises a valid application", () => {
    const r = applicationSchema.parse(valid);
    expect(r.email).toBe("giulia@example.com");
    expect(r.occupation).toBeUndefined();
    expect(r.referralCode).toBe("FOUNDING-CIRCLE");
  });

  it("requires applicants to be at least 18", () => {
    const today = new Date();
    const seventeen = `${today.getUTCFullYear() - 17}-01-01`;
    const r = applicationSchema.safeParse({ ...valid, dateOfBirth: seventeen });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["dateOfBirth"]);
  });

  it("rejects unknown neighbourhoods, bad slots, duplicate sports and missing consent", () => {
    expect(applicationSchema.safeParse({ ...valid, neighborhood: "123 Main St" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, availability: ["8:MORNING"] }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, sports: [valid.sports[0], valid.sports[0]] }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, agreeToTerms: false }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, introduction: "too short" }).success).toBe(false);
  });
});

describe("ageOn", () => {
  it("counts birthdays precisely", () => {
    const d = new Date("2026-11-16T00:00:00Z");
    expect(ageOn("2008-11-16", d)).toBe(18);
    expect(ageOn("2008-11-17", d)).toBe(17);
  });
});

describe("profileSchema", () => {
  it("defaults visibility and requires a sport and availability", () => {
    const ok = profileSchema.parse({
      firstName: "Marcus",
      neighborhood: "tribeca",
      sports: [{ sport: "tennis", level: "Intermediate" }],
      availability: ["0:EARLY_MORNING"],
    });
    expect(ok.visibility).toBe("MEMBERS");
    expect(ok.sports[0]!.formats).toEqual([]);
    expect(profileSchema.safeParse({ firstName: "M", neighborhood: "tribeca", sports: [], availability: [] }).success).toBe(false);
  });

  const base = { firstName: "Giulia", neighborhood: "west-village", sports: [{ sport: "tennis", level: "Advanced" }], availability: ["5:MORNING"] };

  it("treats blank age preferences as no preference and defaults play styles", () => {
    const ok = profileSchema.parse({ ...base, partnerAgeMin: "", partnerAgeMax: "" });
    expect(ok.partnerAgeMin).toBeNull();
    expect(ok.partnerAgeMax).toBeNull();
    expect(ok.showAge).toBe(true);
    expect(ok.playStyles).toEqual(["one_on_one", "small_group"]);
  });

  it("validates the preferred age range", () => {
    expect(profileSchema.parse({ ...base, partnerAgeMin: "28", partnerAgeMax: "45" }).partnerAgeMin).toBe(28);
    expect(profileSchema.safeParse({ ...base, partnerAgeMin: 17 }).success).toBe(false);
    const inverted = profileSchema.safeParse({ ...base, partnerAgeMin: 50, partnerAgeMax: 30 });
    expect(inverted.success).toBe(false);
    expect(inverted.error?.issues[0]?.path).toEqual(["partnerAgeMax"]);
  });

  it("only accepts known play styles and at least one", () => {
    expect(profileSchema.safeParse({ ...base, playStyles: [] }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, playStyles: ["speed_dating"] }).success).toBe(false);
    expect(profileSchema.parse({ ...base, playStyles: ["large_group"] }).playStyles).toEqual(["large_group"]);
  });
});

describe("groupInvitationSchema", () => {
  const future = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const d = { sportId: "7c9e6679-7425-40de-944b-e07fc1f90ae7", proposedDate: future, proposedTime: "08:00", locationNote: "Central Park" };
  const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
  it("needs two to nine distinct invitees", () => {
    expect(groupInvitationSchema.safeParse({ ...d, recipientIds: [id(1)] }).success).toBe(false);
    expect(groupInvitationSchema.safeParse({ ...d, recipientIds: [id(1), id(1)] }).success).toBe(false);
    expect(groupInvitationSchema.safeParse({ ...d, recipientIds: [id(1), id(2), id(3)] }).success).toBe(true);
  });
});

describe("validateImageFile", () => {
  const file = (bytes: number[], type: string) => new File([new Uint8Array(bytes)], "x", { type });
  it("accepts real image signatures", async () => {
    expect(await validateImageFile(file([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0], "image/jpeg"))).toEqual({ ok: true, ext: "jpg" });
    expect(await validateImageFile(file([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0], "image/png"))).toEqual({ ok: true, ext: "png" });
  });
  it("rejects spoofed content types and oversize files", async () => {
    expect((await validateImageFile(file([0x3c, 0x73, 0x76, 0x67, 0, 0, 0, 0, 0, 0, 0, 0], "image/png"))).ok).toBe(false);
    expect((await validateImageFile(file([0xff, 0xd8, 0xff], "image/svg+xml"))).ok).toBe(false);
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "big", { type: "image/jpeg" });
    expect((await validateImageFile(big)).ok).toBe(false);
  });
});
