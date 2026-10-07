# Ubserve

A responsive US local-services marketplace where customers choose providers by service, location, price, availability, and reputation. Providers control their profiles and hourly or fixed prices.

**Status:** working browser-local investor demo. Not yet deployed. Supabase and Vercel integration are deferred. Target presentation: October 9, 2026.

## What works

- Create or reopen customer/provider demo accounts with a name and fictional email.
- Publish/edit a provider profile, category, price, and weekly availability.
- Discover providers through service search, category/city filters, hourly/fixed pricing, maximum listed price, and recommended or price ordering.
- Save providers to a customer-specific shortlist and filter discovery to saved profiles.
- Request or reschedule an appointment with a duration, service address, current cost estimate, and only currently available start times.
- Rebook a completed service with the previous visit details prefilled and a fresh availability/price check.
- Check availability and reject overlapping reservations in the current browser.
- Accept, decline, cancel, and complete bookings through role-specific dashboards.
- Confirm customer cancellations and provider declines before changing booking state; show clear lifecycle outcome messages.
- Recalculate the booking price and reset simulated payment state when a customer reschedules a pending request.
- Filter customer and provider dashboards by booking lifecycle status with live counts.
- Review role-scoped booking summaries for active work, completion, simulated payments, and non-cancelled demo value.
- Submit one review after a completed service, update provider ratings, and reopen saved feedback from customer or provider dashboards.
- Run simulated Stripe-style checkout success/decline scenarios without card entry or real charges; reopen a persisted test receipt for successful simulations.
- Use keyboard-accessible dialogs: contained focus, Escape dismissal, and focus restoration.
- Switch between existing customer and provider workspaces with an explicitly labeled browser-only investor preview control.
- Keep marketplace data synchronized across same-profile browser tabs while each tab retains its own customer or provider workspace.
- Validate saved browser data at runtime and recover to the fictional seed when a snapshot is malformed.

## Technology

Next.js 16.3.8 App Router, React 19.3.0, TypeScript, Tailwind CSS 4.3.3, Lucide icons, Zod, Vitest, and Playwright. Exact resolved dependencies are recorded in `package-lock.json`.

Next.js serves the interface and the mock checkout API in a single Vercel-compatible project. Supabase PostgreSQL/Auth/Storage is the planned production backend; it is not connected yet.

## Run locally

Requires Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No credentials or environment variables are required in mock mode.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests cover desktop and mobile Chromium using the production build on port 3001. Run `npm run build` before `npm run test:e2e`; tests start their own server rather than reusing a development server. GitHub Actions runs validation on pushes to `main` and pull requests. Vercel deployment is not configured yet.

## Demo walkthrough

1. Choose **Join / sign in**, enter a fictional customer name/email, and continue.
2. Open Maya Thompson's profile and request a future appointment during 08:00–18:00 local time.
3. Try a declined test payment, then a successful test payment.
4. Choose **Switch demo view** in the preview bar and select Maya Thompson. This is a presentation shortcut; the normal sign-out/reopen flow remains available.
5. Open **My bookings**, accept the request, and mark it complete.
6. Switch back to the customer workspace, view bookings, and leave a review.
7. Choose **Book again** to show the repeat-service flow with fresh availability and the prior visit details.
8. To show onboarding, create another provider account and publish a new profile.

**Reset demo data** clears all locally saved accounts, profiles, bookings, reviews, and provider shortlists. Tabs in the same browser profile receive live marketplace updates, while the active demo account is tab-specific. Different browsers, profiles, and devices do not share data.

## Structure

```text
src/app/                     App Router layout, page, and styles
src/app/api/mock-checkout/    Mock payment HTTP endpoint
src/components/              Marketplace screens and forms
src/lib/model.ts             Types, pricing, availability, ranking
src/lib/persistence.ts       Runtime schema and relationship validation
src/lib/seed.ts               Clearly labeled fictional providers
src/lib/store.ts              Browser-local state and demo commands
 tests/                      Domain and browser tests
.github/workflows/ci.yml      Automated checks
 docs/ROADMAP.md              Delivery status and production backlog
```

## API

`POST /api/mock-checkout`

```json
{ "bookingId": "valid-uuid", "amountCents": 7000, "scenario": "success" }
```

Returns a mock payment identifier, amount in USD cents, and `mock: true`. `scenario: "decline"` returns HTTP 402; malformed input returns HTTP 400. Set `DISABLE_MOCK_PAYMENTS=true` to disable the endpoint.

This endpoint accepts client-provided amounts because it is a simulation. Production checkout must load an authorized booking and trusted price from the database, use idempotency, and confirm payments through verified Stripe webhooks.

## Important demo boundaries

Demo identities have no passwords or email verification and are **not authentication**. The investor role switcher is intentionally presentation-only and must not exist as an authorization path in production. Data lives in localStorage; same-browser tab synchronization is neither cross-device sharing nor secure persistence. Runtime validation prevents malformed saved data from crashing the demo, but it does not make browser storage trusted. Role checks and booking overlap checks are local demonstrations, not production security or concurrency guarantees. Appointments use the browser's local timezone. Initial provider ratings/counts are sample data. No payment is charged, and there is no provider payout.

Do not use real personal information in the mock demo. Production readiness requires the backend work listed in [the roadmap](docs/ROADMAP.md).

See [validation evidence](docs/VALIDATION.md) for the initial checks and their limits.

The owner's private technical interview guide is maintained separately because this repository is public.
