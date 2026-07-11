// ALL reads live here. Every query runs through the user-scoped client, so
// RLS filters rows; a null result means "doesn't exist or no access".
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getMyBabies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baby_members")
    .select("role, babies(id, name, date_of_birth, description)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .filter((m) => m.babies !== null)
    .map((m) => ({ role: m.role, baby: m.babies! }));
}

export async function getBaby(babyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("babies")
    .select("*")
    .eq("id", babyId)
    .maybeSingle();
  return data;
}

export async function getRecords(babyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baby_records")
    .select("*, author:profiles!baby_records_created_by_fkey(display_name)")
    .eq("baby_id", babyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMembers(babyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("baby_members")
    .select("id, user_id, role, created_at, profile:profiles(display_name, email)")
    .eq("baby_id", babyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPendingInvitations(babyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, invited_email, expires_at, created_at")
    .eq("baby_id", babyId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getInvitationPreview(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation_preview", {
    raw_token: token,
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

// How far back "Recent Medical History" looks on the doctor-visit summary.
// Allergies/medications/vaccinations are never windowed — they're standing
// facts, not visit history.
export const DOCTOR_VISIT_HISTORY_MONTHS = 12;

export async function getDoctorVisitSummary(babyId: string) {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - DOCTOR_VISIT_HISTORY_MONTHS);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("baby_records")
    .select("*, author:profiles!baby_records_created_by_fkey(display_name)")
    .eq("baby_id", babyId)
    .or(
      `type.in.(allergy,medication,vaccination),and(type.eq.medical_history,or(record_date.is.null,record_date.gte.${cutoffDate}))`
    )
    .order("record_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const records = data ?? [];
  return {
    allergies: records.filter((r) => r.type === "allergy"),
    medications: records.filter((r) => r.type === "medication"),
    vaccinations: records.filter((r) => r.type === "vaccination"),
    medicalHistory: records.filter((r) => r.type === "medical_history"),
  };
}
