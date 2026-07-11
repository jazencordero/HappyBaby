# HappyBaby — One-Day Prototype Technical Specification

**Version:** 1.0 · **Date:** 2026-07-10 · **Status:** Ready to build
**Target:** Deployed, publicly accessible prototype in one working day (~10 focused hours)

---

## 1. Executive Recommendation

**Build:** A single Next.js (App Router) full-stack application backed by Supabase (Auth + Postgres + Row Level Security), deployed on Vercel. It implements: email/password auth, baby profiles, six structured record categories (medical history, allergy, routine, note, vaccination, medication), a copyable-link caregiver invitation flow, caregiver notes, role-based access (PARENT / CAREGIVER), and immediate access revocation. Server-side authorization is enforced twice: in Postgres RLS policies (primary) and in server-action permission helpers (business rules + clear errors).

> **Post-launch iteration note (2026-07-11):** originally four record categories; `vaccination` and `medication` were added as an additive migration per §8 simplification #2's documented path. See §8 and §9 below, updated in place.

**Do not build:** Photo upload, password reset, outbound invitation emails, search, AI, reminders, document uploads, audit UI, delete-baby-cascade UI polish, or anything in the "Out of Scope" list. Photo upload is explicitly **cut from day one** even though the field exists in the schema — private storage buckets + signed URLs cost ~1 hour and validate nothing about the core scenario.

**Recommended stack (Option A):** Next.js 15 + TypeScript (strict) + Supabase (Auth, Postgres, RLS) + Tailwind CSS + shadcn/ui + react-hook-form + Zod + date-fns + Vercel.

