"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createRecordSchema,
  deleteRecordSchema,
  parseRecordDetails,
  updateRecordSchema,
} from "@/lib/validation/records";
import {
  canCreateRecordType,
  canDeleteRecord,
  canEditRecord,
  requireMember,
} from "@/lib/permissions";
import { GENERIC_ERROR, type ActionResult } from "@/lib/errors";
import { logError } from "@/lib/log";

const NOT_PERMITTED = "You don't have permission to do that.";
const NOT_FOUND = "This record doesn't exist or you don't have access.";

async function getRecordForAuthz(
  supabase: Awaited<ReturnType<typeof createClient>>,
  recordId: string
) {
  const { data } = await supabase
    .from("baby_records")
    .select("id, baby_id, type, created_by")
    .eq("id", recordId)
    .maybeSingle();
  return data;
}

export async function createRecord(input: unknown): Promise<ActionResult> {
  const parsed = createRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  const { babyId, type, title, content, recordDate, details } = parsed.data;
  let role;
  try {
    role = await requireMember(supabase, babyId);
  } catch {
    return { ok: false, error: NOT_PERMITTED };
  }
  if (!canCreateRecordType(role, type)) {
    return { ok: false, error: "Caregivers can only add care notes." };
  }
  const parsedDetails = parseRecordDetails(type, details);
  if (!parsedDetails.ok) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const { error } = await supabase.from("baby_records").insert({
    baby_id: babyId,
    type,
    title,
    content: content || null,
    record_date: recordDate || null,
    details: parsedDetails.data,
    created_by: user.id,
  });
  if (error) {
    logError("createRecord", error, { userId: user.id, babyId, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${babyId}`);
  return { ok: true, data: undefined };
}

export async function updateRecord(input: unknown): Promise<ActionResult> {
  const parsed = updateRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  const { recordId, title, content, recordDate, details } = parsed.data;
  const rec = await getRecordForAuthz(supabase, recordId);
  if (!rec) return { ok: false, error: NOT_FOUND };
  let role;
  try {
    role = await requireMember(supabase, rec.baby_id);
  } catch {
    return { ok: false, error: NOT_PERMITTED };
  }
  if (!canEditRecord(role, rec, user.id)) {
    return { ok: false, error: NOT_PERMITTED };
  }
  const parsedDetails = parseRecordDetails(rec.type, details);
  if (!parsedDetails.ok) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const { error } = await supabase
    .from("baby_records")
    .update({
      title,
      content: content || null,
      record_date: recordDate || null,
      details: parsedDetails.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recordId);
  if (error) {
    logError("updateRecord", error, { userId: user.id, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${rec.baby_id}`);
  return { ok: true, data: undefined };
}

export async function deleteRecord(input: unknown): Promise<ActionResult> {
  const parsed = deleteRecordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  const rec = await getRecordForAuthz(supabase, parsed.data.recordId);
  if (!rec) return { ok: false, error: NOT_FOUND };
  let role;
  try {
    role = await requireMember(supabase, rec.baby_id);
  } catch {
    return { ok: false, error: NOT_PERMITTED };
  }
  if (!canDeleteRecord(role, rec, user.id)) {
    return { ok: false, error: NOT_PERMITTED };
  }

  const { error } = await supabase
    .from("baby_records")
    .delete()
    .eq("id", rec.id);
  if (error) {
    logError("deleteRecord", error, { userId: user.id, ok: false });
    return { ok: false, error: GENERIC_ERROR };
  }
  revalidatePath(`/babies/${rec.baby_id}`);
  return { ok: true, data: undefined };
}
