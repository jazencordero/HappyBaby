# E2E Results — §20 Acceptance Checklist

**Run:** 2026-07-10 · **Target:** local production build (`next build` + `next start`)
against local Supabase (Docker), headless Chromium (desktop viewport for parent,
375×812 mobile viewport for caregiver).

> Production URL pending human provisioning (docs/DEPLOY.md — T02/T22). Rerun with
> `BASE=https://<app>.vercel.app node p20_test.mjs` after deploy.

## Functional

| # | Item | Result |
|---|---|---|
| 1 | Parent signup | ✅ |
| 2 | Baby created | ✅ |
| 3 | All 4 record types added | ✅ |
| 4 | Record edited | ✅ |
| 5 | Record deleted | ✅ |
| 6 | Invite link generated & copyable (43-char token) | ✅ |
| 7 | Caregiver signup (2nd browser context) | ✅ |
| 8 | Invite accepted | ✅ |
| 9 | Caregiver sees all records | ✅ |
| 10 | Caregiver has no edit controls on parent records | ✅ |
| 11 | Caregiver type selector locked to Note | ✅ |
| 12 | Caregiver adds note (mobile drawer) | ✅ |
| 13 | Caregiver edits own note | ✅ |
| 14 | Parent sees note with author name | ✅ |
| 15 | Parent removes caregiver | ✅ |
| 16 | Removed caregiver loses access on refresh | ✅ |
| 17 | Reused invite link rejected | ✅ |
| 18 | Revoked link rejected | ✅ |
| 19 | Unrelated account gets 404 on baby URL | ✅ |

## Security (§14, local)

- RLS enabled on all 5 tables; 17 SQL impersonation tests pass (3 users + anon):
  non-member 0 rows, caregiver forged `medical_history` insert blocked, caregiver
  note allowed, caregiver can't edit parent records, second `accept_invitation`
  blocked, parent can't self-remove, removed caregiver 0 rows.
- Anon-key REST reads of `baby_records`/`profiles`/`invitations` → `[]`.
- No service-role key anywhere (repo, env, bundle). Grep audit clean:
  no client-side writes, all 12 actions Zod-parse input, `next` redirects
  validated relative, no `dangerouslySetInnerHTML`, no record content in logs.
- Invitations at rest: sha256 hash only, single-use, 7-day expiry.
- Weak password rejected at signup (Zod min 8; GoTrue min 6 backstop).

## Quality

- Unit tests: 20/20 green (`npm test`) — full permission matrix + schema edges.
- `next build` clean; `npm run lint` and `tsc --noEmit` clean.
- Mobile 375px: bottom drawer, no horizontal overflow, touch-sized controls.
- Demo-data banner, `robots` noindex, error/loading/empty states present.

## Outstanding (blocked on human dashboard access)

1. T02: Supabase project (EU) + Vercel import + env vars — see docs/DEPLOY.md.
2. T22/T23: rerun this checklist against the prod URL, desktop + real phone.
3. T24: cleanup test data, `git tag prototype-v1`.
