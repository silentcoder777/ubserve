# Validation — initial mock marketplace

Date: October 4, 2026, America/Chicago.

## Local checks

- ESLint: passed.
- TypeScript: passed.
- Production Next.js build: passed.
- Vitest: 23 tests passed across pricing, availability, ranking and mock checkout.
- Playwright: 6 scenarios passed across desktop and mobile Chromium emulation.

Browser coverage includes provider profile publication and persistence, customer bookings, declined/successful mock payment, provider acceptance/completion, completed-service review, search empty state and document-width checks.

The environment's normal Playwright browser download failed. Local verification used a separately installed packaged Chromium executable selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; this package is not an application dependency. GitHub Actions uses the normal Playwright browser installation.

GitHub Actions run 37248247193 completed successfully for commit 730af68. Subsequent runs must be checked separately. Desktop and mobile discovery screenshots were visually inspected. Vercel deployment and real Supabase integration are still deferred.

## Boundaries

These checks validate the current mock behavior. They do not establish production authentication, multi-device shared data, secure role enforcement, database booking concurrency, payment processing, actual iPhone Safari support or load capacity.

## Dialog usability and production browser checks — October 5, 2026

- Lint, TypeScript, and production build passed.
- 23 domain/API tests passed.
- 10 browser checks passed across desktop and mobile Chromium emulation.
- Added checks for blocked background focus, keyboard movement inside forms, Escape dismissal, backdrop clicks, scroll locking, and opener focus restoration.
- Browser checks now start the compiled production app on dedicated port 3001. They require a successful build and do not reuse a development server.

The native dialog implementation applies to signup, booking, checkout and review forms. Native modal focus can move to browser controls at a Tab boundary; background page controls remain inert. This is not a full accessibility audit or actual-device Safari testing.

## Guided appointment selection — October 5, 2026

- Start-time choices are derived in 30-minute increments from the provider's working hours.
- Choices that extend past closing, fall on an unavailable day, are in the past, or overlap a non-cancelled booking are omitted.
- Changing the date or duration recalculates the choices and disables booking when none remain.
- Domain tests cover duration boundaries, overlaps, adjacent appointments, unavailable days, and malformed dates; browser tests cover date/duration-driven option updates.

## Cross-role investor walkthrough — October 5, 2026

- The preview bar opens an explicitly labeled account switcher containing only existing browser-local demo accounts.
- Selecting a role opens its booking workspace so one request can be presented from customer and provider perspectives.
- Browser coverage follows a newly requested appointment into Maya Thompson’s provider workspace, accepts it, and returns to the customer workspace.
- This shortcut is not an authentication or authorization design. Production accounts must use Supabase Auth and server-enforced role checks.

## Same-browser tab synchronization — October 5, 2026

- Marketplace data uses localStorage and listens for valid Ubserve updates from other tabs in the same browser profile; active demo identity uses tab-specific sessionStorage.
- Browser coverage opens Maya Thompson’s provider workspace in a second tab, creates a customer booking in the first tab, verifies that the provider sees and accepts it without reloading, then verifies that the customer receives the accepted state.
- Switching identity in one tab does not switch the other tab, so customer and provider workspaces can remain open together.
- Invalid storage payloads are ignored so stale or malformed browser data does not replace a working in-memory snapshot.
- This does not synchronize separate browser profiles, browsers, devices, or users; shared production state still requires Supabase.

## Browser-state recovery — October 5, 2026

- A Zod schema validates every persisted account, provider, booking and review before hydration or cross-tab adoption.
- Relationship checks reject providers without provider owners, bookings without valid customer/provider records, and reviews whose parties do not match their booking.
- Unit coverage checks current-state acceptance, invalid JSON, incomplete snapshots, invalid nested values and broken references.
- Browser coverage injects a malformed provider snapshot, reloads, and verifies recovery to all six fictional providers instead of a render crash.
- Validation is a demo reliability boundary, not an authorization or secure-storage boundary.

## Booking dashboard status filters — October 5, 2026

- Customer and provider dashboards derive live counts for all, requested, accepted, completed and cancelled bookings.
- Selecting a status filters the existing role-scoped booking collection without changing persisted data.
- An empty filtered result offers a direct return to all bookings instead of resembling an account with no history.
- Browser coverage creates appointments with two providers, cancels one, verifies counts, and checks requested/cancelled filtering on desktop and mobile.

## Requested-booking rescheduling — October 5, 2026

- A customer can reschedule only their own booking while its status is `requested`; accepted, completed and cancelled bookings remain immutable through this path.
- Candidate times exclude the booking being edited but reuse the same working-hours, future-date and overlap checks used for initial booking.
- Saving recalculates the price snapshot from the provider's current rate. Any previous simulated payment reference is cleared and the booking returns to unpaid so the demo never presents an old amount as paid.
- Browser coverage pays in mock mode, changes the duration and time, verifies the refreshed total and unpaid state, and switches to the provider workspace to verify the updated request on desktop and mobile.

## Pricing-aware provider discovery — October 6, 2026

