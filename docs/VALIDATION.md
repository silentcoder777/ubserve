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

## Availability-aware provider discovery — October 7, 2026

- Customers can select a weekday and keep only providers whose published weekly schedule includes that day. The constraint composes with service, city, saved-provider and pricing filters through the same pure discovery function.
- Reset filters returns the weekday selector to **Any day** along with every other discovery constraint.
- Unit coverage verifies weekday matching. Browser coverage publishes a Monday–Friday provider, confirms Sunday produces an empty result, confirms Monday restores the profile, and runs the same flow at desktop and mobile viewport sizes.
- The filter represents a provider's recurring working day, not a guaranteed appointment. The booking form still checks duration, working hours, existing reservations and whether the selected time is in the future before submission.

## Provider schedule summaries — October 8, 2026

- Discovery cards and booking details use one pure formatter to present weekly availability as **Every day**, **Weekdays**, **Weekends**, or an ordered abbreviated day list with a 12-hour local-time range.
- Duplicate or unsorted weekday values are normalized for display without changing the provider record. Booking validation continues to use the underlying numeric schedule rather than parsing presentation text.
- Unit coverage verifies daily, weekday and custom schedule labels, including noon and midnight boundaries. Browser coverage verifies that a newly published Monday–Friday provider exposes the same schedule on desktop and mobile discovery cards.
- These labels summarize recurring provider hours only; they do not promise that every displayed day or hour remains unreserved.

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

## Explainable booking quote snapshots — October 7, 2026

- New bookings store the provider's pricing model and unit price alongside the agreed total, so later profile edits cannot change the saved quote calculation.
- Booking cards and test receipts show hourly rate × duration or the saved fixed price. Older browser snapshots without these optional fields remain usable and display `Saved booking total` instead of inventing historical data.
- Runtime validation rejects partial snapshots and totals that do not match the saved unit price, pricing model and duration.
- Domain and persistence coverage verifies hourly, fixed and legacy labels plus incomplete/inconsistent snapshot rejection. Browser coverage checks the breakdown on a booking card and receipt at desktop and mobile sizes.
- Production should persist currency and quote/version identifiers and calculate trusted totals transactionally on the server; browser validation is not an authorization or accounting boundary.

## Booking progress indicators — October 7, 2026

- Every active booking card renders the same Requested → Accepted → Completed sequence for customer and provider workspaces; the current step uses `aria-current="step"` instead of relying on color alone.
- Completed steps receive a visual check mark. Cancelled bookings use a separate `Cancelled · time released` state so the interface does not imply whether cancellation occurred before or after acceptance.
- Browser coverage verifies requested, accepted, completed and cancelled progress states across the existing desktop and mobile lifecycle journeys.
- This is a presentation of current state, not an audit history. Production should persist immutable transition events with actor, timestamp and reason when a full timeline is required.

## Booking dashboard ordering — October 7, 2026

- Requested and accepted bookings appear before completed and cancelled history. Active work is ordered by the nearest appointment, while terminal history is ordered newest first.
- The first role-scoped active booking receives one **Next up** marker. Completing or cancelling it removes the marker and promotes the next active appointment without changing persisted data.
- A pure domain function returns a sorted copy, so status filters and summaries continue to derive from the original authoritative booking records. Unit coverage verifies ordering and confirms the input array is not mutated.
- Browser coverage verifies the marker in customer and provider dashboards and confirms it disappears when the only active booking is completed at desktop and mobile viewport sizes.
- Production should apply equivalent ordering in a paginated database query and define behavior for overdue work; this browser-local demo does not implement reminders or automatic no-show transitions.

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

## Provider display-identity consistency — October 8, 2026

- Publishing a provider profile now saves the trimmed public display name to both the provider listing and its owning browser-local demo account in one marketplace snapshot.
- The navigation and investor-preview account switcher therefore use the same current identity as discovery after a provider renames the profile.
- Existing bookings deliberately retain their saved `providerName`; it is a historical booking snapshot and is not rewritten by a later profile edit.
- Browser coverage creates a provider under one account name, publishes a different public name, verifies the account switcher and discovery agree, then reloads the production build to confirm persistence on desktop and mobile.
- Production should avoid client-side denormalized identity updates: use a normalized user/profile relationship or a server-side transaction, while preserving explicit booking snapshots for history.

## Provider publication integrity — October 8, 2026

- Provider publication now passes through one pure normalization and validation boundary before browser-local persistence.
- Public text is trimmed, duplicate weekdays are removed and weekday values are sorted. Experience is required alongside name, headline, description and city.
- The boundary rejects out-of-range weekdays, non-integer or out-of-range working hours, empty schedules, invalid pricing/category values and schedules that do not end after they start.
- Unit coverage verifies canonical output and each invalid schedule/profile class. The provider publication browser journey continues to verify exact normalized persistence, fixed pricing, discovery and reload behavior at desktop and mobile viewport sizes.
- This protects mock-state quality, not production security. A real API must repeat validation on trusted server input and enforce database constraints.

## Final production smoke rehearsal — October 9, 2026

- ESLint, TypeScript, 53 Vitest checks and a fresh production build passed from the final source state; Playwright still enumerates 32 desktop/mobile checks.
- The production server returned HTTP 200 for the marketplace and rendered the Ubserve application shell.
- Direct mock-checkout smoke calls returned HTTP 200 with `mock: true` for success, HTTP 402 for the intentional decline, HTTP 400 for invalid input and HTTP 403 when `DISABLE_MOCK_PAYMENTS=true`.
- The latest hosted GitHub Actions run independently passed dependency installation, lint, typecheck, all 53 Vitest checks, the production build, browser installation and all 32 Playwright checks.
- The [demo runbook](DEMO_RUNBOOK.md) records the timed customer/provider story, preflight, recovery options and claims that must remain out of scope. Actual-phone testing and deployment remain unverified because no device, Vercel project or public URL is connected.

## Guarded demo reset — October 8, 2026

- **Reset demo data** now opens the same keyboard-accessible modal system used by the other consequential actions instead of relying on a browser confirmation prompt.
- The dialog lists the current counts of demo accounts, provider profiles, bookings, reviews and saved providers before explaining that the original six fictional providers will be restored.
- Cancelling preserves the current account and marketplace records. Confirming resets the marketplace, active identity, discovery filters and booking filter, then displays a visible success status.
- Browser coverage verifies cancellation and confirmation at desktop and mobile viewport sizes, including the restored six-card discovery state.
- This reset affects only browser-local mock state; it is not a production deletion or recovery workflow. A real system requires authenticated, scoped deletion, audit records and an appropriate retention policy.
