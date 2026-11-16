import { z } from "zod";
import { dateOfBirthSchema, neighborhoodSchema, optionalText, slotKeySchema } from "./common";

export const applicationSportSchema = z.object({
  sport: z.string().regex(/^[a-z0-9-]{2,40}$/),
  level: z.string().trim().min(1, "Choose a level.").max(40),
});

export const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address.")),
  dateOfBirth: dateOfBirthSchema,
  neighborhood: neighborhoodSchema,
  occupation: optionalText(120),
  sports: z
    .array(applicationSportSchema)
    .min(1, "Choose at least one sport.")
    .max(6, "Choose up to six sports.")
    .refine((s) => new Set(s.map((x) => x.sport)).size === s.length, "Each sport can only be listed once."),
  availability: z.array(slotKeySchema).min(1, "Select at least one time you're usually free.").max(35),
  introduction: z.string().trim().min(40, "Please write at least 40 characters.").max(1200),
  motivation: z.string().trim().min(40, "Please write at least 40 characters.").max(1200),
  referralCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(32)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[A-Z0-9-]{4,32}$/.test(v), "Referral codes contain letters, numbers and hyphens."),
  agreeToTerms: z.literal(true, { error: "Please confirm you agree to the terms and privacy policy." }),
});

export type ApplicationInput = z.input<typeof applicationSchema>;
export type ApplicationData = z.output<typeof applicationSchema>;

export const applicationDecisionSchema = z.object({
  applicationId: z.uuid(),
  decision: z.enum(["APPROVED", "REJECTED", "WAITLISTED"]),
  note: optionalText(1000),
  notify: z.boolean().default(true),
});
