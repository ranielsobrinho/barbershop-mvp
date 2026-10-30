# Seu Carlos Barbearia — Product and Demo Roadmap

This is the working plan for turning the current MVP into a credible barbershop product and a strong engineering portfolio project. Work through the phases in order. Each phase is scoped so it can be started independently without replanning.

## Product direction

**Pitch:** A simple booking and client-retention tool for independent barbers and small shops: clients book online, the shop confirms appointments, reminders reduce missed visits, and the barber can bring clients back.

The repository already includes public booking, an admin panel, service and schedule management, appointment status changes, PostgreSQL persistence, separate Fastify services, gRPC contracts, WhatsApp provider configuration/status messages, and unit tests. The roadmap extends these foundations rather than replacing them.

## How to use this roadmap

- Start with the first unchecked phase and complete its acceptance criteria.
- Keep each phase in its own pull request or focused commit series.
- Update the checkboxes and add a short note under **Progress log** when a phase is done.
- Do not claim customer impact or production usage without real measurements.
- Demo data and credentials are for demonstration only; replace them before any real business use.

## Phases

### Phase 0 — Publish a reliable portfolio demo (S)

**Why:** A reviewer or prospective shop owner needs to open the app and complete the booking flow quickly. A live demo makes the existing work visible.

**Work**

- [ ] Fix and verify the calendar weekday/time-zone issue recorded in `TODO.md` for `America/Fortaleza`.
- [ ] Choose a single public demo URL and provide seeded, clearly fictional data.
- [ ] Create a production Compose configuration: build the frontend, serve `frontend/dist` through `server.mjs` (without Vite), publish only the landing/proxy port, and keep the gateway and internal services private.
- [ ] Add production health checks and confirm the public health route and complete customer booking/admin login path work against PostgreSQL.
- [ ] Add a short demo guide to README: URL, demo credentials, features to try, known limitations, and architecture diagram.
- [ ] Add screenshots or a short screen recording and a clear “demo data is resettable” note.
- [ ] Set a spend limit / billing alert with the host, and verify the VM remains on free-eligible resources.

**Acceptance**

- A clean browser can open the public landing page and complete a booking.
- Admin login can confirm, reschedule, and cancel a booking.
- Restarting the app preserves database data; redeploying does not expose internal service ports.
- README has copy-pasteable setup steps and truthful demo limitations.

**Demo hosting recommendation:** Oracle Cloud Infrastructure Always Free compute VM + Docker Compose + Caddy for HTTPS + DuckDNS for a free hostname. This fits the existing multi-container architecture better than a static-only host. Free availability is subject to Oracle account/region capacity; the account console labels resources that qualify. See deployment runbook below.

### Phase 1 — Booking flow correctness and trust (S)

**Why:** A booking app must not offer a wrong day or double-book a slot. A polished visual flow only matters if its core promise is reliable.

**Work**

- [x] Reproduce the weekday bug in a test using UTC and `America/Fortaleza`, including month boundaries and dates near midnight.
- [x] Use date-only values for calendar selections and an explicit business timezone for availability calculations; avoid parsing a date-only string as a local timestamp.
- [x] Add regression coverage for frontend calendar rendering and backend slot generation at timezone/day boundaries.
- [x] Verify concurrent booking attempts cannot both claim the same slot; if a race exists, make conflict detection and persistence atomic (for example with a transaction/constraint strategy appropriate to the current schema).
- [x] Add clear loading, no-availability, error, and success states to public booking.
- [x] Review validation and rate limiting on public booking endpoints to reduce spam.

**Acceptance**

- The selected weekday always matches the business calendar in `America/Fortaleza`.
- Two simultaneous requests for an overlapping slot cannot both succeed.
- Failures tell the client what to do next and do not leave a misleading success state.

### Phase 2 — WhatsApp appointment reminders (M)

**Why:** The product already has WhatsApp provider configuration and appointment status messaging. Timed reminders are a direct customer benefit and a strong end-to-end engineering story.

**Work**

- [x] Define reminder timing (start with one configurable reminder, 24 hours before the appointment) and message templates in shop settings.
- [x] Add a durable reminder/outbox record with appointment, scheduled time, delivery state, attempts, provider response/error, and an idempotency key.
- [x] Add a worker/periodic job that claims due reminders safely and retries transient provider failures with backoff.
- [x] Cancel or supersede pending reminders when an appointment is cancelled or rescheduled.
- [x] Show delivery state and a manual retry action in the appointment admin view.
- [ ] Add tests for due-time calculation, retry, duplicate prevention, cancellation/reschedule, and provider errors.
- [ ] Document provider setup and make the feature clearly optional when no provider is configured.

