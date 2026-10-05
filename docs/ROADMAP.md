# Investor demo delivery

Target: Friday morning, October 9, 2026, America/Chicago. Exact presentation time is not yet provided.

## Implemented in browser-local mock mode

- Customer/provider demo identity creation and reopening by email (not secure authentication).
- Provider profile publishing/editing, hourly/fixed pricing, weekly availability.
- Search by name/service, category and city filters, confidence-weighted rating sorting.
- Customer booking with date/duration-aware available start times, estimates, local overlap checks, and customer/provider dashboards.
- Provider acceptance/completion, cancellation, one review per completed booking.
- Stripe-style mock checkout API with success/decline scenarios; no Stripe SDK or real charges.
- Domain and browser tests, GitHub Actions validation workflow.
- Native modal dialogs with keyboard focus containment, Escape/backdrop dismissal, and opener focus restoration.
- Explicit investor-preview account switching across existing browser-local customer/provider workspaces.
- Live marketplace-data synchronization with tab-specific demo identities for two-perspective walkthroughs.
- Runtime validation and safe fallback for malformed browser-local snapshots.

## Before the investor presentation

1. Connect Supabase and replace browser-local identity/storage with real authentication and shared database persistence.
2. Enforce authorization, booking concurrency and price snapshots on the server; add provider timezone handling.
3. Configure Vercel, environment variables, preview deployments and production deployment after passing CI.
4. Rehearse the customer/provider journey on actual phones and desktop.

## Production backlog

Real Stripe integration/webhook verification, refund policy, tax treatment, provider identity/license/insurance checks, moderation, recovery flows, booking holds/expiry, rate limiting, email notifications, accessibility review, and privacy/terms.

## Documentation contract

README and this roadmap must reflect actual capabilities. Keep the owner's private technical interview guide current with architecture, implementation rationale, tradeoffs and interview explanations. Do not include a commit log or commit-by-commit history in that guide. Do not commit that guide to this public repository. Do not claim deployment or real authentication before verification.
