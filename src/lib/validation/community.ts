import { z } from "zod";
import { optionalText, uuidSchema } from "./common";

export const connectionRequestSchema = z.object({
  memberId: uuidSchema,
  note: optionalText(300),
});

export const invitationSchema = z
  .object({
    recipientId: uuidSchema,
    sportId: uuidSchema,
    proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    proposedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose a time."),
    locationNote: z.string().trim().min(2, "Suggest a general venue or area.").max(160),
    message: optionalText(500),
  })
  .refine((v) => {
    const todayNy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
    return v.proposedDate >= todayNy;
  }, { message: "Choose a date from today onwards.", path: ["proposedDate"] })
  .refine((v) => {
    const max = new Date();
    max.setUTCDate(max.getUTCDate() + 180);
    return v.proposedDate <= max.toISOString().slice(0, 10);
  }, { message: "Choose a date within the next six months.", path: ["proposedDate"] });

export type InvitationInput = z.input<typeof invitationSchema>;

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
