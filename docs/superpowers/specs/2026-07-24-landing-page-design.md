# Landing Page, Reviews & Favicon — Design

**Date:** 2026-07-24
**Driver:** George's beta-prep requests (reviews on famify.co, intro video beside hero, Famify favicon)
**Mode:** Executed autonomously per Athif's instruction; decisions below use sensible defaults and are easy to revise.

## Problem

famify.co currently has no landing page — `/` redirects to `/dashboard`, which bounces
unauthenticated visitors to `/login`. George wants visitors to immediately see user
reviews, a short intro video beside the hero, and the Famify icon in the browser tab
(currently the default Vite icon).

## Approaches considered

1. **Full marketing landing page at `/` (chosen).** New `LandingPage.tsx` rendered at
   the root route: hero + video slot + reviews + CTA. Matches "once users click
   famify.co, they see users' reviews."
2. Add reviews to the login page — rejected: clutters the auth flow, doesn't read as a
   product site.
3. Separate static marketing site — rejected: second deployment to maintain during beta.

## Design

- **Route change:** `/` renders `LandingPage` for everyone (no auth redirect). Nav shows
  "Go to Dashboard" when a session exists, otherwise "Sign in" / "Get started".
  Existing `routing.spec.ts` root-redirect test updated accordingly.
- **Hero:** Famify logo, headline + tagline, CTA buttons (Get started free → /register,
  Sign in → /login). Emerald gradient consistent with auth pages (Poppins display font).
- **Video slot (side of hero):** `<video>` element loading `/videos/famify-intro.mp4`
  (poster optional at `/videos/famify-intro-poster.jpg`). If the file is missing, an
  `onError` fallback renders a styled "video coming soon" placeholder card — so the page
  works now and lights up automatically once George's family-version video is dropped
  into `web/public/videos/famify-intro.mp4`. Video is muted, controls on, not autoplaying
  sound (kept short per Cheick's note).
- **Reviews section:** `TESTIMONIALS` array (name, role, quote, rating) in the page file,
  rendered as cards with star ratings. **These are placeholder quotes** to be replaced
  with real beta-family feedback; the array is the single place to edit.
- **Features strip:** three short cards (Planner, Child Hub, Needle) so visitors
  understand the product between hero and reviews. Copy only, no new components.
- **Favicon:** `index.html` icon switched from `/vite.svg` to `/logo.svg` (SVG favicon,
  supported by all modern browsers) + PNG `apple-touch-icon` if rasterization succeeds
  locally. Add `<meta name="description">`, Open Graph tags, and `theme-color`.

## Testing

New `tests/landing.spec.ts` (Playwright):
- `/` shows the landing page (no redirect), hero heading visible.
- Reviews section visible with ≥3 testimonial cards.
- Video section present (player or fallback placeholder).
- "Get started" navigates to /register; "Sign in" navigates to /login.
- Favicon link resolves to the Famify logo, not vite.svg.
Existing `routing.spec.ts` updated for the new root behavior; full suite of affected
specs re-run plus `npm run build`.

## Out of scope

- Real review collection/CMS — hardcoded array until beta feedback exists.
- The actual video files (email attachments, not in repo) — slot + instructions provided.
- Mobile app landing/marketing changes.
