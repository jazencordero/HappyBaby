"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { removeCaregiverSchema } from "@/lib/validation/members";
import { requireParent } from "@/lib/permissions";
import { GENERIC_ERROR, type ActionResult } from "@/lib/errors";
import { logError } from "@/lib/log";

export async function removeCaregiver(input: unknown): Promise<ActionResult> {
  const parsed = removeCaregiverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };
  const supabase = await createClient();
  const { babyId, userId } = parsed.data;

  try {
    await requireParent(supabase, babyId);
  } catch {
    return { ok: false, error: "Only a parent can remove caregivers." };
  }

  // Target must be a caregiver — parents can't be removed (RLS enforces too).
  const { data: target } = await supabase
    .from("baby_members")
    .select("id, role")
    .eq("baby_id", babyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "This person is not a member." };
  if (target.role !== "caregiver") {
    return { ok: false, error: "Parents can't be removed." };
  }

  const { error } = await supabase
    .from("baby_members")
    .delete()
    .eq("id", target.id);
  if (error) {
    logError("removeCaregiver", error, { babyId, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${babyId}`);
  return { ok: true, data: undefined };
}