**Why:** One vendor covers auth, database, and authorization enforcement; RLS gives database-level protection for sensitive child data even if application code has bugs; it is the single most-documented stack combination in existence, which maximizes AI coding agent accuracy; deployment to Vercel is one command; and the relational Postgres model directly supports the future doctor-visit/medical-record use case (Firebase's document model does not).

**Biggest risk:** Authorization correctness — specifically RLS policy recursion on the membership table and the invitation-acceptance write path. Both are solved in this spec with `SECURITY DEFINER` helper functions and a single `accept_invitation` RPC. This work is scheduled in the morning, not the afternoon.

**One-day feasibility:** High (~85%) for the full scope; ~95% with the documented fallback (replace token invitations with "add caregiver by email"). The fallback preserves every acceptance criterion except the invitation link itself.

---

## 2. Assumptions

Defaults chosen; flagged items need confirmation but do not block starting.

1. **Repo exists**: `/workspaces/HappyBaby` is an empty git repo (README only). We build inside it — no new repo needed.
2. One developer (plus AI agents), ~10 focused hours.
3. **Accounts needed** (⚠️ confirm access): free Supabase account, free Vercel account, GitHub repo connectable to Vercel. Both free tiers are sufficient.
4. **Email confirmation is disabled** in Supabase Auth for the prototype (⚠️ confirm acceptable). Supabase's built-in SMTP is rate-limited (~4 emails/hour), which would break testing with multiple accounts. Sign-up logs the user in immediately. Consequence: password reset is deferred too (it needs email).
5. Invitations may be accepted by **any authenticated user holding the link** (email matching optional and off by default). Documented simplification — see §9.
6. Prototype testers will be told to use **demo/non-real medical data**; a visible banner says so (§15).
7. UI is English-only, optimized around one baby per parent, but the data model supports multiple babies.
8. Hosting region: Supabase project in **EU (Frankfurt)** as a GDPR-friendly default (⚠️ confirm; switch to US East if testers are US-based — pick once, at project creation).
9. No custom domain; the Vercel-provided `*.vercel.app` URL is the public URL.
10. Caregiver removal is a **hard delete** of the membership row (no `removed_at` soft delete). See §8 simplifications.

---

## 3. Final Prototype Scope

### In scope
- Email/password sign up, sign in, sign out (Supabase Auth), protected routes, session handling
- Baby profile: create, view, edit (name, DOB, description); multiple babies supported at DB level
- Records: create/list/edit/delete for `medical_history`, `allergy`, `routine`, `note`, `vaccination`, `medication` (the latter two added post-launch, §8)
- Role model: PARENT and CAREGIVER, enforced server-side and at the database
- Invitation: parent generates a single-use, expiring, copyable link; signed-in user accepts; becomes caregiver
- Caregiver: views everything shared, creates/edits/deletes **own notes only**
- Parent: views caregiver notes, removes caregivers (access revoked immediately), revokes pending invitations
- Delete baby (parent only, confirmation dialog, DB cascade) — cheap because of `ON DELETE CASCADE`
- Responsive mobile-first UI, loading/empty/error states, toasts
- Production deployment on Vercel with continuous deploy from `main`

### Out of scope (day one)
Photo upload, password reset, invitation emails, search, AI anything, reminders/notifications, document uploads, vaccinations as a distinct type, audit log UI, analytics, i18n, offline, native apps, billing, additional roles, field-level permissions, real-time updates.

### Definition of done / success criteria
The 13-step scenario from the brief passes **on the production URL, on desktop and mobile**:
parent signs up → creates baby → adds one record of each type → generates invite link → caregiver signs up in another browser → accepts → sees all records → adds a note → parent sees the note → caregiver has no edit controls on parent records **and** direct mutation attempts fail server-side → an unrelated account gets 404/unauthorized on the baby URL → parent removes caregiver → caregiver immediately loses access.

---

## 4. Stack Comparison

| Criterion | **A: Next.js + Supabase + Vercel** | B: Next.js + Clerk + Neon + Drizzle | C: React + Firebase |
|---|---|---|---|
| Setup speed | ★★★ one vendor, one dashboard | ★★ two vendors (Clerk + Neon), ORM setup | ★★★ fast |
| Auth speed | ★★★ built-in email/pw, `@supabase/ssr` | ★★★ Clerk is fastest pure-auth DX | ★★ good |
| Database complexity | ★★★ plain Postgres + SQL migrations | ★★ Postgres + Drizzle schema/migrate step | ★ Firestore denormalization for shared access is painful |
| Authorization | ★★★ RLS = DB-level enforcement (defense in depth) | ★★ app-code only; one missed check = leak | ★★ security rules powerful but error-prone, hard to test |
| Invitations | ★★★ RPC function + hashed token | ★★★ same pattern in server actions | ★★ awkward token queries in rules |
| File upload readiness | ★★★ Supabase Storage + policies later | ★★ add S3/UploadThing later | ★★★ Firebase Storage |
| Type safety | ★★★ generated DB types + Zod | ★★★ Drizzle is best-in-class | ★ weak (untyped documents) |
| AI agent compatibility | ★★★ most-documented combo on the internet | ★★★ well documented | ★★ rules DSL trips agents up |
| Deploy speed | ★★★ Vercel git push | ★★★ Vercel | ★★★ |
| Vendor lock-in | ★★ low — it's Postgres; export anytime | ★★ Clerk lock-in on auth | ★ high — Firestore data model is Firebase-shaped |
| Security risk | Low (RLS backstop) | Medium (app-code-only authz) | Medium (rules mistakes) |
| Future fit (medical records, AI retrieval) | ★★★ relational + pgvector available later | ★★★ relational | ★ document model fights structured medical history |
| One-day feasibility | **High** | High | Medium |

**Decision: Option A.** The deciding factors are (1) database-level authorization for sensitive child data, (2) one vendor instead of two, (3) relational Postgres matching the long-term medical-record vision, (4) maximum AI-agent familiarity. Option B is a respectable second; Option C is rejected — Firestore's model actively hurts the confirmed doctor-visit use case and shared-access queries.

---

## 5. Recommended Architecture

Single full-stack Next.js app. No separate backend. No microservices.

| Concern | Choice | Notes |
|---|---|---|
| Frontend | Next.js 15, App Router, React 19, TypeScript `strict` | Server Components for reads |
| Backend | Next.js Server Actions (mutations) + Server Components (reads) | No REST API layer; one exception: `/auth` routes Supabase needs |
| Database | Supabase Postgres | SQL migrations in `supabase/migrations/` |
| Auth | Supabase Auth, email/password, email confirmation OFF | `@supabase/ssr` for cookie sessions; middleware refreshes sessions |
| Authorization | **RLS policies (primary) + server-action helpers (business rules)** | UI hiding is UX only, never security |
| Hosting | Vercel, continuous deploy from `main` | Deploy "hello world" in hour 1 |
| File storage | Supabase Storage (deferred) | `photo_url` column exists; bucket created in iteration 2 |
| Validation | Zod, schemas shared between form and server action | Every server action parses input with Zod first |
| UI | Tailwind CSS + shadcn/ui + Lucide icons | shadcn components: button, card, input, textarea, label, select, dialog, drawer, dropdown-menu, tabs, badge, avatar, skeleton, sonner (toast), alert-dialog, form |
| Forms | react-hook-form + `@hookform/resolvers/zod` | shadcn `Form` wrapper |
| Dates | date-fns (`format`, `formatDistanceToNow`, age calc) | Store dates as `date`/`timestamptz` in DB |
| Error monitoring | Vercel function logs + a `logError(context, err)` helper that never logs record content | Sentry deferred |
| Analytics | None | Explicitly none — medical-adjacent data |
| Testing | Vitest unit tests for permission helpers + Zod schemas; scripted manual E2E | Playwright deferred |
| Env vars | `.env.local` (gitignored) local; Vercel dashboard prod | See §16 |

**Data flow:** Server Component → user-scoped Supabase client (anon key + user cookie) → RLS filters rows. Mutation: Client form → Server Action → Zod parse → permission helper → user-scoped Supabase write (RLS re-checks) → `revalidatePath`. The **service-role key is used nowhere** in day one; the two privileged operations (accept invitation, preview invitation) are `SECURITY DEFINER` Postgres functions called via RPC, which keeps the service-role key out of the app entirely.

---

## 6. Information Architecture

### Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Landing: one headline, sign up / sign in buttons. Redirects to `/dashboard` if signed in |
| `/signup` | Public | Name, email, password |
| `/login` | Public | Email, password |
| `/auth/signout` | Auth (route handler, POST) | Clears session, redirects `/` |
| `/dashboard` | Auth | Baby list. **If exactly one baby → redirect to it.** If zero → redirect `/babies/new` |
| `/babies/new` | Auth | Create baby form |
| `/babies/[babyId]` | Auth + member | Records: header, tabbed record sections |
| `/babies/[babyId]/doctor-visit` | Auth + member | Read-only aggregated summary (allergies, medications, vaccinations, recent medical history) |
| `/babies/[babyId]/caregivers` | Auth + parent | Caregiver panel + invite dialog (moved here from the bottom of the records page) |
| `/babies/[babyId]/settings` | Auth + parent | Edit profile + delete-baby danger zone (moved here from a header dropdown) |
| `/invite/[token]` | Public page, accept requires auth | Invitation preview + accept |

Navigation: minimal top header (app name → `/dashboard`, user menu with sign out) for everything outside `/babies/[babyId]/*`.

> **Post-launch iteration note (2026-07-11):** the line above used to end "No sidebar. Baby dashboard is the home surface; everything else is dialogs/drawers on it." That's superseded, not re-litigated — it was the right call for a one-day prototype with one record surface; four destinations (Records / Doctor Visit / Caregivers / Settings) earned a persistent nav. `/babies/[babyId]/layout.tsx` now wraps all four routes in a **persistent left sidebar on desktop, slide-out sheet on mobile** (shadcn `sidebar` + `sheet`), fetching baby + role once (React `cache()`-deduped `getBaby`/`getCurrentBabyRole` in `src/lib/db/queries.ts`) and re-running the same `notFound()`-on-null-role guard the old page-only version used, so a non-member still 404s on every subpage, not just `/babies/[babyId]` itself. Parents see all four sidebar items; caregivers see Records and Doctor Visit only. The horizontal `RecordTabs` (Medical/Allergies/Routine/Care notes/Vaccinations/Medications) stay nested inside the Records destination — they were not flattened into top-level sidebar items.

### Role-specific views
- **Parent sees:** all 4 sidebar destinations. Records: all sections with add/edit/delete on everything. Caregivers: "Invite caregiver" button, member list with remove buttons, pending invitations with revoke. Settings: edit/delete baby.
- **Caregiver sees:** 2 sidebar destinations (Records, Doctor Visit) — no Caregivers/Settings nav items at all, not just hidden controls within them. Records is read-only, **except** Care Notes where they can add, and edit/delete rows they authored; a `Caregiver` role badge.

---

## 7. User Flows

1. **Parent onboarding:** `/` → Sign up → account created + session set (no email confirm) → `/dashboard` → zero babies → `/babies/new`.
2. **Baby creation:** submit name + DOB (+optional description) → server action creates `babies` row **and** `baby_members` row (role `parent`) → redirect `/babies/[id]` → empty states in every section.
3. **Record creation:** "Add record" (parent) or "Add note" (caregiver) → drawer on mobile / dialog on desktop → type, title, description, optional date → save → toast → list revalidates. Caregiver's type selector shows only Note (server enforces).
4. **Caregiver invitation:** parent clicks "Invite caregiver" → dialog, optional email field → server action generates token, stores hash → dialog shows full URL with copy button → parent sends it via any channel.
5. **Caregiver acceptance:** opens `/invite/[token]` → page shows baby name + inviter ("You've been invited to help care for Mila") → if signed out: sign in / sign up buttons that return to this URL (`?next=`) → signed in: "Accept invitation" → RPC validates + creates membership + marks token accepted → redirect to baby dashboard.
6. **Caregiver note:** caregiver on baby dashboard → Care Notes tab → "Add note" → saves with `created_by = caregiver` → parent sees it with the caregiver's name and timestamp.
7. **Access removal:** parent → caregiver panel → Remove → confirm dialog → membership row deleted → caregiver's very next request returns no rows (RLS) → they see the "no access" screen.
8. **Unauthorized access:** any authenticated non-member hitting `/babies/[id]` → RLS returns zero rows → page renders 404-style "You don't have access to this profile" (no existence leak). Expired/revoked/used invite token → friendly "invitation no longer valid" state.

---

## 8. Database Schema

All migrations live in `supabase/migrations/`. Two files: `0001_schema.sql`, `0002_rls.sql`.

```sql
-- 0001_schema.sql
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
```

**Post-launch addition (`0004_structured_records.sql`, `0005_record_details.sql`):** per simplification #2 below, `record_type` gained two values (`vaccination`, `medication`) via `alter type ... add value` — each in its own migration file, since Postgres requires that to commit before the value is usable — and `baby_records` gained a nullable `details jsonb` column for their typed fields (`vaccineName`/`doseNumber`/`administeredBy` or `medicationName`/`dose`/`schedule`). No RLS policy changes were needed: `records_insert`'s caregiver clause already keyed off `type = 'note'` by construction, so the new types are parent-only for free, re-verified by impersonation test.

### Field ownership: auth provider vs. app database
- **Supabase Auth (`auth.users`) owns:** email (canonical), password hash, session/refresh tokens, `id`.
- **`public.profiles` owns:** `display_name`, `avatar_url`, and a *copy* of email for display/joins (synced at signup; email change flows are out of scope).

### Simplifications and their migration cost
1. **No `removed_at` on memberships (hard delete).** Revocation = `DELETE`, which makes RLS trivially correct and re-inviting possible under the `unique(baby_id, user_id)` constraint. *Cost:* no caregiver-access audit history. *Migration:* add an `access_events` append-only table later; no schema conflict.
2. **Single flexible `baby_records` table, free-text content.** No per-category fields (dose, vaccine name…). *Cost:* future structured medical records need either typed columns per category or a `jsonb details` column — an additive migration either way. **Resolved post-launch:** `vaccination`/`medication` types plus a `details jsonb` column, validated per-type in `src/lib/validation/records.ts` (see schema addendum above).
3. **Invitation `status` enum + timestamps together.** Slight redundancy, but reads are simple and the RPC keeps them consistent.
4. **`invited_email` not enforced** at acceptance. *Cost:* none structurally; enforcement is a one-line check later.
5. **No `updated_at` triggers** — server actions set it explicitly. One less moving part.

---

## 9. Permission Model

### Role matrix (enforced; UI additionally hides what a role can't do)

| Action | Parent | Caregiver | Non-member |
|---|---|---|---|
| View baby / records / members | ✅ | ✅ | ❌ (sees 404) |
| Edit / delete baby | ✅ | ❌ | ❌ |
| Add medical / allergy / routine / vaccination / medication record | ✅ | ❌ | ❌ |
| Add note | ✅ | ✅ | ❌ |
| Edit/delete any record | ✅ | ❌ | ❌ |
| Edit/delete **own** note | ✅ | ✅ | ❌ |
| Invite caregiver / revoke invitation | ✅ | ❌ | ❌ |
| Remove caregiver | ✅ | ❌ | ❌ |
| Accept invitation (valid token) | any authenticated user | — | — |

### Enforcement layer 1 — RLS (`0002_rls.sql`)

The membership check must be a `SECURITY DEFINER` function: policies on `baby_members` that query `baby_members` recurse infinitely otherwise. This is the #1 known gotcha; do it first.

```sql
-- 0002_rls.sql
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
  and exists (select 1 from public.babies b where b.id = baby_id and b.created_by = auth.uid())
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
```

### Invitation RPCs (same migration)

```sql
-- Safe preview for the acceptance page (works signed-out; leaks only baby name
-- + validity to someone who already holds the link).
create or replace function public.get_invitation_preview(raw_token text)
returns table (baby_name text, inviter_name text, state text)
language plpgsql security definer set search_path = public as $$
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
language plpgsql security definer set search_path = public as $$
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
```

(`digest` requires `create extension if not exists pgcrypto;` — first line of `0002_rls.sql`.)

### Enforcement layer 2 — server helpers (`src/lib/permissions.ts`)

RLS makes violations *fail*; helpers make them fail **fast with clear errors** and carry the business rules the UI needs:

```ts
export type BabyRole = 'parent' | 'caregiver';

export async function getBabyRole(supabase, babyId: string): Promise<BabyRole | null>;
export async function requireMember(supabase, babyId): Promise<BabyRole>;   // throws NotAuthorizedError
export async function requireParent(supabase, babyId): Promise<void>;

export function canCreateRecordType(role: BabyRole, type: RecordType): boolean; // caregiver → only 'note'
export function canEditRecord(role: BabyRole, rec: {type; created_by}, userId): boolean;
export function canDeleteRecord(...): boolean;  // same rule as edit
```

The pure functions (`canCreateRecordType`, `canEditRecord`, `canDeleteRecord`) take plain data — these get unit tests.

### Secure vs. insecure — the pattern agents must follow

```ts
// ❌ INSECURE: trusts a role sent from the client, uses service-role client
export async function deleteRecord(recordId: string, role: string) {
  if (role === 'parent') await adminDb.from('baby_records').delete().eq('id', recordId);
}

// ✅ SECURE: derives identity from session, checks ownership server-side,
// writes through the user-scoped client so RLS re-verifies everything.
export async function deleteRecord(input: unknown) {
  const { recordId } = deleteRecordSchema.parse(input);
  const supabase = await createServerClient();          // user-scoped, cookie session
  const rec = await getRecordOrNotFound(supabase, recordId); // RLS-filtered read
  const role = await requireMember(supabase, rec.baby_id);
  if (!canDeleteRecord(role, rec, (await getUser(supabase)).id)) throw new NotAuthorizedError();
  const { error } = await supabase.from('baby_records').delete().eq('id', recordId);
  if (error) throw error;
  revalidatePath(`/babies/${rec.baby_id}`);
}
```

### Edge cases
- **Removed caregiver mid-session:** their JWT is still valid, but every query is RLS-filtered per request → next navigation/action returns nothing → UI shows "no access". No token invalidation needed.
- **Parent removes themselves / another parent:** blocked — `members_delete` policy only allows deleting `caregiver` rows.
- **Token reuse:** `accept_invitation` requires `status = 'pending'` under `for update` lock → second use fails, no race.
- **Caregiver crafts `type: 'medical_history'` in a note request:** Zod allows it structurally, helper rejects, and RLS `records_insert` rejects independently.
- **IDOR:** all IDs are UUIDv4 *and* every read is RLS-scoped — guessing IDs yields empty results.

---

## 10. Server Action Design

All mutations are Server Actions in `src/actions/`. Reads happen in Server Components via `src/lib/db/queries.ts`. Every action: (1) Zod-parse input, (2) auth check, (3) permission helper, (4) user-scoped Supabase call, (5) `revalidatePath`, (6) return `{ ok: true, data } | { ok: false, error: string }` — never throw raw errors to the client, never include DB error details.

| Action (file) | Input schema (Zod) | Auth/Authz | Output | Error cases | Caller |
|---|---|---|---|---|---|
| `signUp` (`auth.ts`) | `{ displayName: string(1-80), email: email, password: string(8-72) }` | public | redirect `/dashboard` | email taken, weak password | Sign-up page |
| `signIn` (`auth.ts`) | `{ email, password }` | public | redirect `/dashboard` | invalid credentials (generic message) | Sign-in page |
| `createBaby` (`babies.ts`) | `{ name: 1-100, dateOfBirth: past date, description?: ≤500 }` | authenticated | `{babyId}` + redirect | validation | `/babies/new` |
| `updateBaby` (`babies.ts`) | `{ babyId: uuid, name, dateOfBirth, description? }` | parent of baby | `{ok}` | not parent, not found | Baby settings dialog |
| `deleteBaby` (`babies.ts`) | `{ babyId: uuid }` | parent | redirect `/dashboard` | not parent | Settings dialog (confirm) |
| `createRecord` (`records.ts`) | `{ babyId, type: enum, title: 1-200, content?: ≤5000, recordDate?: date }` | member; caregiver ⇒ type must be `note` | `{record}` | wrong type for role, not member | Add record drawer |
| `updateRecord` (`records.ts`) | `{ recordId, title, content?, recordDate? }` (type immutable) | parent, or author of own note | `{ok}` | not permitted, not found | Edit drawer |
| `deleteRecord` (`records.ts`) | `{ recordId: uuid }` | parent, or author of own note | `{ok}` | not permitted | Record card menu (confirm) |
| `createInvitation` (`invitations.ts`) | `{ babyId: uuid, invitedEmail?: email }` | parent | `{inviteUrl}` (raw token in URL only) | not parent | Invite dialog |
| `revokeInvitation` (`invitations.ts`) | `{ invitationId: uuid }` | parent | `{ok}` | not parent | Invitations list |
| `acceptInvitation` (`invitations.ts`) | `{ token: string(43) }` | authenticated → RPC `accept_invitation` | `{babyId}` + redirect | invalid / expired / revoked / used | `/invite/[token]` |
| `removeCaregiver` (`members.ts`) | `{ babyId: uuid, userId: uuid }` | parent; target must be caregiver | `{ok}` | not parent, target is parent | Caregiver row (confirm) |

**Reads** (`src/lib/db/queries.ts`, all RLS-scoped): `getMyBabies()`, `getBaby(babyId)` (null → `notFound()`), `getRecords(babyId)` (joined with author `display_name`), `getMembers(babyId)`, `getPendingInvitations(babyId)`, `getInvitationPreview(token)` (RPC, works signed-out).

**Token generation** (`src/lib/invitations.ts`): `crypto.randomBytes(32).toString('base64url')` (43 chars) → store `sha256` hex in `token_hash` → URL `${NEXT_PUBLIC_APP_URL}/invite/${rawToken}`. Raw token is never persisted or logged.

**Logging:** actions log `{ action, userId, babyId, ok }` on failure paths via `logError()` — never titles/content.

---

## 11. Frontend Component Specification

Hierarchy (S = server component, C = client component; shadcn primitives in parentheses):

```
RootLayout (S) — fonts, ToastProvider (sonner), demo-data banner
└── AppHeader (S) — logo→/dashboard · UserMenu (C: dropdown-menu, avatar)
Routes:
/            LandingPage (S) — hero copy, 2 buttons (button, card)
/signup      SignUpForm (C: form, input, button)
/login       SignInForm (C: form, input, button)
/dashboard   BabyList (S) → BabyCard (S: card, avatar) · EmptyBabies (S)
/babies/new  BabyForm (C: form, input, textarea, native date input)
/babies/[id]/layout.tsx (S) — getBaby/getCurrentBabyRole (cached) → notFound() guard,
             shared by every /babies/[id]/* route below
             ├── BabySidebar (C, usePathname for active state) — shadcn `sidebar`+`sheet`:
             │       Records · Doctor Visit · (parent only) Caregivers · Settings
             └── SidebarInset
                 ├── /babies/[id]              RecordsPage (S)
                 │   ├── BabyHeader (S) — name, age (date-fns), RoleBadge (badge)
                 │   ├── RecordTabs (C: tabs — Medical | Allergies | Routine | Care notes | Vaccinations | Medications)
                 │   │   └── RecordSection (S) → RecordCard (S: card) + RecordCardMenu (C)
                 │   │       └── RecordEmptyState (S) — per-category copy + add CTA
                 │   └── AddRecordButton (C) → RecordFormDrawer (C: drawer mobile / dialog desktop,
                 │           form, select type — filtered by role, input, textarea, date)
                 │           └── RecordDetailsFields (C) — vaccination/medication typed fields
                 ├── /babies/[id]/doctor-visit  DoctorVisitPage (S, read-only, no menus)
                 │   └── DoctorVisitSection (S) ×4 — Allergies/Medications/Vaccinations/Recent Medical History
                 ├── /babies/[id]/caregivers    CaregiversPage (S, parent only)
                 │   ├── InviteCaregiverDialog (C: dialog, input, copy-to-clipboard InvitationLinkPanel)
                 │   └── CaregiverPanel (S) → CaregiverRow + RemoveCaregiverButton (C: alert-dialog),
                 │           PendingInvitationRow + RevokeButton (C)
                 └── /babies/[id]/settings      SettingsPage (S, parent only)
                     └── BabySettingsPanel (C: BabyForm inline + danger-zone dialog, alert-style confirm)
/invite/[t]  InvitePage (S) — preview via RPC → AcceptInvitationButton (C)
             states: valid / invalid / expired / revoked / accepted / signed-out (login CTA with ?next=)
Shared: ErrorState, UnauthorizedState, LoadingSkeleton (skeleton), ConfirmDialog (alert-dialog)
```

Key contracts:
- **RecordCard** props: `{ record, authorName, canEdit, canDelete }` — booleans computed server-side from role + ownership; the client never decides permissions.
- **RecordFormDrawer** props: `{ babyId, role, editing?: Record }` — type selector options: parent → all six; caregiver → `note` only (locked). Vaccination/medication render extra typed fields (`RecordDetailsFields`) validated against a per-type Zod shape (`details jsonb`).
- **RoleBadge** props: `{ role }` — "Parent" (primary tint) / "Caregiver" (neutral tint), always visible on baby header.
- **InvitationLinkPanel** props: `{ url }` — read-only input + copy button + "Anyone with this link can join as a caregiver. It expires in 7 days."
- Everything renders server-side by default; only forms, menus, dialogs, tabs are client components. No custom-styled components beyond Tailwind utility classes on shadcn primitives.

---

## 12. UI Specification

**Direction:** warm, calm, trustworthy. Soft off-white background, one warm accent (Tailwind `rose-500`/`orange-400` family), generous whitespace, `rounded-2xl` cards, Lucide icons per category (Stethoscope=medical, ShieldAlert=allergies, Moon=routine, MessageSquareHeart=notes, Syringe=vaccination, Pill=medication), system font stack or Inter. No illustrations, no animations beyond shadcn defaults. Not clinical, not toy-like.

**Layout:** single column, `max-w-2xl mx-auto px-4`, mobile-first. Touch targets ≥44px. Record entry uses a **bottom drawer on mobile** (shadcn `drawer`), dialog ≥`md`. Tabs for categories (segmented, scrollable on mobile).

**States (consolidated pattern, applied everywhere):**
- *Loading:* route-level `loading.tsx` with skeletons for header + 3 cards. Buttons show spinner + disable while a server action is pending (`useTransition`).
- *Empty:* every record section gets one sentence of friendly category-specific copy + add CTA (e.g. Allergies: "No allergies recorded. That's worth recording too — add 'No known allergies' so caregivers know you checked.").
- *Errors:* server actions return friendly messages → toast (sonner). Route-level `error.tsx`: "Something went wrong" + retry. Never raw errors/stack traces.
- *Unauthorized / not found:* one shared 404-style screen ("This page doesn't exist or you don't have access") — same for both, to avoid existence leaks.
- *Invitation states:* valid → accept card; expired/revoked/used/invalid → distinct one-line explanations + "Ask the parent for a new link".
- *Destructive confirms:* `alert-dialog` for delete record, remove caregiver, delete baby (delete baby requires typing the baby's name).
- *Form validation:* inline field errors via react-hook-form + Zod, on submit.
- *Timestamps:* `formatDistanceToNow` ("2 hours ago") + absolute date on records; author name on every record card.

---

## 13. Repository Structure

```
HappyBaby/
├── docs/SPEC.md                     # this document
├── .env.local                       # gitignored
├── .env.example                     # names only, committed
├── middleware.ts                    # Supabase session refresh + route protection
├── supabase/
│   ├── migrations/
│   │   ├── 0001_schema.sql
│   │   └── 0002_rls.sql             # RLS + helper fns + invitation RPCs
│   └── seed.sql                     # optional local demo data
├── src/
│   ├── app/
│   │   ├── layout.tsx  page.tsx  error.tsx  globals.css
│   │   ├── login/page.tsx  signup/page.tsx
│   │   ├── auth/signout/route.ts
│   │   ├── dashboard/page.tsx  dashboard/loading.tsx
│   │   ├── babies/new/page.tsx
│   │   ├── babies/[babyId]/page.tsx  loading.tsx  not-found.tsx
│   │   └── invite/[token]/page.tsx
│   ├── actions/                     # ALL mutations live here
│   │   ├── auth.ts  babies.ts  records.ts  invitations.ts  members.ts
│   ├── components/
│   │   ├── ui/                      # shadcn-generated ONLY — never hand-edited
│   │   ├── auth/  babies/  records/  caregivers/  shared/
│   ├── lib/
│   │   ├── supabase/  server.ts  client.ts  middleware.ts   # client factories
│   │   ├── db/queries.ts            # ALL reads live here
│   │   ├── permissions.ts           # role helpers + pure permission fns
│   │   ├── invitations.ts           # token generate/hash
│   │   ├── validation/  babies.ts  records.ts  invitations.ts  auth.ts  # Zod
│   │   ├── errors.ts  utils.ts  log.ts
│   ├── types/database.ts            # supabase gen types
│   └── tests/permissions.test.ts  validation.test.ts  invitations.test.ts
```

Rules for agents: mutations only in `src/actions/`; reads only in `src/lib/db/queries.ts`; Zod schemas only in `src/lib/validation/`; permission logic only in `src/lib/permissions.ts`; never import `src/lib/supabase/client.ts` (browser client) into server code or vice versa; files ≤ ~150 lines — split when bigger.

---

## 14. Security Specification

**Required today (blocking public URL):**
1. RLS enabled on **all five tables** — verified in Supabase dashboard (Database → tables → RLS badge) and by the manual cross-account test.
2. Service-role key: not in the repo, not in `NEXT_PUBLIC_*`, ideally not in Vercel at all (day one needs no admin client).
3. All mutations behind server actions with Zod parse + permission helper; zero client-side Supabase writes.
4. Invitation tokens: 256-bit random, hashed at rest, single-use, 7-day expiry, transmitted only in the URL.
5. Middleware protects `/dashboard`, `/babies/*`; unauthenticated → `/login?next=…`.
6. Generic auth errors ("Invalid email or password"), generic 404 for no-access.
7. HTTPS (automatic on Vercel/Supabase). Secrets only in env vars.
8. No record content in logs, no analytics at all.

**Threats & mitigations:** IDOR → RLS + UUIDs; privilege escalation via forged input → server derives role from session, never from client; invitation link leak → expiry + single-use + revoke + parent-visible pending list; removed-caregiver stale session → per-request RLS; XSS → React escaping, no `dangerouslySetInnerHTML`, content rendered as plain text; CSRF → Next.js server actions have built-in origin checks; open redirect → `next` param validated to be a relative path.

**Manual security checklist before sharing the URL** (do this on production, ~15 min):
- [ ] Account C (never invited) opens Account A's baby URL → 404 screen, and network tab shows no record data
- [ ] Caregiver session: call `updateRecord` on a parent record via the UI-less path (edit URL / devtools replay) → error
- [ ] Caregiver drawer cannot submit non-note type (and forged request fails)
- [ ] Accepted invite link opened again → "no longer valid"
- [ ] Revoked pending link → "no longer valid"
- [ ] Removed caregiver refreshes → no data
- [ ] `curl` Supabase REST endpoint with anon key, no auth: `curl "https://<ref>.supabase.co/rest/v1/baby_records?select=*" -H "apikey: <anon>"` → empty array / 401
- [ ] View page source & JS bundle: no service-role key string
- [ ] Signup with weak password rejected; SQL-ish input in titles stored inertly

**Deferred (fine for prototype, required before real users):** rate limiting beyond Supabase auth defaults, Sentry, CAPTCHA on signup, email verification, session-revocation on password change, CSP headers, dependency audit, pen test.

**Timeline-created risks:** no automated authz regression tests beyond unit-tested pure helpers (mitigated by RLS being declarative), no staging environment (mitigated: prototype data only).

---

## 15. Privacy and Compliance Notes

Practical posture: this is a prototype processing data about children — treat it seriously, don't pretend it's certified.

- **Recommendation: invited testers only, demo-or-real-but-minimal data, with a persistent banner:** "HappyBaby is an early prototype. Please don't store real medical details yet." Don't index the landing page (`robots: noindex`). This is the honest middle ground — blocking real data entirely is unenforceable anyway.
- GDPR relevance: real (EU users, health-adjacent data about minors). Prototype measures: EU hosting region (Frankfurt), data minimization (only fields in §8, no analytics, no content in logs), purpose limitation (data used only to render the app).
- **Deletion:** delete-baby cascades all records/members/invitations (built). Account deletion: manual on request via Supabase dashboard for the prototype (`auth.users` delete cascades to `profiles`; note: babies created by the user need manual cleanup — acceptable at this scale). Document the request path: email the maintainer.
- Third-party processors: Supabase, Vercel. No others. No AI calls.
- Placeholders: one `/` footer line — "Prototype · Privacy: we store what you enter to show it to you and people you invite; nothing else. Contact <email> for deletion." A full policy page is iteration-2.
- Data export: future requirement; Postgres makes it easy later.
- Retention: none defined for prototype; wipe all test data at the end of the testing round (documented in §16).

Do **not** claim GDPR/HIPAA compliance anywhere in the UI.

---

## 16. Deployment Specification

Deploy hello-world in hour 1; every later push auto-deploys.

1. **Supabase project:** supabase.com → New project → region `eu-central-1` → save DB password in a password manager. Auth → Providers → Email: ON; **"Confirm email": OFF**. Auth → URL Configuration: Site URL `http://localhost:3000` for now.
2. **Local env** — `.env.local` / `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>          # publishable; RLS is the guard
   NEXT_PUBLIC_APP_URL=http://localhost:3000          # invite link base
   ```
   No service-role key anywhere.
3. **Migrations:** `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push` (applies `supabase/migrations/*`). Alternative if CLI auth stalls (time-box 10 min): paste the two SQL files into the Supabase SQL Editor — identical result, keep files in repo as source of truth.
4. **Vercel:** push repo to GitHub → vercel.com → Import → framework auto-detected (build `next build`) → set the three env vars with `NEXT_PUBLIC_APP_URL=https://<app>.vercel.app` → Deploy. Continuous deploy from `main` is the default.
5. **Auth URLs:** Supabase → Auth → URL Configuration → Site URL `https://<app>.vercel.app`; add `https://<app>.vercel.app/**` and `http://localhost:3000/**` to Redirect URLs.
6. **Types:** `npx supabase gen types typescript --linked > src/types/database.ts` (rerun after schema changes).
7. **Seed:** none in prod — the E2E walkthrough creates the demo family. `supabase/seed.sql` optional for local.
8. **Verification:** run the §17 manual E2E + §14 security checklist on the prod URL, desktop + phone.
9. **Operations:** rollback = Vercel → Deployments → Promote previous (schema changes are additive day-one, so no down-migrations needed). Monitoring = Vercel function logs + Supabase Logs (API/Postgres). Inspect data = Supabase Table Editor. **Cleanup:** delete test babies via Table Editor (cascades), then Auth → Users → delete test users (cascades to profiles).

---

## 17. One-Day Development Plan

~10h focused. Deploy early; authorization before UI polish. Each phase has a hard timebox — hitting the box means take the listed fallback, not overrun.

| # | Phase | Timebox | Done when | Fallback if over |
|---|---|---|---|---|
| 0 | Stack decision | done | this spec | — |
| 1 | Scaffold + deploy: create-next-app, Tailwind, shadcn init+components, Supabase project, Vercel hello-world live | 0:00–0:45 | public URL renders | skip shadcn extras, add per-need |
| 2 | Auth: supabase clients, middleware, signup/login/signout, profile trigger | 0:45–1:45 | two accounts can sign up/in/out on localhost | drop `?next=` redirect niceties |
| 3 | **Schema + RLS + RPCs** (`0001`, `0002`, `db push`, gen types) | 1:45–2:45 | SQL-editor tests as two users prove policies | trim `profiles_select` cross-visibility (show "Caregiver" instead of names) |
| 4 | Babies: create form, dashboard redirect logic, baby header + tabs skeleton | 2:45–3:30 | parent creates baby, lands on its page | defer edit/delete baby to phase 9 |
| 5 | Records CRUD: queries, actions, RecordFormDrawer, RecordCard, empty states | 3:30–5:00 | all 4 types create/edit/delete for parent | defer edit (keep create+delete) |
| 6 | **Invitations:** token lib, create/revoke actions, invite dialog + copy link, `/invite/[token]` page, accept RPC | 5:00–6:30 | caregiver joins via link in 2nd browser | **switch to add-by-email fallback (below)** |
| 7 | Caregiver experience: role-aware props, note-only drawer, RoleBadge, own-note edit/delete, remove-caregiver | 6:30–7:15 | matrix behaviors visible in UI | — (this is core, protected) |
| 8 | **Permission testing:** run full §14 checklist + §18 E2E locally with 3 accounts; fix | 7:15–8:00 | every row of the matrix verified | cut phase 9 to extend this |
| 9 | Polish: loading.tsx, error.tsx, toasts, mobile pass, landing copy, banner, confirms | 8:00–9:00 | no blank screens, phone usable | ship with rough-but-working UI |
| 10 | Production verification: env vars, prod E2E on desktop+phone, security checklist, cleanup | 9:00–10:00 | §20 checklist green | — (mandatory) |

**Highest-risk point:** Phase 3. If RLS policies fight back for >1h, the day compresses. Mitigation: the policies in §9 are complete and known-good patterns — apply verbatim.
**Cut line (first to go, in order):** landing polish → edit record → edit baby → delete baby → revoke-invitation UI → pending-invitations list.
**Protected core (never cut):** RLS, records create/view, caregiver join (either mechanism), caregiver notes, remove caregiver, prod deploy.

**Fallback invitation ("add by email"):** parent enters caregiver's email → server action looks up `profiles` by email → inserts caregiver membership directly (via one extra `SECURITY DEFINER` function `add_caregiver_by_email(baby_id, email)` that verifies the caller `is_baby_parent`). Caregiver must sign up first; parent adds them after. Loses: link UX, expiry, pending state. Keeps: every security property and all 13 acceptance steps except the link itself. ~30 min to implement.

---

## 18. Engineering Backlog

Complexity: S ≤30 min, M ≤1 h, L ≤1.5 h. AI = suitable for a coding agent. HR = human review required (all security-relevant code gets HR).

**Setup**
- **T01 · Scaffold app** — `create-next-app@latest` (TS, Tailwind, App Router, `src/`), shadcn init + add `button card input textarea label select dialog drawer dropdown-menu tabs badge avatar skeleton sonner alert-dialog form`, deps (`@supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers date-fns lucide-react vitest`), folder skeleton per §13, `.env.example`. *AC:* `npm run dev` renders; lint passes. S · AI ✓ · HR light
- **T02 · Vercel + Supabase provisioning** — human task: accounts, project (EU), Vercel import, env vars, hello-world deployed. *AC:* public URL live. S · AI ✗
- **T03 · Supabase client factories + middleware** — `lib/supabase/{server,client,middleware}.ts` per `@supabase/ssr` docs; `middleware.ts` refreshes session, redirects unauthenticated from `/dashboard|/babies` to `/login?next=`, validates `next` is relative. *AC:* protected route redirects; session survives refresh. M · AI ✓ · **HR (security)**

**Auth**
- **T04 · Auth pages + actions** — `signUp/signIn` actions (Zod: §10), signout route handler, `/login` `/signup` forms (shadcn form), generic error messages, redirect handling. *AC:* full auth loop works with 2 accounts. M · AI ✓ · HR
- **T05 · Profile trigger** — in `0001_schema.sql` (see T06); verify a signup creates a `profiles` row with display name. S · AI ✓ · **HR (security definer)**

**Database & authorization**
- **T06 · Migration 0001 schema** — exactly §8. *AC:* `db push` clean; tables/enums/trigger exist; `gen types` runs. S · AI ✓ · HR
- **T07 · Migration 0002 RLS + RPCs** — exactly §9 (pgcrypto, helper fns, all policies, both RPCs). *AC:* SQL-editor impersonation tests: non-member sees 0 rows; caregiver insert of `medical_history` fails; caregiver `note` succeeds; second `accept_invitation` call fails. M · AI ✓ · **HR mandatory, line-by-line**
- **T08 · Permission helpers + unit tests** — `lib/permissions.ts` + `tests/permissions.test.ts` covering every matrix row as pure-function cases. *AC:* `vitest run` green; every §9 matrix row asserted. M · AI ✓ · HR
- **T09 · Zod schemas** — `lib/validation/*` per §10 (incl. DOB must be past, title lengths, uuid checks) + `tests/validation.test.ts`. S · AI ✓

**Babies**
- **T10 · Create baby** — action (creates baby + parent membership in sequence; on membership failure delete the baby row and error), `/babies/new` form. *AC:* creator lands on baby page as Parent. M · AI ✓ · HR
- **T11 · Dashboard + redirects** — `getMyBabies`, 0→`/babies/new`, 1→baby page, n→BabyCard list. S · AI ✓
- **T12 · Baby page shell** — header (name, age via date-fns, RoleBadge), tabs, `not-found.tsx`, `loading.tsx`. *AC:* non-member gets 404 screen. M · AI ✓
- **T13 · Edit/delete baby** — settings menu (parent only), update action, delete with type-name confirm → cascades → `/dashboard`. S · AI ✓ · HR

**Records**
- **T14 · Record queries + create** — `getRecords` (with author names), `createRecord` action, `RecordFormDrawer` (drawer<md/dialog≥md), role-filtered type selector. *AC:* parent creates all 4 types; caregiver drawer offers only Note. L · AI ✓ · HR
- **T15 · Record display** — `RecordSection` per tab, `RecordCard` (title, content, record_date, author, relative time, menu gated by `canEdit/canDelete`), per-category empty states. M · AI ✓
- **T16 · Edit/delete record** — update/delete actions (ownership rules per §9), edit prefills drawer, delete confirm. *AC:* caregiver can edit own note only; parent can edit anything. M · AI ✓ · HR

**Invitations & caregivers**
- **T17 · Token lib + create/revoke** — `lib/invitations.ts`, `createInvitation` (returns URL once), `revokeInvitation`, InviteCaregiverDialog with copy button + expiry note. *AC:* URL contains 43-char token; DB has only the hash. M · AI ✓ · **HR mandatory**
- **T18 · Acceptance page** — `/invite/[token]`: preview RPC, all five token states, signed-out CTA with `?next=`, `acceptInvitation` action → redirect. *AC:* full second-browser join works; reused/revoked/expired links show friendly states. L · AI ✓ · **HR mandatory**
- **T19 · Caregiver panel** — `getMembers`/`getPendingInvitations`, caregiver list with names+roles, remove-caregiver (confirm) → instant revocation, pending invites with revoke. *AC:* removed caregiver's next request shows no data. M · AI ✓ · HR

**Polish, deploy, test**
- **T20 · States & toasts** — sonner on all action results, error.tsx, skeletons, disabled/pending buttons, demo-data banner, landing page copy, footer privacy line. M · AI ✓
- **T21 · Mobile pass** — 375px audit of every screen; drawer ergonomics; touch targets; tab overflow. S · AI ✓ (screenshot review by human)
- **T22 · Production config** — prod env vars incl. `NEXT_PUBLIC_APP_URL`, Supabase auth URLs, redeploy, invite links point at prod. S · AI ✗ (human, 15 min)
- **T23 · E2E + security verification** — execute §3 scenario + §14 checklist on prod, desktop + phone; log results in `docs/E2E-RESULTS.md`. M · **human mandatory**
- **T24 · Launch cleanup** — remove test data, confirm banner + noindex, final `git tag prototype-v1`. S

Dependency spine: T01→T03→T04; T06→T07→T08; T07 blocks T10+; T14→T15→T16; T17→T18→T19; T22→T23.

---

## 19. Coding Agent Prompt Sequence

Run in order. Global preamble to prepend to every prompt:

> You are working in the HappyBaby repo, a Next.js 15 App Router + TypeScript strict + Tailwind + shadcn/ui + Supabase app. Read `docs/SPEC.md` sections referenced below before writing code. Rules: mutations only in `src/actions/`; reads only in `src/lib/db/queries.ts`; Zod schemas in `src/lib/validation/`; permission logic in `src/lib/permissions.ts`; never use a Supabase service-role key; never do permission checks only in the client; files ≤150 lines; do not modify `src/components/ui/*` (shadcn-generated) or `supabase/migrations/*` unless the task says so. After changes run `npm run lint && npx tsc --noEmit` and fix errors. Return a summary of files created/changed.

**P1 — Scaffold (T01):** *Objective:* initialize the app per SPEC §13. Run `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"`, `npx shadcn@latest init`, add the component list from SPEC §5, install deps listed in T01, create the folder skeleton and `.env.example`, add `vitest` config and an npm `test` script. *Acceptance:* dev server renders a placeholder landing page; `npm test` runs (0 tests ok). *Do not:* configure Supabase yet.

**P2 — Supabase clients + middleware (T03):** *Objective:* implement `src/lib/supabase/server.ts` (async, cookie-based, per `@supabase/ssr` current docs), `client.ts`, `middleware.ts` helper, and root `middleware.ts` with matcher `['/dashboard/:path*','/babies/:path*']`, redirecting unauthenticated users to `/login?next=<pathname>` where `next` must start with `/`. *Acceptance:* visiting `/dashboard` signed out redirects to login. *Do not:* import server client in client components.

**P3 — Migrations (T06+T07):** *Objective:* create `supabase/migrations/0001_schema.sql` and `0002_rls.sql` **verbatim from SPEC §8 and §9** (pgcrypto extension first in 0002). *Acceptance:* `npx supabase db push` succeeds; then run `npx supabase gen types typescript --linked > src/types/database.ts`. *Do not:* alter any policy logic, add tables, or "improve" the SQL.

**P4 — Auth (T04):** *Objective:* implement SPEC §10 `signUp`/`signIn` actions (Zod schemas in `lib/validation/auth.ts`; `signUp` passes `display_name` in `options.data`), `/auth/signout/route.ts` (POST), `/signup` and `/login` pages with shadcn forms, generic error messages, support `?next=` redirect after login. *Acceptance:* sign up → `/dashboard`; profiles row exists; wrong password shows generic error; signout works.

**P5 — Permissions + validation (T08+T09):** *Objective:* implement `src/lib/permissions.ts` and remaining `lib/validation/*` exactly per SPEC §9/§10, plus `src/tests/permissions.test.ts` and `validation.test.ts` covering every permission-matrix row and schema edge (past DOB, length limits, uuid). *Acceptance:* `npm test` green; matrix rows each have ≥1 assertion.

**P6 — Babies (T10–T12):** *Objective:* `createBaby` action (baby + parent membership; compensating delete on failure), `/babies/new` form, `getMyBabies`/`getBaby` queries, `/dashboard` redirect logic (0→new, 1→baby, n→list of BabyCards), `/babies/[babyId]` shell with BabyHeader (age via date-fns), RoleBadge, tabs placeholder, `not-found.tsx` used when `getBaby` returns null, `loading.tsx`. *Acceptance:* create → land on baby page as Parent; second account gets 404 screen on that URL.

**P7 — Records (T14–T16):** *Objective:* per SPEC §10/§11: `getRecords`, `createRecord`/`updateRecord`/`deleteRecord` actions, `RecordFormDrawer` (drawer <768px, dialog otherwise; type select filtered by role prop, locked to Note for caregivers), `RecordSection` + `RecordCard` (author, dates, menu gated by server-computed `canEdit`/`canDelete`), per-category empty states from SPEC §12, delete confirm, toasts. *Acceptance:* parent full CRUD on all types; type immutable on edit; caregiver path compiles but is exercised after P8.

**P8 — Invitations (T17+T18):** *Objective:* `lib/invitations.ts` (32-byte base64url token, sha256 hex hash), `createInvitation`/`revokeInvitation`/`acceptInvitation` actions (accept calls RPC `accept_invitation` and maps Postgres exceptions `invalid_invitation`/`invitation_not_active`/`not_authenticated` to friendly messages), InviteCaregiverDialog with copy-to-clipboard URL panel, `/invite/[token]` page using `get_invitation_preview` RPC with all five states from SPEC §11, signed-out CTA preserving `?next=`. *Acceptance:* second browser joins as caregiver; reused link shows "no longer valid". *Security:* raw token only in the returned URL — never logged or stored.

**P9 — Caregiver experience (T19 + caregiver paths of P7):** *Objective:* CaregiverPanel (parent-only): member list with display names, remove caregiver (alert-dialog confirm) via `removeCaregiver` action, pending invitations with revoke. Wire role-aware props through the baby page so caregivers see read-only records, note-only add, edit/delete on own notes, and no parent controls. *Acceptance:* every row of SPEC §9 matrix demonstrable in UI with two accounts; removed caregiver refresh shows 404 screen.

**P10 — Polish (T20+T21):** *Objective:* landing page copy per SPEC §12, demo-data banner in root layout, footer privacy line, `error.tsx`, pending states on all submit buttons, 375px mobile audit fixes, `robots` noindex metadata. *Acceptance:* no blank screens; all §12 states present; lighthouse-level sanity on mobile.

**P11 — Deploy assist (T22):** *Objective:* verify `next build` passes locally, produce a checklist diff of required Vercel env vars vs `.env.example`, and print the Supabase auth URL configuration values for the production domain. Human applies dashboard changes.

**P12 — Security review (pre-T23):** *Objective:* audit the codebase against SPEC §14: grep for service-role usage, client-side writes (`from(...).insert|update|delete` in client components), unvalidated action inputs, actions missing permission helpers, logged record content, `dangerouslySetInnerHTML`, unvalidated `next` redirects. Output a findings table with file:line; fix trivial issues, flag the rest. *Acceptance:* zero critical findings or all fixed.

---

## 20. Final Acceptance Checklist

**Functional (on production URL):** ☐ parent signup ☐ baby created ☐ all 4 record types added ☐ record edited ☐ record deleted ☐ invite link generated & copied ☐ caregiver signup (2nd browser) ☐ invite accepted ☐ caregiver sees all records ☐ caregiver adds note ☐ caregiver edits own note ☐ parent sees note with author name ☐ parent removes caregiver ☐ removed caregiver loses access on refresh ☐ reused invite link rejected ☐ revoked link rejected ☐ unrelated account gets 404 on baby URL

**Security (§14 manual checklist):** ☐ all 9 items pass ☐ RLS badge on all 5 tables ☐ no service-role key in bundle/env

**Quality:** ☐ works on a real phone ☐ no blank/raw-error screens ☐ empty states everywhere ☐ toasts on success/failure ☐ demo-data banner visible ☐ unit tests green ☐ `next build` clean

**Ops:** ☐ continuous deploy from main ☐ env vars documented in `.env.example` ☐ E2E results logged in `docs/E2E-RESULTS.md` ☐ test-data cleanup procedure verified ☐ tagged `prototype-v1`

---

## 21. Risks and Tradeoffs

- **Technical:** RLS misconfiguration is the top risk — mitigated by verbatim known-good policies, SECURITY DEFINER helpers, mandatory human review of `0002_rls.sql`, and the manual cross-account tests. Next.js/`@supabase/ssr` API drift — mitigated by pinning to the pattern in current docs during P2.
- **Product:** the flexible record model may feel too generic for medical data — acceptable; it's the validated-learning surface, and iteration 2 adds structure. Single-baby-optimized UI may annoy multi-child testers — DB already supports it.
- **Security:** any-authenticated-user invite acceptance means a leaked link = access until revoked/expired — accepted for prototype, disclosed in the invite dialog copy; email-match enforcement is a one-line change later. No rate limiting on record creation — spam risk only, prototype-acceptable.
- **Timeline:** phases 3 and 6 can overrun — both have pre-decided fallbacks (§17); the cut line is explicit.
- **Simplifications & migration costs:** hard-delete memberships (→ add audit table later), free-text record content (→ additive `jsonb details` or typed tables later), no soft deletes anywhere (→ acceptable pre-users), email in profiles denormalized (→ sync job if email change ships), status enum + timestamps redundancy (→ trivial).

---

## 22. Recommended Next Iteration

In order, after prototype feedback:

1. **Invitation hardening + email delivery** (email matching, Resend for outbound invites, password reset via proper SMTP) — closes the prototype's biggest accepted risk.
2. **Structured medical records:** add `details jsonb` + typed forms for **vaccinations** and **medications** (name, dose, schedule) as new record types — this is the direct path to the confirmed doctor-visit use case.
3. **Doctor-visit view:** one read-only screen aggregating allergies, medications, vaccinations, recent medical events — "show this at the doctor". High value, pure read layer over existing data.
4. **Search** (Postgres full-text over records — no vector DB yet).
5. **AI retrieval grounded only in stored records** (question answering over the baby's data with citations to records) — only after structure and search exist, because grounding quality depends on them.
6. Photo upload (private bucket + signed URLs), account deletion self-service, audit events table.

Do not start reminders, documents/OCR, or additional roles until the doctor-visit loop proves valuable.
