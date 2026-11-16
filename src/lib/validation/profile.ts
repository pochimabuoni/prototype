import { z } from "zod";
import { neighborhoodSchema, optionalText, slotKeySchema } from "./common";
import { AGE_MAX, AGE_MIN, PLAY_STYLE_VALUES } from "@/lib/domain/play-styles";

/** Empty input means "no preference". */
const optionalAge = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number({ error: "Enter an age." }).int().min(AGE_MIN, `Ages start at ${AGE_MIN}.`).max(AGE_MAX, `Up to ${AGE_MAX}.`).nullable(),
);

export const profileSportSchema = z.object({
  sport: z.string().regex(/^[a-z0-9-]{2,40}$/),
  level: z.string().trim().min(1, "Choose a level.").max(40),
  formats: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
});

export const profileSchema = z
  .object({
  firstName: z.string().trim().min(1, "Please enter your first name.").max(60),
  lastName: optionalText(60),
  showLastName: z.boolean().default(false),
  bio: optionalText(600),
  neighborhood: neighborhoodSchema,
  occupation: optionalText(120),
  showOccupation: z.boolean().default(true),
  visibility: z.enum(["MEMBERS", "CONNECTIONS", "HIDDEN"]).default("MEMBERS"),
  sports: z
    .array(profileSportSchema)
    .min(1, "Add at least one sport.")
    .max(8, "Add up to eight sports.")
    .refine((s) => new Set(s.map((x) => x.sport)).size === s.length, "Each sport can only be listed once."),
  availability: z.array(slotKeySchema).min(1, "Select at least one time you're usually free.").max(35),
  showAge: z.boolean().default(true),
  partnerAgeMin: optionalAge.default(null),
  partnerAgeMax: optionalAge.default(null),
  playStyles: z
    .array(z.enum(PLAY_STYLE_VALUES))
    .min(1, "Choose at least one way you like to play.")
    .max(3)
    .default(["one_on_one", "small_group"]),
  })
  .refine((d) => d.partnerAgeMin == null || d.partnerAgeMax == null || d.partnerAgeMin <= d.partnerAgeMax, {
    path: ["partnerAgeMax"],
    message: "The upper age should be at least the lower age.",
  });

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;