- Discovery composes service text, category, city, hourly/fixed pricing model and maximum listed-price constraints through one pure domain function.
- Text matching includes provider service descriptions, so customers can discover relevant offerings without knowing a provider's name or exact category label.
- Unit coverage verifies combined constraints and description matching. Browser coverage narrows fixed-price providers by a $75 maximum, resets every discovery constraint together, and checks horizontal document fit on desktop and mobile.
- Listed-price filtering compares the provider's advertised amount; it does not estimate parts, ingredients, taxes, platform fees or total hourly job duration.

## Role-scoped booking summaries — October 6, 2026

- Customer summaries show active bookings, completed services, non-cancelled mock-paid count and non-cancelled booked value. Provider summaries show new requests, accepted visits, completed jobs and pipeline value.
- Every metric is derived from the booking collection already scoped to the active account; no duplicate counters or totals are persisted.
- Cancelled bookings remain visible in lifecycle filters but do not contribute to mock-paid or value totals.
- Unit coverage verifies lifecycle/value aggregation. Browser coverage creates bookings with two providers, verifies the customer's combined summary, then switches to Maya and verifies that her provider summary contains only her request on desktop and mobile.
- Values are fictional booking totals for the investor demo, not revenue, settled payments, taxes, fees or provider payouts.

## Guarded booking actions — October 6, 2026

- Customer cancellation and provider decline actions now open a native confirmation dialog before changing the browser-local booking state.
- The dialog identifies the service, other participant, appointment time and demo total, and states that no real payment or refund occurs.
- Accept, complete, cancel and decline transitions now announce a visible outcome so the presenter does not have to infer success from a badge change.
- Browser coverage verifies that keeping a booking leaves it requested, confirms a customer cancellation, and confirms a provider decline on desktop and mobile.
- The confirmation is a user-experience guard, not a server authorization or refund workflow; production transitions still require authenticated, transactional backend commands.

## Persistent mock payment receipts — October 6, 2026

- A successful test checkout stores the mock payment identifier already returned by the local API and exposes a customer-only receipt from the booking card.
- The receipt shows the linked service, provider, simulated amount, simulated status and full mock identifier while repeatedly stating that no real charge occurred.
- Browser coverage completes checkout, validates the receipt, reloads the production build, and reopens the same browser-local receipt on desktop and mobile.
- The receipt is presentation evidence for the simulation only. It is not a Stripe receipt, settlement record or proof of payment, and no card data is collected.

## Simulated cancellation refunds — October 7, 2026

- Cancelling or declining a booking with a successful test payment changes its payment state from `mock-paid` to `mock-refunded` while retaining the mock identifier for demo traceability.
- Booking cards and saved test receipts label the simulated refund explicitly and state that no real charge, refund, Stripe settlement, or money movement occurred.
- Cancelled bookings remain excluded from paid-count and booked-value summary metrics. Browser coverage pays for a request, confirms its cancellation, and verifies the refund label and receipt on desktop and mobile.
- This is a UI/state simulation, not a refund API. Production requires trusted server-side amounts, an authenticated Stripe refund call, idempotency, webhook reconciliation, audit records, and policy handling.

## Role-aware saved reviews — October 6, 2026

- After a customer submits the single allowed review for a completed booking, the dashboard replaces the submission action with a persistent review-detail action.
- Customers see **View your review** while the related provider sees **View customer review** for the same browser-local record.
- The detail dialog exposes an accessible star label, review text and reviewer name, while distinguishing newly submitted feedback from fictional seed ratings.
- Browser coverage publishes feedback, reloads the production build, reopens it as the customer, then switches to the provider workspace and verifies the same review on desktop and mobile.
- Production still requires server-authorized completed-booking checks, a database uniqueness constraint, moderation and an edit/removal policy.

## Customer saved providers — October 6, 2026

- Customer accounts can add or remove provider profiles from a customer-scoped shortlist on discovery cards and provider details.
- The **Saved** discovery control shows the current customer's count and combines with service, city and price constraints.
- Saved relationships persist across reloads and synchronize with the existing same-profile marketplace state; switching identities resets the presentation-only saved filter.
- Runtime validation migrates older snapshots to an empty shortlist and rejects missing, provider-owned or duplicate saved relationships.
- Browser coverage saves Maya, reloads, filters to the one saved provider, removes her, clears the resulting empty filter and checks mobile/desktop width.
- Production requires authenticated customer ownership, a unique `(customer_id, provider_id)` constraint and server-side paginated discovery queries.

## Completed-service rebooking — October 7, 2026

- A customer can choose **Book again** on a completed appointment while the provider profile still exists.
- Rebooking opens the normal provider request dialog with the previous duration, service address and notes prefilled.
- The date starts at tomorrow, availability is recalculated against current bookings, and the estimate uses the provider's current listed price; payment and lifecycle state are never copied.
- Browser coverage completes and reviews a service, opens the repeat flow, and verifies the prefilled details and fresh quote on desktop and mobile.
- Production should offer an explicit saved-address policy and immutable historical price display while always creating a separate authorized booking record.