**Acceptance**

- One confirmed appointment produces at most one successful reminder per configured reminder time.
- Cancelled/rescheduled bookings do not receive stale reminders.
- A failed provider request is visible and safely retryable; secrets never appear in logs or API responses.

### Phase 3 — Customer history and rebooking (M)

**Why:** A shop needs to recognize returning clients and make the next booking easy. This creates a customer-retention workflow from data the app already collects.

**Work**

- [ ] Introduce a `Customer` entity keyed by normalized phone number; migrate existing appointment name/phone data without losing history.
- [ ] Keep an appointment's customer relationship while preserving a snapshot of the name/phone used at booking for historical accuracy.
- [ ] Add an admin customer list with search by name/phone, last visit, visit count, and next appointment.
- [ ] Add a customer detail view with chronological appointment history and service totals.
- [ ] Add “book again” to preselect the prior service while still requiring the client/shop to choose an available date and time.
- [ ] Add privacy/data-retention handling and document deletion/export behavior suitable for the intended Brazilian market before real customer rollout.
- [ ] Add API and UI tests for phone normalization, duplicate merging, history, search, and rebooking.

**Acceptance**

- Existing appointments remain associated with the correct customer after migration.
- Different phone formatting for the same number resolves to one customer.
- Rebooking uses current availability and never silently reuses a stale time.

### Phase 4 — Shop performance dashboard (M)

**Why:** Owners want a quick answer to “how is the shop doing?” Existing appointment status, timestamps, and stored prices support a useful first report.

**Work**

- [ ] Add date-range filters with a clear shop timezone.
- [ ] Show booked, completed, cancelled, and awaiting-confirmation counts; distinguish revenue from appointment value and only count completed/paid services as collected revenue once payment state exists.
- [ ] Add charts for bookings by weekday/time and service mix; include accessible text summaries.
- [ ] Add date-range comparison and CSV export after the underlying metric definitions are documented.
- [ ] Add tests for canceled/rescheduled appointment accounting, date boundaries, and empty periods.

**Acceptance**

- Every metric has a visible definition and matches a hand-calculated sample dataset.
- Changing the date range updates every visualization and export consistently.

### Phase 5 — Multiple barbers and per-barber availability (L)

**Why:** This expands the addressable customer from a solo barber to a small shop. It is a larger schema and scheduling change, so it follows correctness, reminders, and customer history.

**Work**

- [ ] Add barber/staff profiles and shop ownership boundaries before supporting multiple businesses.
- [ ] Assign services, business hours, blocks, and appointments to a barber.
- [ ] Extend availability and conflict checks to use the selected barber's schedule.
- [ ] Add public barber selection and admin views filtered by barber, plus an “any available barber” option if desired.
- [ ] Add migration/backfill assigning current data to a default barber.
- [ ] Add authorization tests that prove one shop cannot read or mutate another shop's records.

**Acceptance**

- Two barbers can accept overlapping appointments without conflict, while one barber cannot be double-booked.
- Every admin and public API query is scoped to the correct shop and barber.

### Later product experiments (after the phases above)

- Deposits/prepayment and cancellation policies through a payment provider; do not store card data yourself.
- Waitlist for recently freed slots.
- Review request and client reactivation campaigns with consent controls.
- Service photos / barber portfolio and per-shop branding.
- PWA installability and customer self-service cancellation/rescheduling links.
- Multiple shops/tenants and subscription billing only after the single-shop product is validated with real barbers.

## Free demo deployment runbook

This is for a portfolio/demo environment, not a business that depends on uninterrupted availability. Oracle describes Always Free compute for small apps and proof-of-concept use, but regional capacity can prevent provisioning. Render's free Postgres is unsuitable for a lasting demo because it expires after 30 days; free web services also sleep when idle. See source links at the end of this document and recheck current terms before deployment.

### A. Prepare the repository

