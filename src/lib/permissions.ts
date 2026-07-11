import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { NotAuthorizedError } from "@/lib/errors";

export type BabyRole = "parent" | "caregiver";
export type RecordType =
  | "medical_history"
  | "allergy"
  | "routine"
  | "note"
  | "vaccination"
  | "medication";

type Db = SupabaseClient<Database>;

export async function getBabyRole(
  supabase: Db,
  babyId: string
): Promise<BabyRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("baby_members")
    .select("role")
    .eq("baby_id", babyId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role ?? null;
}

export async function requireMember(
  supabase: Db,
  babyId: string
): Promise<BabyRole> {
  const role = await getBabyRole(supabase, babyId);
  if (!role) throw new NotAuthorizedError();
  return role;
}

export async function requireParent(
  supabase: Db,
  babyId: string
): Promise<void> {
  const role = await getBabyRole(supabase, babyId);
  if (role !== "parent") throw new NotAuthorizedError();
}

// Pure business rules (unit-tested). UI hiding is UX only — these run in
// every server action, and RLS re-checks everything at the database.

export function canCreateRecordType(role: BabyRole, type: RecordType): boolean {
  return role === "parent" || type === "note";
}

export function canEditRecord(
  role: BabyRole,
  rec: { type: RecordType; created_by: string },
  userId: string
): boolean {
  if (role === "parent") return true;
  return rec.type === "note" && rec.created_by === userId;
}

export function canDeleteRecord(
  role: BabyRole,
  rec: { type: RecordType; created_by: string },
  userId: string
): boolean {
  return canEditRecord(role, rec, userId);
}
