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
