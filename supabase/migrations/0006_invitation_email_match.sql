-- SPEC §8 simplification #4: "invited_email not enforced at acceptance...
-- enforcement is a one-line check later." Recreated whole, not ALTERed
-- piecemeal, per RLS verification protocol.
create or replace function public.accept_invitation(raw_token text)
returns uuid  -- baby_id on success; raises on failure
language plpgsql security definer set search_path = public, extensions as $$
declare inv record;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into inv from invitations
    where token_hash = encode(digest(raw_token, 'sha256'), 'hex')
    for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if inv.status <> 'pending' or inv.expires_at < now() then
    raise exception 'invitation_not_active';
  end if;
  -- Only enforced when the parent set an email at invite time (optional
  -- field). Null invited_email keeps the documented default: any
  -- authenticated holder of the link may accept (SPEC §2.5/§21).
  if inv.invited_email is not null
     and lower(inv.invited_email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'email_mismatch';
  end if;
  insert into baby_members (baby_id, user_id, role)
    values (inv.baby_id, auth.uid(), inv.role)
    on conflict (baby_id, user_id) do nothing;   -- already a member: fine
  update invitations set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
    where id = inv.id;
  return inv.baby_id;
end; $$;
