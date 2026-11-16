import { describe, expect, it } from "vitest";
import { emailTemplates } from "@/lib/email/templates";

describe("email templates", () => {
  it("renders every required transactional email with html and text", () => {
    const all = [
      emailTemplates.applicationReceived({ firstName: "Ana", statusUrl: "https://x/status" }),
      emailTemplates.membershipApproved({ firstName: "Ana", activateUrl: "https://x/a" }),
      emailTemplates.applicationWaitlisted({ firstName: "Ana" }),
      emailTemplates.applicationRejected({ firstName: "Ana" }),
      emailTemplates.membershipActivated({ firstName: "Ana", profileUrl: "https://x/p" }),
      emailTemplates.connectionRequest({ recipientFirstName: "Ana", senderDisplayName: "Theo L.", reviewUrl: "https://x/c" }),
      emailTemplates.invitationReceived({ recipientFirstName: "Ana", senderDisplayName: "Theo L.", sport: "Padel", when: "Sat 9:00", where: "Padel Haus", reviewUrl: "https://x/i" }),
      emailTemplates.paymentFailed({ firstName: "Ana", billingUrl: "https://x/b" }),
      emailTemplates.subscriptionCanceled({ firstName: "Ana", rejoinUrl: "https://x/r" }),
    ];
    for (const e of all) {
      expect(e.subject.length).toBeGreaterThan(5);
      expect(e.html).toContain("POCHI");
      expect(e.text).toContain("POCHI MA BUONI");
    }
  });

  it("escapes user-provided content", () => {
    const e = emailTemplates.connectionRequest({
      recipientFirstName: "<script>alert(1)</script>",
      senderDisplayName: "Eve \"<b>\"",
      reviewUrl: "https://x/c",
    });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
  });
});
