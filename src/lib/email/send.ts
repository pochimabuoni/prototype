import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env.server";
import type { EmailContent } from "./templates";

let client: Resend | null = null;

/**
 * Sends a transactional email via Resend. Email is best-effort: failures are
 * logged and reported to the caller but never break the primary action.
 * Without RESEND_API_KEY (local development) the message is logged instead —
 * nothing is pretended to be sent.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<{ sent: boolean }> {
  const apiKey = serverEnv.resendApiKey();
  if (!apiKey) {
    console.info(`[email:not-sent] RESEND_API_KEY not set. Would send "${content.subject}" to ${to}`);
    return { sent: false };
  }
  client ??= new Resend(apiKey);
  try {
    const { error } = await client.emails.send({
      from: serverEnv.emailFrom(),
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    if (error) {
      console.error("[email] Resend error", error.name, error.message);
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false };
  }
}
