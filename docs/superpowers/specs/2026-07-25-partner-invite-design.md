# Partner / Spouse Invitation Flow — Design

**Date:** 2026-07-25
**Driver:** Athif: parents should be able to add a wife/husband; today the only
path is manually reading an 8-char invite code out of the Profile page.
**Mode:** Executed autonomously per Athif's standing instruction.

## Problem

A second parent can only join by (1) independently registering, (2) being told
the invite code out-of-band, (3) finding the Join Family form and typing it.
Each step loses people. There is no "add partner" affordance anywhere.

## Approaches considered

1. **Shareable join link + Invite Partner UI (chosen).** `/join/<inviteCode>`
   carries the code through registration automatically; Profile gets an
   "Invite Partner" panel with a copyable link and prefilled email draft.
   Works with the existing schema, RLS, and static hosting.
2. Create the partner's account directly from the app — rejected: requires the
   service-role admin API, which cannot ship in a browser-only app.
3. Placeholder "shadow member" rows until the partner signs up — rejected:
   fake members pollute the family list and still need a join flow later.

## Design

### `/join/:code` route (public, `JoinFamilyPage`)

- **Logged in:** call `joinFamily(code)`. Success → dashboard. Duplicate
  membership (unique violation) → treated as "already in this family" →
  dashboard. Unknown code → friendly error with a link home.
- **Logged out:** store the code as `famify-pending-invite` in localStorage and
  redirect to `/register`, which shows a small "You've been invited to join a
  family on Famify" banner when a pending invite exists.

### FamilySetupPage

Prefills the Join form's invite code from the pending invite and clears the
stored code after a successful join (either form). A newly registered +
confirmed partner therefore lands on family setup with the code already in
place — one click to join.

### ProfilePage — Invite Partner panel

In the family card: an **Invite Partner** button revealing the join link
(`{origin}/join/{invite_code}`) with a Copy button and an "Email invite"
mailto: link with prefilled subject/body. The raw invite code stays visible
for anyone who prefers it.

### Error handling

`joinFamily` errors surface in the join page and setup form (existing rose
banner pattern). Duplicate-join is not an error to the user.

## Testing (`tests/invite-flow.spec.ts`)

- Logged-out visit to `/join/<code>` redirects to /register and stores the code.
- Register page shows the invited banner when a pending invite exists.
- Logged-in QA visiting `/join/<own family code>` ends on the dashboard
  (duplicate-membership grace path).
- Profile shows the Invite Partner panel with the correct join link.
- Full regression suite stays green.

## Out of scope

- Emailing invites from the backend (needs SMTP/server work — beta list).
- Roles beyond the existing parent default; removing members.
