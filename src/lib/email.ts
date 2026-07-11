import { Resend } from "resend";

import { logError } from "@/lib/log";

type SendInvitationEmailInput = {
  to: string;
  inviteUrl: string;
  babyName: string;
  inviterName: string;
};

// Never throws, never blocks the invite flow — the copyable link in the
// dialog is the fallback path and must keep working even if RESEND_API_KEY
// is unset or the send itself fails.
export async function sendInvitationEmail({
  to,
  inviteUrl,
  babyName,
  inviterName,
}: SendInvitationEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logError("sendInvitationEmail", "RESEND_API_KEY not configured; skipped", {
      to,
    });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "HappyBaby <onboarding@resend.dev>",
      to,
      subject: `${inviterName} invited you to help care for ${babyName}`,
      html: `<p>${inviterName} invited you to help care for <strong>${babyName}</strong> on HappyBaby.</p><p><a href="${inviteUrl}">Accept the invitation</a></p>`,
    });
  } catch (err) {
    logError("sendInvitationEmail", err, { to });
  }
}
