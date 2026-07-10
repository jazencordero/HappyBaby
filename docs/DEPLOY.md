# Deploying HappyBaby (human steps — T02/T22)

`next build` passes locally and CI-deploys from `main` once Vercel is connected.

## 1. Supabase project (~5 min)

1. supabase.com → **New project** → region `eu-central-1` (Frankfurt). Save the DB password in a password manager.
2. **Auth → Providers → Email**: ON. **"Confirm email": OFF** (prototype — see SPEC §2.4).
3. Apply migrations, either:
   - CLI: `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`
   - or paste `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_grants.sql` into the SQL Editor **in that order**.
4. Verify: Database → Tables → all 5 tables show the RLS badge.

## 2. Vercel (~5 min)

Import the GitHub repo (framework auto-detected). Set env vars — names match `.env.example`:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (Settings → API). Publishable; RLS is the guard |
| `NEXT_PUBLIC_APP_URL` | `https://<app>.vercel.app` — invite-link base, no trailing slash |

**Do not add a service-role key anywhere.** The app never uses it.

## 3. Supabase auth URLs (after first deploy)

Auth → URL Configuration:
- Site URL: `https://<app>.vercel.app`
- Redirect URLs: add `https://<app>.vercel.app/**` and `http://localhost:3000/**`

## 4. Verify

Run the §20 acceptance checklist + §14 security checklist on the production URL
(desktop + phone). Log results in `docs/E2E-RESULTS.md`.

## Operations

- Rollback: Vercel → Deployments → Promote previous.
- Data inspection: Supabase Table Editor. Logs: Vercel functions + Supabase Logs.
- Test-data cleanup: delete test babies in Table Editor (cascades), then Auth → Users → delete test users (cascades to profiles).
