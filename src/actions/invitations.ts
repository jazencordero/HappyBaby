"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  revokeInvitationSchema,
} from "@/lib/validation/invitations";
import { generateInvitationToken, invitationUrl } from "@/lib/invitations";
import { requireParent } from "@/lib/permissions";
import { GENERIC_ERROR, type ActionResult } from "@/lib/errors";
import { logError } from "@/lib/log";
import { sendInvitationEmail } from "@/lib/email";

export async function createInvitation(
  input: unknown
): Promise<ActionResult<{ inviteUrl: string }>> {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  const { babyId, invitedEmail } = parsed.data;
  try {
    await requireParent(supabase, babyId);
  } catch {
    return { ok: false, error: "Only a parent can invite caregivers." };
  }

  const { raw, hash } = generateInvitationToken();
  const { error } = await supabase.from("invitations").insert({
    baby_id: babyId,
    invited_email: invitedEmail || null,
    token_hash: hash,
    invited_by: user.id,
  });
  if (error) {
    logError("createInvitation", error, { userId: user.id, babyId, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${babyId}`);

  const inviteUrl = invitationUrl(raw);
  // Fire-and-forget: the invitation (and its link) already exists in the DB
  // regardless of whether the email sends, so a delivery failure here must
  // never surface as a failed invitation to the caller.
  if (invitedEmail) {
    const { data: baby } = await supabase
      .from("babies")
      .select("name")
      .eq("id", babyId)
      .maybeSingle();
    try {
      await sendInvitationEmail({
        to: invitedEmail,
        inviteUrl,
        babyName: baby?.name ?? "your baby",
        inviterName:
          (user.user_metadata?.display_name as string) || "A parent",
      });
    } catch (err) {
      logError("createInvitation.sendInvitationEmail", err, { babyId });
    }
  }

  // Raw token exists only in this return value — never logged, never stored.
  return { ok: true, data: { inviteUrl } };
}

export async function revokeInvitation(input: unknown): Promise<ActionResult> {
  const parsed = revokeInvitationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };
  const supabase = await createClient();

  // RLS restricts this read to invitations of babies the user parents.
  const { data: inv } = await supabase
    .from("invitations")
    .select("id, baby_id, status")
    .eq("id", parsed.data.invitationId)
    .maybeSingle();
  if (!inv) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status !== "pending") {
    return { ok: false, error: "This invitation is no longer pending." };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", inv.id);
  if (error) {
    logError("revokeInvitation", error, { babyId: inv.baby_id, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${inv.baby_id}`);
  return { ok: true, data: undefined };
}

export async function acceptInvitation(input: unknown): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "This invitation link isn't valid." };
  }
  const supabase = await createClient();
  const { data: babyId, error } = await supabase.rpc("accept_invitation", {
    raw_token: parsed.data.token,
  });
  if (error || !babyId) {
    const message = error?.message ?? "";
    if (message.includes("not_authenticated")) {
      return { ok: false, error: "Please sign in to accept this invitation." };
    }
    if (message.includes("email_mismatch")) {
      return {
        ok: false,
        error:
          "This invitation was sent to a different email address. Ask the parent to invite you directly, or leave the email field blank next time.",
      };
    }
    if (
      message.includes("invalid_invitation") ||
      message.includes("invitation_not_active")
    ) {
      return {
        ok: false,
        error:
          "This invitation is no longer valid. Ask the parent for a new link.",
      };
    }
    logError("acceptInvitation", error, { ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  redirect(`/babies/${babyId}`);
}