1. Push the project to a public GitHub repository. Remove real credentials and private customer data first; keep `.env` ignored.
2. Complete Phase 0's production Compose work. The checked-in Compose file currently starts Vite and the landing proxy in `--dev` mode; it is a development stack and should not be exposed as the public demo.
3. Ensure only the public entry point (port 8080) is published. Do not publish PostgreSQL, gateway, gRPC, or internal service ports to the internet.
4. Configure the public URL / cookie settings to use HTTPS and the chosen hostname. Confirm cookie `Secure` and same-site behavior with the deployed origin.
5. Make the seed explicitly demo-only and change its default password before exposing the demo. Prefer a read-only walkthrough account if the application supports one.

### B. Create the free VM

1. Create an OCI account and choose an Always Free eligible Ampere A1 VM in the account's home region. A small multi-core A1 VM is the relevant option; resource capacity is not guaranteed in every region.
2. Use Ubuntu, attach the allowed boot volume, add an SSH public key, and reserve a public IP if available within free limits.
3. Configure cloud ingress and the VM firewall for SSH (restrict to your IP where possible) and HTTP/HTTPS (80/443). Do not open app ports 3000–8080 directly.
4. Install Docker Engine and the Docker Compose plugin using the official Ubuntu Docker instructions. Log out/in if needed for Docker group membership.
5. Clone the repository to the VM and create a production `.env` with long random values for `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, `WHATSAPP_ENCRYPTION_KEY`, and `WHATSAPP_INTERNAL_SECRET`. Leave WhatsApp provider credentials unset for the demo unless you intentionally configure them. Never commit or paste secrets into screenshots.

### C. DNS and HTTPS

1. Create a free DuckDNS subdomain and point it to the VM public IP; set up its IP updater if the address is not reserved.
2. Run Caddy as the public reverse proxy on ports 80/443, forwarding the hostname to the app's internal port 8080. Caddy can obtain and renew a TLS certificate automatically when DNS and inbound ports are correct.
3. Put Caddy and the app on the same Docker network. Only Caddy should publish ports 80 and 443; publish 8080 only on localhost or keep it un-published and proxy to the container network.
4. Test the HTTPS landing page, `/painel`, `/api/health`, login cookie, booking submission, and browser console from a clean/incognito session.

### D. Run, update, and back up

- Start with the production compose file, for example `docker compose -f docker-compose.prod.yml up -d --build` (create this file as part of Phase 0).
- Inspect `docker compose ps` and `docker compose logs --tail=100` after startup. Confirm database migration/seed completed successfully.
- For a code update: `git pull`, then `docker compose -f docker-compose.prod.yml up -d --build`.
- Create an on-demand database dump before migrations or demo resets. Keep a copy outside the VM; demo data should be treated as disposable.
- Check OCI budget/cost controls and usage periodically. Keep all resources within the Always Free labels; stop/delete anything that is not eligible.
- If Oracle capacity is unavailable, publish a static, interactive UI preview separately and use a short-lived hosted backend only for a time-boxed demo. Do not describe a sleeping or expiring free deployment as production-ready.

## Progress log

- 2026-10-27: Roadmap captured from the current repository and product research. Phase 0 is the first implementation target.
- 2026-10-30: Phase 1 implementation completed and verified: booking checks run atomically under a PostgreSQL advisory lock, overlapping service durations serialize, timezone/date regression coverage is present, and the booking UI exposes recovery states. The live concurrency integration check previously passed against an isolated database.
- 2026-10-30: Phase 2 implementation started: configurable reminder settings, durable outbox schema, scheduler/worker with leased claims and exponential retries, cancellation on status changes/reschedules, and admin status/retry UI are in place. The local migration is applied. Provider-backed delivery tests, setup documentation, and duplicate-delivery behavior across provider/network timeouts remain open; the external providers' idempotency support has not been verified.

## Sources checked 2026-10-27

- Oracle Always Free resource list and capacity notes: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Oracle Always Free FAQ: https://www.oracle.com/cloud/free/faq/
- Render free-tier limitations (including idle spin-down and 30-day Postgres expiry): https://render.com/docs/free
- Render private network limitations: https://render.com/docs/private-network
- Booksy barber product positioning (online booking and reminders): https://biz.booksy.com/who-loves-us/barber
- Technical portfolio guide (working project, documentation, communication): https://cdn.uconnectlabs.com/wp-content/uploads/sites/139/2025/07/TechnicalPortfolioGuide_UPDATED2026.pdf
