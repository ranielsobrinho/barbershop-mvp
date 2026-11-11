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

### Phase 0 — Deploy a reliable AWS demo with Terraform (L)

**Why:** A reviewer or prospective shop owner needs to open the app and complete the booking flow quickly. A live demo makes the existing work visible.

**Work**

- [ ] Fix and verify the calendar weekday/time-zone issue recorded in `TODO.md` for `America/Fortaleza`.
- [ ] Define the AWS deployment in Terraform: network, ECS cluster, ECR, RDS PostgreSQL, load balancer, service discovery, IAM roles, secrets, and logs.
- [ ] Run the Terraform configuration against Floci first, using its local endpoint and only the AWS services enabled in the local instance. Confirm this stage cannot target the real AWS account.
- [ ] Build and run separate ECS services for the API gateway and each backend (auth, scheduling, services, blocks, business-hours, and settings), plus the production web entry point.
- [ ] Build the React admin panel and serve it with the static landing page through `server.mjs` without Vite; expose only the public web service.
- [ ] Add a one-shot database migration task, health checks, and verify the public health route, booking flow, and admin login against PostgreSQL.
- [ ] After Floci validation, use the same Terraform configuration with AWS endpoints and production secrets to deploy the demo to AWS.
- [ ] Choose a single public demo URL and provide seeded, clearly fictional data.
- [ ] Add a short demo guide to README: URL, demo credentials, features to try, known limitations, and architecture diagram.
- [ ] Add screenshots or a short screen recording and a clear “demo data is resettable” note.
- [ ] Set AWS budget alerts and document expected monthly cost for the demo resources before applying Terraform.

**Acceptance**

- Terraform creates and destroys the required local Floci resources without requests reaching a real AWS account.
- Each backend can be deployed and scaled as an independent ECS service; the public web service reaches the gateway and internal services privately.
- A clean browser can open the public landing page and complete a booking.
- Admin login can confirm, reschedule, and cancel a booking.
- Restarting the app preserves database data; redeploying does not expose internal service ports.
- README has copy-pasteable Floci validation and AWS deployment steps, plus truthful demo limitations.

**Deployment approach:** AWS ECS with one service per backend, separate gateway and production web services, RDS PostgreSQL, and Terraform-managed infrastructure. Validate against Floci before using AWS. Emulator success does not replace an AWS smoke test or review of current pricing and service limits.

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
- [x] Add tests for due-time calculation, retry, duplicate prevention, cancellation/reschedule, and provider errors.
- [x] Document provider setup and make the feature clearly optional when no provider is configured.

**Acceptance**

- The outbox creates one reminder per configured reminder time and only one worker can claim it at a time. Provider-level at-most-once delivery cannot be guaranteed unless the provider supports idempotency; see the README delivery guarantee.
- Cancelled/rescheduled bookings do not receive stale reminders.
- A failed provider request is visible and safely retryable; secrets never appear in logs or API responses.

### Phase 3 — Customer history and rebooking (M)

**Why:** A shop needs to recognize returning clients and make the next booking easy. This creates a customer-retention workflow from data the app already collects.

**Work**

- [x] Introduce a `Customer` entity keyed by normalized phone number; migrate existing appointment name/phone data without losing history.
- [x] Keep an appointment's customer relationship while preserving a snapshot of the name/phone used at booking for historical accuracy.
- [x] Add an admin customer list with search by name/phone, last visit, visit count, and next appointment.
- [x] Add a customer detail view with chronological appointment history and service totals.
- [x] Add “book again” to select a service, date, and current available time in a rebooking modal.
- [x] Add privacy/data-retention handling and document deletion/export behavior suitable for the intended Brazilian market before real customer rollout.
- [x] Add API and UI tests for phone normalization, duplicate merging, history, search, and rebooking.

**Acceptance**

- Existing appointments remain associated with the correct customer after migration.
- Different phone formatting for the same number resolves to one customer.
- Rebooking uses current availability and never silently reuses a stale time.

### Phase 4 — Shop performance dashboard (M)

