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
