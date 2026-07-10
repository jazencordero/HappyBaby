"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createBabySchema,
  deleteBabySchema,
  updateBabySchema,
} from "@/lib/validation/babies";
import { requireParent } from "@/lib/permissions";
import { GENERIC_ERROR, type ActionResult } from "@/lib/errors";
import { logError } from "@/lib/log";

export async function createBaby(input: unknown): Promise<ActionResult> {
  const parsed = createBabySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  const { name, dateOfBirth, description } = parsed.data;
  // ID generated here: an INSERT ... RETURNING would be filtered by
  // babies_select RLS (creator isn't a member until the next insert).
  const babyId = crypto.randomUUID();
  const { error } = await supabase.from("babies").insert({
    id: babyId,
    name,
    date_of_birth: dateOfBirth,
    description: description || null,
    created_by: user.id,
  });
  if (error) {
    logError("createBaby", error, { userId: user.id, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }

  const { error: memberError } = await supabase
    .from("baby_members")
    .insert({ baby_id: babyId, user_id: user.id, role: "parent" });
  if (memberError) {
    // Compensating delete: best effort — never leave an ownerless baby row.
    await supabase.from("babies").delete().eq("id", babyId);
    logError("createBaby.membership", memberError, {
      userId: user.id,
      babyId,
      ok: false,
    });
    return { ok: false, error: GENERIC_ERROR };
  }

  redirect(`/babies/${babyId}`);
}

export async function updateBaby(input: unknown): Promise<ActionResult> {
  const parsed = updateBabySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const { babyId, name, dateOfBirth, description } = parsed.data;
  try {
    await requireParent(supabase, babyId);
  } catch {
    return { ok: false, error: "Only a parent can edit this profile." };
  }
  const { error } = await supabase
    .from("babies")
    .update({
      name,
      date_of_birth: dateOfBirth,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", babyId);
  if (error) {
    logError("updateBaby", error, { babyId, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${babyId}`);
  return { ok: true, data: undefined };
}

export async function deleteBaby(input: unknown): Promise<ActionResult> {
  const parsed = deleteBabySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };
  const supabase = await createClient();
  const { babyId } = parsed.data;
  try {
    await requireParent(supabase, babyId);
  } catch {
    return { ok: false, error: "Only a parent can delete this profile." };
  }
  const { error } = await supabase.from("babies").delete().eq("id", babyId);
  if (error) {
    logError("deleteBaby", error, { babyId, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  redirect("/dashboard");
}
