import { z } from "zod";
import { optionalText, uuidSchema } from "./common";

export const connectionRequestSchema = z.object({
  memberId: uuidSchema,
  note: optionalText(300),
});

const invitationFields = {
  sportId: uuidSchema,
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  proposedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time."),
  locationNote: z.string().trim().min(2, "Suggest a general venue or area.").max(160),
  message: optionalText(500),
};

function withDateRules<T extends z.ZodType<{ proposedDate: string }>>(schema: T) {
  return schema
    .refine((v) => {
      const todayNy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
      return v.proposedDate >= todayNy;
    }, { message: "Choose a date from today onwards.", path: ["proposedDate"] })
    .refine((v) => {
      const max = new Date();
      max.setUTCDate(max.getUTCDate() + 180);
      return v.proposedDate <= max.toISOString().slice(0, 10);
    }, { message: "Choose a date within the next six months.", path: ["proposedDate"] });
}

/** The details of an invitation, shared by one-on-one and group invitations. */
export const invitationDetailsSchema = withDateRules(z.object(invitationFields));

export const invitationSchema = withDateRules(z.object({ recipientId: uuidSchema, ...invitationFields }));

export const MAX_GROUP_INVITEES = 9;

export const groupInvitationSchema = withDateRules(
  z.object({
    recipientIds: z
      .array(uuidSchema)
      .min(2, "A group needs at least two other members.")
      .max(MAX_GROUP_INVITEES, `Invite up to ${MAX_GROUP_INVITEES} members at once.`)
      .refine((ids) => new Set(ids).size === ids.length, "Each member can only be invited once."),
    ...invitationFields,
  }),
);

export type InvitationInput = z.input<typeof invitationSchema>;
export type InvitationDetailsInput = z.input<typeof invitationDetailsSchema>;

export const messageSchema = z.object({
  conversationId: uuidSchema,
  body: z.string().trim().min(1, "Write a message.").max(2000, "Messages are limited to 2,000 characters."),
});

export const REPORT_REASONS = [
  { value: "HARASSMENT", label: "Harassment or abuse" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "SPAM", label: "Spam or solicitation" },
  { value: "FAKE_PROFILE", label: "Fake or misleading profile" },
  { value: "NO_SHOW", label: "Repeated no-shows" },
  { value: "OTHER", label: "Something else" },
] as const;

export const reportSchema = z.object({
  reportedUserId: uuidSchema,
  messageId: uuidSchema.optional(),
  invitationId: uuidSchema.optional(),
  reason: z.enum(["HARASSMENT", "INAPPROPRIATE_CONTENT", "SAFETY_CONCERN", "SPAM", "FAKE_PROFILE", "NO_SHOW", "OTHER"]),
  details: optionalText(2000),
  alsoBlock: z.boolean().default(false),
});
