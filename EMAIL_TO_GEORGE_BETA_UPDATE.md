# Draft reply to George — beta prep update (2026-07-24)

> Review before sending. Items in [brackets] need Athif's input or a decision.

---

Hello George,

Thanks for the notes from your meeting with Cheick — good suggestions, and most of them are already done. Here's a consolidated update.

## What's now live in the codebase (ready to deploy)

**1. Landing page with user reviews.** famify.co now opens on a proper landing page instead of jumping straight to the login screen. Visitors immediately see a reviews section ("What families say about Famify") with testimonial cards, star ratings, a features overview (Planner, Child Hub, Needle), and clear sign-up buttons. The review quotes are currently placeholders — as soon as beta families give us real feedback, we swap the text in one place and redeploy. Please start collecting short quotes (name, role, 1–2 sentences) from the Sudbury families.

**2. Video beside the hero.** The landing page has a dedicated video slot on the right side of the hero, exactly as Cheick suggested. Until you send me the final "family version" file, it shows a styled "See Famify in action" placeholder. Send me the MP4 (short is fine — the player is sized for it) and it will appear automatically once I drop it in.

**3. Famify icon.** The browser-tab icon is now the Famify family-tree logo (it was previously the default developer icon), including the iPhone home-screen icon and social-share metadata.

All of this is covered by automated browser tests (Playwright) — 29 checks pass, including a live login test against the real backend.

## Beta access

- **Web:** famify.co — works on desktop and mobile browsers. Families can register directly; there's also a working "Try Demo" account for showing the product without signing up.
- **Mobile apps:** the mobile app (Flutter) is not yet at distribution stage. For the 3-week Sudbury beta I recommend running it as a **web-first beta** — famify.co works well on phones, and parents can "Add to Home Screen" so it behaves like an app. TestFlight/Play Internal Testing requires Apple ($99/yr) and Google ($25) developer accounts plus review lead time. [Athif: confirm mobile timeline/decision.]

## Data security & privacy (what you can tell parents)

- All traffic is encrypted in transit (HTTPS/TLS).
- Data lives in Supabase (managed PostgreSQL) with encryption at rest.
- Passwords are never stored in plain text — industry-standard hashing via Supabase Auth.
- Every table is protected by row-level security policies: a family can only ever read or write its own family's data; children's records are only visible to members of that family. Caregiver sharing uses expiring, revocable secure links.
- No data is sold or shared with third parties.

## Admin visibility & analytics

Famify now has a **built-in Founder Dashboard**. Log in with your own account and an "Admin" item appears in the navigation. It shows total users, families, children, new sign-ups (7/30 days), weekly active users, and a full list of registered users with their family, sign-up date, and last sign-in — the registration/activity visibility you asked for. It is read-only and only accounts flagged as admin can see it (other users are automatically turned away).

Your founder account is ready: log in at famify.co with **georgeobiora51@yahoo.com** / password **FamifyFounder2026!**. (The app doesn't have in-app password change yet — it's on the pre-beta fix list; ask me when you want it rotated.)

For deeper operations (deleting users, resending emails), the Supabase dashboard remains the tool; I can add you there as a read-only member if needed.

## Platforms & accounts

- Code repository: GitHub [Athif: confirm access arrangement]
- Hosting: Vercel (web app) + famify.co domain
- Backend/auth/database: Supabase
- Apple / Google developer accounts: not yet created — needed only when mobile distribution starts. These should be created under Famify's ownership so they belong to the company from day one.

## Email delivery — important for the beta

I tested the sign-up email flow end to end. Registration requires email confirmation, and the confirmation email sends correctly — but our current email service is the built-in development one, which is limited to **roughly 2 emails per hour**. With 15–30 families registering in one evening, most confirmation emails would never arrive and those families could not log in. Before the beta starts we must do one of:

1. **Connect a proper email service** (e.g. Resend or Brevo — both have free tiers that cover a beta) so confirmation and password-reset emails are reliable, or
2. **Temporarily disable email confirmation** for the beta so families can sign up and use the app immediately.

[Athif: decision + 30 min of setup either way.] I also fixed the sign-up screen so users are clearly told to check their email after registering.

## Outstanding changes & timeline

[Athif: fill in the agreed April list status and realistic dates here before sending.]

Best,
Athif
