import { z } from "zod";
import { neighborhoodSchema, optionalText, uuidSchema } from "./common";

const vocabulary = z
  .string()
  .transform((s) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean))
  .pipe(z.array(z.string().min(1).max(40)));

export const sportSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(2, "Name is required.").max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,40}$/, "Use lowercase letters, numbers and hyphens."),
  skillLevels: vocabulary.pipe(z.array(z.string()).min(2, "Add at least two levels.").max(8)),
  formats: vocabulary.pipe(z.array(z.string()).min(1, "Add at least one format.").max(10)),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(100),
});

export const referralSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,32}$/, "4–32 characters: letters, numbers, hyphens."),
  description: optionalText(200),
  maxUses: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1).max(10000).optional()),
  expiresAt: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

export const reportUpdateSchema = z.object({
  reportId: uuidSchema,
  status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]),
  note: optionalText(2000),
});

export const suspendSchema = z.object({
  userId: uuidSchema,
  reason: z.string().trim().min(3, "Give a short reason.").max(500),
  cancelSubscription: z.boolean().default(false),
});

export const venueSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,80}$/, "Use lowercase letters, numbers and hyphens."),
  neighborhood: neighborhoodSchema,
  location: z.string().trim().min(2, "Describe where it is, e.g. a street or park entrance.").max(200),
  description: optionalText(600),
  access: z.enum(["FREE_PUBLIC", "PERMIT_OR_RESERVATION", "PAID_OR_MEMBERSHIP"], { error: "Choose how members get access." }),
  accessNote: optionalText(300),
  indoor: z.boolean().default(false),
  seasonal: z.boolean().default(false),
  website: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.url({ protocol: /^https$/, error: "Use a full https:// address." }).max(300).optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(100),
  sportIds: z.array(uuidSchema).min(1, "Choose at least one sport.").max(20),
});
