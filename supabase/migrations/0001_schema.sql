create type baby_role as enum ('parent', 'caregiver');
create type record_type as enum ('medical_history', 'allergy', 'routine', 'note');
create type invitation_status as enum ('pending', 'accepted', 'revoked');

-- Mirrors auth.users; app-owned display fields live here.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  date_of_birth date not null,
  description text check (char_length(description) <= 500),
  photo_url text,                      -- unused in day one; here to avoid a migration
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.baby_members (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role baby_role not null,
  created_at timestamptz not null default now(),
  unique (baby_id, user_id)
);
create index baby_members_user_idx on public.baby_members (user_id);

create table public.baby_records (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  type record_type not null,
  title text not null check (char_length(title) between 1 and 200),
  content text check (char_length(content) <= 5000),
  record_date date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index baby_records_baby_idx on public.baby_records (baby_id, type, created_at desc);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  invited_email text,                  -- informational only in prototype
  token_hash text not null unique,     -- sha256 hex of raw token; raw token never stored
  role baby_role not null default 'caregiver',
  status invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_baby_idx on public.invitations (baby_id);

-- Auto-create profile on signup (display_name from signup metadata).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
