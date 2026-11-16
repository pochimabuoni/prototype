/**
 * Transactional email templates. Plain functions returning subject/html/text,
 * so they are trivially testable and render in every mail client
 * (table layout, inline styles, no web fonts required).
 */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

interface LayoutOptions {
  preheader: string;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footnote?: string;
}

function layout(o: LayoutOptions): { html: string; text: string } {
  const p = o.paragraphs
    .map((t) => `<p style="margin:0 0 16px;font:15px/1.65 Georgia,'Times New Roman',serif;color:#1e3354;">${esc(t)}</p>`)
    .join("");
  const cta = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:#0d1f3c;">
         <a href="${esc(o.cta.url)}" style="display:inline-block;padding:14px 28px;font:600 12px/1 Helvetica,Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(o.cta.label)}</a>
       </td></tr></table>`
    : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(o.heading)}</title></head>
<body style="margin:0;background:#f4f7fb;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dde4ee;">
<tr><td style="padding:32px 40px;border-bottom:1px solid #dde4ee;font:20px/1 Georgia,serif;letter-spacing:5px;color:#0d1f3c;">POCHI <span style="font-style:italic;letter-spacing:0;font-size:14px;color:#5a7db3;">ma</span> BUONI</td></tr>
<tr><td style="padding:40px;">
<p style="margin:0 0 18px;font:11px/1 Helvetica,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#627089;">${esc(o.eyebrow)}</p>
<h1 style="margin:0 0 24px;font:400 30px/1.15 Georgia,'Times New Roman',serif;color:#0d1f3c;">${esc(o.heading)}</h1>
${p}${cta}
${o.footnote ? `<p style="margin:28px 0 0;font:12px/1.6 Helvetica,Arial,sans-serif;color:#627089;">${esc(o.footnote)}</p>` : ""}
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #dde4ee;font:11px/1.6 Helvetica,Arial,sans-serif;color:#627089;">Pochi Ma Buoni · New York City<br>Few but good. This is a transactional message about your membership.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    "POCHI MA BUONI",
    "",
    o.heading,
    "",
    ...o.paragraphs.flatMap((t) => [t, ""]),
    o.cta ? `${o.cta.label}: ${o.cta.url}` : "",
    o.footnote ?? "",
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();
  return { html, text };
}

const build = (subject: string, o: LayoutOptions): EmailContent => ({ subject, ...layout(o) });

export const emailTemplates = {
  applicationReceived: (p: { firstName: string; statusUrl: string }) =>
    build("We've received your application", {
      preheader: "Thank you for applying to Pochi Ma Buoni.",
      eyebrow: "Application received",
      heading: `Thank you, ${p.firstName}.`,
      paragraphs: [
        "Your application to Pochi Ma Buoni has arrived safely. Every application is read personally by our membership team, and we admit members gradually to keep the community balanced.",
        "We'll write to you as soon as a decision has been made. You can also check your status at any time by signing in with this email address.",
      ],
      cta: { label: "Application status", url: p.statusUrl },
    }),

  membershipApproved: (p: { firstName: string; activateUrl: string }) =>
    build("Welcome to Pochi Ma Buoni", {
      preheader: "Your application has been approved.",
      eyebrow: "Membership approved",
      heading: `Welcome, ${p.firstName}.`,
      paragraphs: [
        "We're delighted to let you know that your application has been approved.",
        "To join the community, sign in with this email address, activate your $60 monthly membership, and complete your member profile. It takes a few minutes.",
      ],
      cta: { label: "Activate membership", url: p.activateUrl },
      footnote: "Membership is billed monthly through Stripe and can be cancelled at any time.",
    }),

  applicationWaitlisted: (p: { firstName: string }) =>
    build("An update on your application", {
      preheader: "You've been placed on our waitlist.",
      eyebrow: "Waitlist",
      heading: `Thank you for your patience, ${p.firstName}.`,
      paragraphs: [
        "We enjoyed reading your application. To keep the community balanced across sports, levels and neighbourhoods, we admit members in small groups — and we've placed you on our waitlist for now.",
        "There's nothing more you need to do. We'll be in touch as places open, and your application stays on file.",
      ],
    }),

  applicationRejected: (p: { firstName: string }) =>
    build("An update on your application", {
      preheader: "A decision on your Pochi Ma Buoni application.",
      eyebrow: "Application decision",
      heading: `Thank you, ${p.firstName}.`,
      paragraphs: [
        "Thank you for your interest in Pochi Ma Buoni and for the time you took to apply.",
        "After careful consideration we're unable to offer membership at this time. Our community is deliberately small, and these decisions are rarely easy. We wish you many good games in the city.",
      ],
    }),

  membershipActivated: (p: { firstName: string; profileUrl: string }) =>
    build("Your membership is active", {
      preheader: "Your Pochi Ma Buoni membership is now active.",
      eyebrow: "Membership active",
      heading: "You're in.",
      paragraphs: [
        `Thank you, ${p.firstName}. Your payment has been confirmed and your membership is now active.`,
        "The final step is your member profile: your sports, levels and the hours you're usually free. This is what we use to introduce you to the right people.",
      ],
      cta: { label: "Complete your profile", url: p.profileUrl },
    }),

  connectionRequest: (p: { recipientFirstName: string; senderDisplayName: string; reviewUrl: string }) =>
    build(`${p.senderDisplayName} would like to connect`, {
      preheader: "A new request to connect on Pochi Ma Buoni.",
      eyebrow: "New connection request",
      heading: `${p.senderDisplayName} would like to connect.`,
      paragraphs: [
        `Hello ${p.recipientFirstName}, a fellow member has asked to connect with you. Once you accept, you'll be able to message each other privately.`,
      ],
      cta: { label: "Review request", url: p.reviewUrl },
    }),

  invitationReceived: (p: {
    recipientFirstName: string;
    senderDisplayName: string;
    sport: string;
    when: string;
    where: string;
    reviewUrl: string;
    /** For group invitations: how many other members were invited. */
    othersInvited?: number;
  }) => {
    const group = p.othersInvited && p.othersInvited > 0 ? ` with ${p.othersInvited} other ${p.othersInvited === 1 ? "member" : "members"}` : "";
    return build(`${p.senderDisplayName} invited you to play ${p.sport}${group ? " in a group" : ""}`, {
      preheader: `${p.sport} · ${p.when}`,
      eyebrow: group ? "Group invitation" : "Invitation to play",
      heading: `${p.sport}, ${p.when}.`,
      paragraphs: [
        `Hello ${p.recipientFirstName}, ${p.senderDisplayName} has invited you to play ${p.sport.toLowerCase()}${group} on ${p.when}, suggesting ${p.where}.`,
        group
          ? "Pochi Ma Buoni doesn't book venues. If the group comes together, you arrange any reservation directly."
          : "Pochi Ma Buoni doesn't book venues — if you accept, the two of you arrange any reservation directly.",
      ],
      cta: { label: "Respond to invitation", url: p.reviewUrl },
    });
  },

  paymentFailed: (p: { firstName: string; billingUrl: string }) =>
    build("We couldn't process your membership payment", {
      preheader: "Please update your payment details.",
      eyebrow: "Payment issue",
      heading: "A quick note about billing.",
      paragraphs: [
        `Hello ${p.firstName}, your latest membership payment didn't go through. Stripe will retry automatically over the next few days.`,
        "To avoid any interruption to your membership, please review your payment method in the billing portal.",
      ],
      cta: { label: "Update payment details", url: p.billingUrl },
    }),

  subscriptionCanceled: (p: { firstName: string; rejoinUrl: string }) =>
    build("Your membership has ended", {
      preheader: "Your Pochi Ma Buoni membership has been cancelled.",
      eyebrow: "Membership cancelled",
      heading: `Until next time, ${p.firstName}.`,
      paragraphs: [
        "Your Pochi Ma Buoni membership has been cancelled and your access to the community has ended.",
        "Your profile is hidden from other members. If you'd like to return, you can reactivate at any time.",
      ],
      cta: { label: "Reactivate membership", url: p.rejoinUrl },
    }),

  adminNewApplication: (p: { applicantName: string; reviewUrl: string }) =>
    build(`New application: ${p.applicantName}`, {
      preheader: "A new membership application is waiting for review.",
      eyebrow: "Admissions",
      heading: "New application received.",
      paragraphs: [`${p.applicantName} has applied for membership.`],
      cta: { label: "Review application", url: p.reviewUrl },
    }),
} as const;

export type EmailTemplateName = keyof typeof emailTemplates;
