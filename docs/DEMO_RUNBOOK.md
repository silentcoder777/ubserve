# Investor demo runbook

Use this five-minute path for the browser-local investor preview. The app is not deployed yet, so run the production build locally and use only fictional information.

## Preflight

1. Run `npm ci`, `npm run build`, then `npm run start`.
2. Open `http://localhost:3000` in the browser and confirm six provider cards appear.
3. Choose **Reset demo data**, review the record summary, and confirm the reset.
4. Keep the browser zoom at 100% and close unrelated tabs or notifications.
5. Have a second tab available if you want to demonstrate live customer/provider synchronization.

## Five-minute walkthrough

1. **Discovery:** filter by service, city, weekday, pricing model, or maximum listed price. Point out ratings, schedule summaries, hourly/fixed pricing, and saved providers.
2. **Customer onboarding:** choose **Join / sign in** and create a customer with a fictional email such as `investor.customer@example.test`.
3. **Booking:** open Maya Thompson, choose a future available time, enter a fictional service address, and request the appointment. Explain the stored hourly-rate × duration quote.
4. **Mock payment:** show the decline path first, then the success path. Reopen the test receipt and explicitly state that no Stripe connection, card collection, charge, or money movement exists.
5. **Provider handoff:** choose **Switch demo view**, select Maya Thompson, accept the request, and mark it complete. Show lifecycle progress and provider summary metrics.
6. **Customer outcome:** switch back to the customer, submit a completed-service review, reopen it, and choose **Book again** to show current availability and pricing with prior visit details prefilled.
7. **Provider onboarding, if time remains:** create a provider account, publish a profile with fixed or hourly pricing and availability, then find it through discovery.

## Talking points

- The demo proves the marketplace workflow and interaction model before backend integration.
- Browser storage keeps the preview self-contained; it is not authentication, trusted authorization, or cross-device persistence.
- Booking totals preserve a price snapshot, while rebooking and rescheduling use current provider pricing.
- The mock checkout models success, decline, receipt, duplicate-submit protection, and simulated refund states without handling real payment data.
- The production path replaces demo identity/storage with Supabase and adds server-side authorization, transactional booking holds, trusted prices, Stripe PaymentIntents, and verified webhooks.

## Recovery

- **Unexpected existing data:** use **Reset demo data** and confirm six fictional providers return.
- **Wrong role:** use **Switch demo view** or sign out and reopen the fictional account by email.
- **No appointment options:** choose another future day, shorten the duration, or select another provider.
- **Mock checkout disabled:** restart without `DISABLE_MOCK_PAYMENTS=true`.
- **Browser-local corruption:** reload; invalid snapshots fall back to the safe fictional seed. If needed, use the guarded reset.
- **Local server issue:** rerun `npm run build` and `npm run start`; use the latest successful GitHub Actions run as validation evidence.

## Do not claim

Do not describe the preview as deployed, production-ready, real authentication, multi-device persistence, real Stripe processing, a provider payout system, or a concurrency-safe booking service. Vercel, Supabase, and real Stripe integration remain deferred until they are explicitly connected and verified.