**Progress (2026-11-10):** Complete. The dashboard has unrestricted DD/MM/YYYY date inputs, status/value summaries with explicit definitions, weekday/hour/service charts, equivalent previous-period comparison, and CSV export. PostgreSQL calculates the aggregates in the barbershop timezone. Appointment value is explicitly not represented as received revenue because payment state does not exist. PostgreSQL integration coverage validates cancellation/reschedule accounting, date boundaries, empty periods, and a hand-calculated sample.

**Why:** Owners want a quick answer to “how is the shop doing?” Existing appointment status, timestamps, and stored prices support a useful first report.

**Work**

- [x] Add date-range filters with a clear shop timezone.
- [x] Show booked, completed, cancelled, and awaiting-confirmation counts; distinguish revenue from appointment value and only count completed/paid services as collected revenue once payment state exists.
- [x] Add charts for bookings by weekday/time and service mix; include accessible text summaries.
- [x] Add date-range comparison and CSV export after the underlying metric definitions are documented.
- [x] Add tests for canceled/rescheduled appointment accounting, date boundaries, and empty periods.

**Acceptance**

- [x] Every metric has a visible definition and matches a hand-calculated sample dataset.
- [x] Changing the date range updates every visualization and export consistently.

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

### Phase 6 — Load testing and capacity validation (M)

**Why:** Measure the independent ECS services under load to find bottlenecks and make scaling decisions based on observed behavior.

**Work**

- [ ] Add a repeatable load-test script (for example, k6) with configurable base URL, duration, ramp-up, request rate, and virtual-user ceiling.
- [ ] Cover representative public flows: health, service listing, availability lookup, and appointment creation with disposable data; keep admin/auth load separate.
- [ ] Include staged profiles for hundreds of requests per second and an opt-in higher profile reaching thousands per second, with explicit duration and hard limits.
- [ ] Capture latency percentiles, achieved throughput, error rate, and relevant ECS/RDS resource metrics; record environment, dataset, and profile for each run.
- [ ] Run only against an isolated Floci/local or dedicated AWS test environment, never the production/demo URL; document test-data cleanup/reset.
- [ ] Use results to identify bottlenecks and recommend ECS scaling thresholds; do not apply unvalidated thresholds to production.

**Acceptance**

- A documented command runs baseline and higher-rate profiles against an explicitly selected test URL.
- The script reports latency percentiles, achieved requests per second, and failures, and exits nonzero when thresholds are exceeded.
- Runs use disposable data and cannot silently target production.
- Results identify the first constrained component and include a scaling recommendation.

### Later product experiments (after the phases above)

- Deposits/prepayment and cancellation policies through a payment provider; do not store card data yourself.
- Waitlist for recently freed slots.
- Review request and client reactivation campaigns with consent controls.
- Service photos / barber portfolio and per-shop branding.
- PWA installability and customer self-service cancellation/rescheduling links.
- Multiple shops/tenants and subscription billing only after the single-shop product is validated with real barbers.

## Floci and AWS deployment runbook

Use Floci to validate Terraform and container orchestration locally, then deploy the same resource definitions to AWS after reviewing the plan and production configuration. Floci is an emulator; verify AWS-specific networking, IAM, TLS, availability, and billing behavior in a controlled AWS deployment.

### A. Prepare the repository

1. Keep real credentials and private customer data out of source control; keep `.env` ignored.
2. Add a production image target that builds the React frontend and runs `server.mjs` without Vite. The checked-in Compose file starts the development frontend and landing proxy in `--dev` mode.
3. Configure an isolated Floci Terraform endpoint using the local test credentials from `floci env`; verify endpoint overrides against the installed Terraform AWS provider version.
4. Define ECS and ECR, RDS PostgreSQL, private service discovery, load balancing, security groups, task roles, secrets, and logs in Terraform.
5. Expose only the public web entry point. Keep PostgreSQL, gateway, gRPC, and internal service ports private.
6. Configure HTTPS and cookie settings for AWS. Make the seed explicitly demo-only and replace its default password before exposure.

### B. Validate against Floci

1. Start Floci and confirm `ecs`, `ecr`, `rds`, `elasticloadbalancing`, `servicediscovery`, `iam`, `secretsmanager`, and `logs` are enabled.
2. Build and publish the app image to Floci ECR, or use a local image URI only where the Floci ECS workflow supports it.
3. Run Terraform plan/apply with the Floci endpoint, run the migration task, and inspect ECS health, task logs, and the public web entry point.
4. Exercise booking/admin flows with disposable data and confirm teardown is scoped to the Floci workspace.
5. Record emulator gaps; do not treat Floci success as proof of AWS behavior.

