# Founder Admin Panel & Email-Flow Verification — Design

**Date:** 2026-07-24
**Driver:** George needs founder visibility (registrations, users, activity) for the beta; Athif asked for an in-app admin panel George can log into, plus verification that auth emails work.
**Mode:** Executed autonomously per Athif's instruction.

## Problem

Famify has no admin surface. RLS (correctly) restricts every user to their own
family's data, so George's normal account can see nothing beyond his family. The
app is a static SPA on Apache/cPanel — there is no server tier to host an admin
API. Auth email behavior (confirmation, password reset) has never been verified.

## Approaches considered

1. **`is_admin` flag + SECURITY DEFINER RPCs (chosen).** Postgres functions owned
   by the DB superuser return cross-family aggregates and a user list, but only
   when the caller's profile has `is_admin = true`. The SPA calls them via the
   normal authenticated Supabase client. No new infrastructure, no service key in
   the client, RLS untouched.
2. Admin-aware RLS policies (`OR is_admin()` on every table) — rejected: touches
   every policy, easy to get wrong, and George needs aggregates, not row access.
3. PHP proxy on cPanel holding the service role key — rejected: puts the most
   powerful key on shared hosting and forks the architecture.

## Design

### Database (`supabase/migrations/017_admin_panel.sql`)

- `ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;`
- `public.is_app_admin()` — SECURITY DEFINER helper: true iff the current
  `auth.uid()`'s profile has `is_admin`.
- `public.admin_get_stats()` — JSON: total users, families, children, plus new
  users in the last 7 and 30 days. Raises `insufficient_privilege` for non-admins.
- `public.admin_list_users(p_limit, p_offset)` — table of name, email, role,
  family name, created_at, last_sign_in_at (email/last sign-in read from
  `auth.users`, which SECURITY DEFINER permits). Same admin gate.
- `REVOKE ... FROM PUBLIC, anon; GRANT EXECUTE TO authenticated;` on both RPCs.
- Applied by pasting into the Supabase SQL Editor (the project's established
  process; no DB credentials exist locally). Granting admin to a person is one
  UPDATE against their email, included as a commented template.

### Frontend

- `AdminPage.tsx` at `/admin` inside the authenticated `AppLayout`. On mount it
  calls `admin_get_stats`; a permission error redirects to `/dashboard`, so the
  page is harmless for non-admins even though the route exists.
- Content: a KPI row of stat tiles (users, families, children, new this week /
  month) and a users table (name, email, role, family, signed up, last sign-in)
  — the registrations/activity view George asked for.
- Sidebar gains an "Admin" item visible only when the logged-in profile has
  `is_admin` (profile row already fetched by AuthContext; add the field to the
  Profile type).
- No mutations in v1 — read-only by design. User management stays in Supabase.

### Email verification (independent of the panel)

1. Inspect existing users via the GoTrue admin API (service role key from root
   `.env`, used locally only) to learn whether email confirmation is enforced.
2. Register `claude-max+famify-beta-test@flemmings-iceland.de` through the real
   production UI with Playwright; observe whether the app requires confirmation.
3. Trigger a password recovery for that address (sends a real email); confirm
   `recovery_sent_at` via the admin API; Athif checks the inbox for delivery.
4. Report findings, including Supabase built-in SMTP limits (a few emails/hour,
   spam-prone) and the recommendation to configure custom SMTP before beta.

### Testing

`tests/admin.spec.ts`: non-admin demo login gets bounced from `/admin` to the
dashboard; admin login (once the migration is applied and a test admin exists)
sees the stat tiles and user rows. The non-admin half runs immediately; the
admin half is gated on the SQL paste.

## Out of scope

- Admin mutations (disable user, reset password) — Supabase dashboard covers this.
- Retention/engagement charts — needs event tracking that doesn't exist yet.
- Custom SMTP setup — needs a provider decision (flagged in the report).
