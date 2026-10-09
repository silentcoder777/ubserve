# Investor demo delivery

Target: Friday morning, October 9, 2026, America/Chicago. Exact presentation time is not yet provided.

## Implemented in browser-local mock mode

- Customer/provider demo identity creation and reopening by email (not secure authentication).
- Provider profile publishing/editing with required experience, synchronized demo display identity, hourly/fixed pricing, and normalized, validated weekly availability.
- Search by name/service description, category, city, available weekday, pricing model and maximum listed price, with confidence-weighted rating sorting and human-readable schedule summaries.
- Customer-scoped saved-provider shortlists with a discovery filter and browser-local persistence.
- Customer booking with date/duration-aware available start times, estimates, local overlap checks, and customer/provider dashboards.
- Customer rescheduling for requested bookings with availability revalidation, refreshed price snapshots, and explicit mock-payment reset.
- Completed-service rebooking that pre-fills prior visit details while using current pricing and fresh availability.
- Provider acceptance/completion, cancellation, one review per completed booking, and role-aware saved-review detail.
- Customer/provider booking dashboards with lifecycle counts, status filters, accessible per-booking progress indicators, chronological active work and newest-first history.
- Guarded cancellation/decline actions with appointment context and visible lifecycle feedback.
- Role-scoped customer/provider summary metrics derived from current bookings and non-cancelled demo value.
- Stripe-style mock checkout API with success/decline scenarios, persistent browser-local test receipts, and a simulated refund state when a paid test booking is cancelled; no Stripe SDK or money movement.
- Domain and browser tests, GitHub Actions validation workflow.
- Native modal dialogs with keyboard focus containment, Escape/backdrop dismissal, and opener focus restoration.
- Explicit investor-preview account switching across existing browser-local customer/provider workspaces.
- Live marketplace-data synchronization with tab-specific demo identities for two-perspective walkthroughs.
- Runtime validation and safe fallback for malformed browser-local snapshots.
- Guarded full-demo reset with a browser-local record summary and explicit confirmation.

## Presentation readiness

- Production build and automated desktop/mobile Chromium journeys pass in GitHub Actions.
- The local production server and mock-checkout success, decline, malformed-request, and disabled-payment responses have been smoke-tested.
- The customer → booking → mock payment → provider completion → review journey has a timed [demo runbook](DEMO_RUNBOOK.md) with recovery steps and accurate limitation language.
- Vercel, Supabase, real authentication, shared persistence, and real Stripe remain explicitly deferred until those services are connected and verified.
- An actual-phone rehearsal remains a presenter task because no device or deployed URL is connected to this workspace.

## Production backlog

Real Stripe integration/webhook verification, refund policy, tax treatment, provider identity/license/insurance checks, moderation, recovery flows, booking holds/expiry, rate limiting, email notifications, accessibility review, and privacy/terms.

## Documentation contract

README and this roadmap must reflect actual capabilities. Keep the owner's private technical interview guide current with architecture, implementation rationale, tradeoffs and interview explanations. Do not include a commit log or commit-by-commit history in that guide. Do not commit that guide to this public repository. Do not claim deployment or real authentication before verification.
