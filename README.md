# POCHI MA BUONI

*Few but good.* A private, application-only sports social network for New York City. Approved members pay $60/month, build a sports profile, and are introduced to compatible members through a deterministic, explainable matching engine. Members then connect, message, and invite each other to play at independent venues. The platform never books or controls facilities.

This repository is a production-oriented MVP: real authentication, a normalized Postgres schema with Row Level Security, Stripe Billing driven by verified webhooks, transactional email, and an admin console.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui conventions (Radix primitives, `components.json`), lucide icons, sonner toasts |
| Forms & validation | React Hook Form + Zod 4 (the same schemas run on client and server) |
| Data | Supabase Postgres, Auth (passwordless email), Storage (private buckets), Realtime (messages) |
| Billing | Stripe Checkout, Customer Portal, signed and idempotent webhooks |
| Email | Resend (HTML and plain-text templates) |
| Tests | Vitest (unit and integration) and SQL security tests against real PostgreSQL |
| Hosting | Vercel-compatible (Node runtime), GitHub Actions CI |

> **shadcn/ui note:** the shadcn registry was unreachable from the build environment, so the components in `src/components/ui` were written by hand following shadcn's structure (Radix + CVA + `cn`). `components.json` is configured, so `npx shadcn add <component>` works normally from a networked machine.

---

## Quick start (local)

Prerequisites: Node 22+, Docker (for the local Supabase stack), and optionally the Stripe CLI.

```bash
npm install
cp .env.example .env.local

# 1. Start Supabase locally. This applies supabase/migrations and supabase/seed.sql.
npx supabase start
npx supabase status            # copy API URL, anon key and service_role key into .env.local

# 2. Stripe (test mode). Create a recurring $60/month price, then:
stripe listen --forward-to localhost:3000/api/stripe/webhook   # prints STRIPE_WEBHOOK_SECRET

# 3. Run the app
npm run dev
```

Local email (magic links, plus any app email when `RESEND_API_KEY` is unset) can be viewed in the Supabase mail viewer at http://127.0.0.1:54324. Without `RESEND_API_KEY`, app emails are logged to the server console rather than sent. Nothing is reported as sent when it wasn't.

### Seeded demo data (local only)

`supabase/seed.sql` creates 11 sports, default matching weights, two referral codes (`FOUNDING-CIRCLE`, `FRIENDS-OF-PMB`) and fictional accounts. All of them sign in by magic link through the local mail viewer:

| Email | Role |
| --- | --- |
| `admin@example.com` | ADMIN |
| `giulia@example.com`, `marcus@example.com`, `amara@example.com`, `theo@example.com` | Active MEMBERs with placeholder `sub_seed_*` subscriptions |
| `sofia@example.com` | APPLICANT with a pending application |

The seed subscriptions are local placeholders that do not exist in Stripe. In every other environment, subscriptions are only ever written by the verified webhook.

### First administrator in a real project

Roles can't be changed from the client. After the first admin signs in once, promote them in the Supabase SQL editor:

```sql
update public.users set role = 'ADMIN' where email = 'you@yourdomain.com';
```

---

## Environment variables

