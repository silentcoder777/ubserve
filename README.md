# Ubserve

A responsive local-services marketplace for the US.

## Investor demo — October 9, 2026

Core journey: create a customer or provider account, publish services and hourly/fixed pricing, discover providers, request a booking, manage its status, and review completed work.

Development begins with clearly marked browser-local demo data. Production authentication, shared persistence, and server-side booking enforcement will be connected through Supabase. Vercel deployment is deferred until requested.

## Delivery plan

- Foundation: Next.js App Router, React, TypeScript, Tailwind CSS.
- Provider profiles, service pricing, availability, customer discovery.
- Booking estimates, conflict checks, customer/provider dashboards, reviews.
- Vitest domain checks and Playwright browser tests in GitHub Actions.
- Supabase integration, Vercel preview/production deployment, mobile rehearsal.

Commits represent completed changes and use actual timestamps. No live payments in the initial demo.
