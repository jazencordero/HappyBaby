create extension if not exists pgcrypto;

create or replace function public.is_baby_member(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.baby_members
                 where baby_id = b and user_id = auth.uid());
$$;

create or replace function public.is_baby_parent(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.baby_members
                 where baby_id = b and user_id = auth.uid() and role = 'parent');
$$;

-- Needed by members_insert: a plain subquery on babies would be filtered by
-- babies_select (membership), which can't exist before the first member row.
create or replace function public.is_baby_creator(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.babies
                 where id = b and created_by = auth.uid());
$$;

alter table public.profiles     enable row level security;
alter table public.babies       enable row level security;
alter table public.baby_members enable row level security;
alter table public.baby_records enable row level security;
alter table public.invitations  enable row level security;

-- profiles: read profiles of people you share a baby with (names on notes), edit own.
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or exists (select 1 from public.baby_members m1
             join public.baby_members m2 on m1.baby_id = m2.baby_id
             where m1.user_id = auth.uid() and m2.user_id = profiles.id)
);
create policy profiles_update on public.profiles for update using (id = auth.uid());

-- babies
create policy babies_select on public.babies for select using (public.is_baby_member(id));
create policy babies_insert on public.babies for insert with check (created_by = auth.uid());
create policy babies_update on public.babies for update using (public.is_baby_parent(id));
create policy babies_delete on public.babies for delete using (public.is_baby_parent(id));

-- baby_members
create policy members_select on public.baby_members for select
  using (public.is_baby_member(baby_id));
-- Only self-insert as parent of a baby you just created. Caregiver rows are
-- created exclusively by the accept_invitation() SECURITY DEFINER function.
create policy members_insert on public.baby_members for insert with check (
  user_id = auth.uid() and role = 'parent'
  and public.is_baby_creator(baby_id)
);
create policy members_delete on public.baby_members for delete using (
  public.is_baby_parent(baby_id) and role = 'caregiver'   -- parents can't remove parents (or themselves)
);

-- baby_records
create policy records_select on public.baby_records for select
  using (public.is_baby_member(baby_id));
create policy records_insert on public.baby_records for insert with check (
  created_by = auth.uid()
  and ( public.is_baby_parent(baby_id)
        or (public.is_baby_member(baby_id) and type = 'note') )
);
create policy records_update on public.baby_records for update using (
  public.is_baby_parent(baby_id)
  or (created_by = auth.uid() and type = 'note' and public.is_baby_member(baby_id))
);
create policy records_delete on public.baby_records for delete using (
  public.is_baby_parent(baby_id)
  or (created_by = auth.uid() and type = 'note' and public.is_baby_member(baby_id))
);

-- invitations: parents only. Token holders never read this table directly —
-- they go through the two RPCs below.
create policy invitations_all on public.invitations for all
  using (public.is_baby_parent(baby_id)) with check (public.is_baby_parent(baby_id));

-- Safe preview for the acceptance page (works signed-out; leaks only baby name
-- + validity to someone who already holds the link).
-- search_path includes `extensions`: Supabase installs pgcrypto (digest) there.
create or replace function public.get_invitation_preview(raw_token text)
returns table (baby_name text, inviter_name text, state text)
language plpgsql security definer set search_path = public, extensions as $$
declare inv record;
begin
  select i.*, b.name as bname, p.display_name as pname into inv
  from invitations i
  join babies b on b.id = i.baby_id
  join profiles p on p.id = i.invited_by
  where i.token_hash = encode(digest(raw_token, 'sha256'), 'hex');
  if not found then return query select null::text, null::text, 'invalid'; return; end if;
  return query select inv.bname, inv.pname,
    case when inv.status = 'revoked' then 'revoked'
         when inv.status = 'accepted' then 'accepted'
         when inv.expires_at < now() then 'expired'
         else 'valid' end;
end; $$;

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
  insert into baby_members (baby_id, user_id, role)
    values (inv.baby_id, auth.uid(), inv.role)
    on conflict (baby_id, user_id) do nothing;   -- already a member: fine
  update invitations set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
    where id = inv.id;
  return inv.baby_id;
end; $$;