### C. Deploy the same configuration to AWS

1. Select a region and review current ECS, RDS, load balancer, networking, and logging costs before applying.
2. Use a least-privilege AWS deployment identity and load production secrets from Secrets Manager; never reuse Floci test credentials.
3. Run `terraform plan`, review every change, and apply with AWS state and variables separate from Floci.
4. Push a versioned image, run migrations as a one-shot ECS task, and roll out web, gateway, and backend services.
5. Configure the public hostname and HTTPS; test landing, `/painel`, API health, login cookie, booking flow, and browser behavior.

### D. Run, update, and back up

- Inspect ECS task health and CloudWatch logs after rollout; confirm migration/seed completion before serving traffic.
- For updates, build and push a versioned image, review the Terraform plan, apply, and verify ECS deployment stability.
- Back up RDS before migrations or demo resets; treat demo data as disposable.
- Set AWS budget alerts and review costs. Destroy Floci resources after tests when persistence is unnecessary; select the Floci state before any `terraform destroy`.

## Progress log

- 2026-10-27: Roadmap captured from the current repository and product research. Phase 0 is the first implementation target.
- 2026-10-30: Phase 1 implementation completed and verified: booking checks run atomically under a PostgreSQL advisory lock, overlapping service durations serialize, timezone/date regression coverage is present, and the booking UI exposes recovery states. The live concurrency integration check previously passed against an isolated database.
- 2026-10-30: Phase 2 implementation started: configurable reminder settings, durable outbox schema, scheduler/worker with leased claims and exponential retries, cancellation on status changes/reschedules, and admin status/retry UI are in place. The local migration is applied. Provider-backed delivery tests, setup documentation, and duplicate-delivery behavior across provider/network timeouts remain open; the external providers' idempotency support has not been verified.
- 2026-11-03: Deployment direction updated to AWS ECS with independently scalable backend services; Terraform will be tested against the user's Floci instance before AWS. Added a load-testing phase for isolated, staged hundreds-to-thousands RPS profiles.
- 2026-11-09: Phase 2 implementation complete. Tests cover SKIP LOCKED claims, concurrent poll coalescing, retry scheduling, stale appointment cancellation, disabled-provider behavior, and reschedule replacement. README documents setup and optional use. Delivery is at-least-once across ambiguous provider/network timeouts: the Wame and Zapster adapters do not currently pass a provider idempotency token, so duplicate external delivery remains possible in that failure window.
- 2026-11-10: Phase 3 implementation started. Added normalized Customer records and appointment links with snapshots, migration/backfill and duplicate-phone merge, authenticated customer search/history/export/identity-erasure endpoints, admin customer directory, and rebooking that carries the prior active service into the public flow while fetching current availability. Privacy/retention policy decisions and the phase's automated coverage remain open; implementation has not been run through the workspace checks yet.
- 2026-11-10: Phase 3 complete. Applied the customer-history migration to the local PostgreSQL database and confirmed all 5 existing appointments are linked. Added a documented manual retention/export/erasure policy, admin customer API/UI, rebooking modal for service/date/available time, and a paged streamed CSV report with Portuguese headings, no internal IDs, and BRL amounts. Workspace lint and the full suite passed.
- 2026-11-10: Phase 4 complete. Added shop-timezone date-range reporting with comparison, status/value definitions, accessible weekday/hour/service charts, and CSV export. PostgreSQL aggregates keep appointment rows in the database; integration tests verify a hand-calculated status/value sample, Fortaleza day boundaries, reschedules/cancellations, and empty periods. Full workspace suite passed (17 tasks).

## Sources checked 2026-10-27

- Booksy barber product positioning (online booking and reminders): https://biz.booksy.com/who-loves-us/barber
- Technical portfolio guide (working project, documentation, communication): https://cdn.uconnectlabs.com/wp-content/uploads/sites/139/2025/07/TechnicalPortfolioGuide_UPDATED2026.pdf
