# Ubserve

A responsive US local-services marketplace where customers choose providers by service, location, price, availability, and reputation. Providers control their profiles and hourly or fixed prices.

**Status:** working browser-local investor demo. Not yet deployed. Supabase and Vercel integration are deferred. Target presentation: October 9, 2026.

## What works

- Create or reopen customer/provider demo accounts with a name and fictional email.
- Publish/edit a provider profile, category, price, and weekly availability.
- Discover providers through search, category/city filters, and recommended or price ordering.
- Request an appointment with a duration, service address, and cost estimate.
- Check availability and reject overlapping reservations in the current browser.
- Accept, decline, cancel, and complete bookings through role-specific dashboards.
- Submit one review after a completed service; update provider ratings.
- Run simulated Stripe-style checkout success/decline scenarios without card entry or real charges.

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

Browser tests cover desktop and mobile Chromium. GitHub Actions runs validation on pushes to `main` and pull requests. Vercel deployment is not configured yet.

## Demo walkthrough

1. Choose **Join / sign in**, enter a fictional customer name/email, and continue.
2. Open Maya Thompson's profile and request a future appointment during 08:00–18:00 local time.
3. Try a declined test payment, then a successful test payment.
4. Sign out and reopen the provider account using name `Maya Thompson`, email `p1@example.test`, provider role.
5. Open **My bookings**, accept the request, and mark it complete.
6. Reopen the customer account, view bookings, and leave a review.
7. To show onboarding, create another provider account and publish a new profile.

**Reset demo data** clears all locally saved accounts, profiles, bookings, and reviews. Each browser has its own data; use the same browser for the current end-to-end demo.

## Structure

```text
src/app/                     App Router layout, page, and styles
src/app/api/mock-checkout/    Mock payment HTTP endpoint
src/components/              Marketplace screens and forms
src/lib/model.ts             Types, pricing, availability, ranking
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

Demo identities have no passwords or email verification and are **not authentication**. Data lives in localStorage and is neither shared between devices nor secure. Role checks and booking overlap checks are local demonstrations, not production security or concurrency guarantees. Appointments use the browser's local timezone. Initial provider ratings/counts are sample data. No payment is charged, and there is no provider payout.

Do not use real personal information in the mock demo. Production readiness requires the backend work listed in [the roadmap](docs/ROADMAP.md).

See [validation evidence](docs/VALIDATION.md) for the initial checks and their limits.

The owner's private technical interview guide is maintained separately because this repository is public.