See `.env.example`. Summary:

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for emails, auth redirects, Stripe return URLs, sitemap |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase client (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Webhooks, application intake, audited admin actions |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | **server only** | Billing |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | **server only** | Transactional email |

No secrets are hardcoded. Server-only values are read through `src/lib/env.server.ts`, which imports `server-only`, so it can't be bundled for the browser.

---

## External service configuration

### Supabase (production)
1. Create a project and run the migrations: `npx supabase link --project-ref <ref> && npx supabase db push`.
2. **Auth → URL configuration:** set Site URL to your domain and add `https://<domain>/auth/callback` and `https://<domain>/auth/confirm` to the redirect allow-list.
3. **Auth → Email templates → Magic Link:** the default works with `/auth/callback` when the link is opened in the same browser. For links that also work across devices, use
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
4. **Auth → SMTP:** configure a custom SMTP sender (for example, Resend SMTP). Supabase's built-in sender is rate-limited and not meant for production.
5. Realtime is enabled for `public.messages` by the migration.

### Stripe
1. Create a product "Pochi Ma Buoni Membership" with a **recurring $60.00 USD monthly** price, and copy its `price_…` id into `STRIPE_PRICE_ID`.
2. Add a webhook endpoint at `https://<domain>/api/stripe/webhook` with these events:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`.
3. **Customer portal:** enable it, and allow payment method updates, invoice history and cancellation (at period end recommended).
4. **Smart Retries / dunning:** enable, so `past_due` subscriptions are retried automatically.

### Resend
Verify your sending domain and set `EMAIL_FROM` to an address on it.

---

## Architecture

```
src/
  app/
    (public)/        Marketing site, apply, application status, sign-in, legal drafts
    (member)/        Private community: home, discover, members/[id], connections,
                     invitations, messages, profile, settings
    onboarding/      Approved → pay → complete profile
    admin/           Admin console (server-side role check on layout AND every page)
    api/stripe/webhook  Verified, idempotent Stripe webhook (the only entitlement writer)
    api/account/export  Personal data export (JSON)
    auth/            Magic-link callback / confirm / post-login routing
  actions/           Server Actions (each one re-authorizes and validates)
  components/        ui/ (shadcn-style primitives), brand/, site/, app/, members/, admin/ …
  lib/
    auth/            Data access layer: getViewer(), stage resolution, guards
    matching/        Deterministic compatibility engine (pure, unit-tested)
    billing/         Stripe client, subscription mapping, sync, webhook processor
    email/           Templates and Resend sender
    validation/      Zod schemas shared by client and server
    domain/          Neighbourhoods, availability grid, constants, formatting
  proxy.ts           Session refresh and early redirect (convenience only)
supabase/
  migrations/        Schema, functions, triggers, RLS, storage and realtime
  seed.sql           Local demo data
  tests/             SQL security tests and a small Supabase shim for plain Postgres
```

### Membership lifecycle

```
APPLICANT ──apply──▶ PENDING ──admin──▶ APPROVED / WAITLISTED / REJECTED
                                   │
                    role → MEMBER  ▼
        sign in ─▶ Stripe Checkout ─▶ webhook: subscription active ─▶ complete profile ─▶ ACTIVE
```

`resolveMemberStage()` (`src/lib/auth/stage.ts`) turns database state into a stage, and the member layout admits only `ACTIVE` (or `ADMIN`). The same rule exists in SQL as `is_active_member()`, which every RLS policy uses, so the database enforces access even if application code were bypassed. A `past_due` subscription keeps access for a 3-day grace window after the period end. Any other non-active status revokes access.

**Payment confirmation is never trusted from the client.** Returning from Checkout shows a "confirming" state that polls the server. Access appears only once the webhook has written the subscription row, after re-fetching it from Stripe so that out-of-order deliveries can't regress state.

### Matching engine

`src/lib/matching/score.ts` is pure TypeScript:

* A shared sport is **required**.
* Weighted components: availability overlap (35%), skill compatibility (30%), neighbourhood proximity (20%), format compatibility (15%). Admins can change the weights in **Admin → Matching**, and they're normalized to 100%.
* **Missing data** is excluded and the remaining weights are renormalized. `coverage` reports the share of total weight that was actually known, and the UI shows which signals were missing.
* Every match carries plain-language reasons ("Both play intermediate tennis", "Available on weekend mornings", "Both prefer Manhattan").
* Location is matched at **neighbourhood → area → borough** granularity. Addresses are never collected.

### Ways to match

* **Find a partner (one-on-one):** the ranked list above. Members only appear if they have opted into one-on-one play.
* **Build a group (3–10 players):** `src/lib/matching/group.ts`. For one sport and a group size, it adds members greedily by their *average* pairwise score with everyone already in the group, and requires a time slot that every member is free. Members only appear for group sizes they've opted into (small group 3–6, larger group 7+). "Invite this group" sends one invitation per member, linked by `invitations.group_id`. RLS checks every recipient, and if any one isn't available nothing is sent.
* **Play styles:** `member_profiles.play_styles` holds `one_on_one`, `small_group` and `large_group`, chosen by the member.
* **Age range (optional):** `partner_age_min` and `partner_age_max` on the profile. Matching is **two-way**: you only see members inside your range whose own range includes you. Dates of birth come from the approved application and live in `member_private`, which no member session can read. `member_age_info()` (SECURITY DEFINER) returns ages only for members who show them, plus the two compatibility booleans computed from real ages. Hiding your age doesn't get around anyone's preference. Age is the only demographic preference. Other protected characteristics are deliberately not collected or filterable. Have counsel confirm the approach before launch.

### Venues

A public, informational guide at `/venues` and `/venues/[sport]`, with an admin editor at **Admin → Venues**. It uses the `venues` and `venue_sports` tables (public read for active rows, admin-only writes), and invitation forms suggest venue names for the chosen sport. The seed lists 23 real, publicly known NYC places. **Verify each one before launch** (access, seasons, operators and websites change). Every venue page states that Pochi Ma Buoni does not own, operate, manage or book them.

---

## Security model

| Concern | Implementation |
| --- | --- |
| Authentication | Supabase Auth, passwordless magic links (PKCE). Sessions are verified server-side with `auth.getUser()` |
| Authorization | `requireCommunityAccess()` / `requireAdmin()` in layouts **and** pages; `assertCommunityAccess()` / `assertAdmin()` in every Server Action |
| Database | RLS on every table; privileges revoked by default and granted per table and column; SECURITY DEFINER helpers with a fixed `search_path` |
| Integrity | DB triggers enforce state transitions (only the addressee accepts a connection, only participants complete a past invitation, invitation details are immutable), applicant age ≥ 18, and skill and format vocabulary per sport |
| Entitlements | Clients have **no write access** to `subscriptions`, `users.role` or `membership_applications.status` |
| Messaging | Participants only; posting requires both sides active, connected and not blocked (RLS `can_message`); realtime respects RLS |
| Uploads | Private buckets with signed URLs; type, size **and magic-byte** validation; per-user folders enforced by storage policies |
| Rate limiting | Postgres-backed fixed-window limiter (works across serverless instances) on sign-in, applications, connection requests, invitations, messages, reports, checkout, uploads and exports. It fails closed |
| Admin audit | Every admin mutation writes `audit_logs` (who, what, target, metadata) |
| Errors | Generic user-facing messages; details only in server logs; safe error boundaries |
| Headers | CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy |
| Privacy | Neighbourhood-level location only; email and date of birth never shown to members; visibility settings; block and report; JSON data export; self-service account deletion (cancels Stripe and removes files) |
| Redirects | `safeNextPath()` prevents open redirects |

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run typecheck` | Route type generation + `tsc --noEmit` |
| `npm test` | Vitest unit and integration tests |
| `npm run test:db` | Applies all migrations and seed to a scratch PostgreSQL database and runs the RLS and business-rule tests (`DATABASE_URL=postgres://… npm run test:db`) |
| `npm run db:types` | Regenerate `src/types/database.ts` from the local Supabase stack |

### What the tests cover
* **Matching:** each component scorer, default weighting arithmetic, the shared-sport requirement, missing-data renormalization, configurable weights, ranking.
* **Membership stages:** entitlement rules including the past-due grace window, suspension, applicants never reaching the community, open-redirect protection.
* **Validation:** application and profile schemas (including age-range and play-style preferences), group invitations, the age ≥ 18 rule, image signature checks.
* **Group matchmaking:** shared-slot requirement, whole-group fit, determinism and de-duplication.
* **Stripe webhook (integration):** real signature verification with the Stripe SDK, forged and tampered payloads rejected, idempotent replay handling, ledger release on failure so Stripe retries, checkout and failed-payment flows.
* **Emails:** all templates render and escape user content.
* **Database (72 checks):** venue directory visibility and admin-only writes; dates of birth unreadable and unwritable by members; hidden ages; two-way age compatibility; birth date copied from the approved application; anonymous, applicant, member and admin access; privilege escalation attempts; subscription self-grant attempts; visibility rules; blocking; messaging without a connection; forged senders; invitation transitions; age and skill constraints; referral codes; rate limiter; sign-up linking.

---

## Deployment (Vercel)

1. Import the repository in Vercel (framework preset: Next.js).
2. Add all environment variables from `.env.example` (production values; **Stripe live keys only when you are ready to launch**).
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain, and update the Supabase redirect URLs and the Stripe webhook endpoint to match.
4. Run the Supabase migrations against the production project (`supabase db push`). **Don't** run `seed.sql` in production. If you want the sports catalogue and default weights, run just those sections.

Uploads are capped at 4 MB to stay within Vercel's 4.5 MB request limit for serverless functions.

---

## Brand assets

The design calls for editorial photography. No photographs are bundled, because they must be licensed or commissioned. Until then, `EditorialArt` renders restrained line studies of courts, pitches, tracks, pools and greens. To use real photography, add files under `public/editorial/` and pass `photo="/editorial/<file>.jpg"` to `EditorialArt`.

---

## Open decisions and remaining configuration

* **Legal:** `/terms` and `/privacy` are **drafts clearly marked for attorney review**, with bracketed placeholders (entity name, governing law, refund policy, retention periods, liability language).
* **Business:** refund policy and whether to run background or identity checks. Legal should confirm the age-range preference (see "Ways to match").
* **Venues:** verify the seeded venue details before launch.
* **Credentials:** Supabase project, Stripe account and price, Resend domain, production domain.
* **Photography:** licensed editorial images.
* **Contact address:** set `NEXT_PUBLIC_CONTACT_EMAIL` (defaults to a placeholder).
