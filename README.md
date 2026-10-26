# Seu Carlos Barbearia

Online booking and administration for a barbershop. Customers can browse services, check availability, and request appointments. Staff can manage appointments, services, business hours, blocked dates, and booking settings.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Development](#development)
- [Useful commands](#useful-commands)
- [HTTP API](#http-api)
- [Default development data](#default-development-data)
- [Booking rules](#booking-rules)
- [Testing](#testing)
- [Project conventions](#project-conventions)

## Features

- Public landing page and appointment booking flow.
- React administration panel for appointments, services, business hours, blocked dates, and settings.
- Separate Fastify services behind a single API gateway.
- PostgreSQL persistence with Prisma migrations and a development seed.
- HTTP/JSON APIs for clients and gRPC contracts for internal service communication.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Vitest |
| Backend | Node.js 20+, TypeScript, Fastify 5 |
| Database | PostgreSQL 16, Prisma 5 |
| Internal contracts | gRPC, Protocol Buffers, ts-proto |
| Workspace | pnpm 9, pnpm workspaces, Turborepo 2 |
| Local infrastructure | Docker Compose |

## Architecture

```text
.
├── frontend/                       # React administration panel
├── scrollcraft/builds/barbershop-mvp/ # Static public landing page
├── server.mjs                      # Serves landing/panel and proxies /api
├── services/
│   ├── api-gateway/                # External API entry point (:3000)
│   ├── auth-service/               # Authentication (:3001, gRPC :5001)
│   ├── scheduling-service/         # Availability and appointments (:3002, gRPC :5002)
│   ├── services-service/           # Barber service catalog (:3003, gRPC :5003)
│   ├── blocks-service/             # Date/time blocks (:3004, gRPC :5004)
│   ├── business-hours-service/     # Weekly opening hours (:3005, gRPC :5005)
│   └── settings-service/           # Booking settings (:3006, gRPC :5006)
└── shared/
    ├── prisma/                     # Shared schema, migrations, and seed
    ├── proto/                      # Protocol Buffer contracts
    └── types/                      # Shared TypeScript types
```

Each backend service follows a ports-and-adapters / hexagonal structure, separating domain logic, use cases, interfaces, and infrastructure. The gateway exposes the public HTTP API and forwards requests to the services. The frontend uses the gateway; internal service communication uses gRPC where configured.

`server.mjs` serves the static landing and booking flow at `/`, serves the React administration panel under `/painel`, and proxies `/api` to the gateway. In development it proxies `/painel` to Vite; the browser uses the same origin for API requests.

## Requirements

- Node.js 20 or later (Node 24 has also been used in development).
- pnpm 9 (`corepack enable` can activate the version declared in `package.json`).
- Docker with the Docker Compose plugin, or an available PostgreSQL 16 instance.

## Getting started

### 1. Install dependencies

From the repository root:

```bash
corepack enable
pnpm install
```

### 2. Configure environment files

`.env.example` documents the available variables without containing credentials. Create a root `.env` for Docker Compose and local copies for the services:

```bash
cp .env.example .env
for dir in frontend services/* shared/prisma; do cp .env.example "$dir/.env"; done
```

Generate private values for `POSTGRES_PASSWORD`, `JWT_SECRET`, and `COOKIE_SECRET` in the root `.env` (for example, with `openssl rand -hex 32`). The Compose stack refuses to start if these values are missing. For local development, use a PostgreSQL connection such as:

```text
DATABASE_URL=postgresql://barbershop:<POSTGRES_PASSWORD>@localhost:5432/barbershop
```

Set `JWT_SECRET` and `COOKIE_SECRET` in each service's local `.env` as well. The example file is a variable-name template; blank values are not ready-to-run credentials. `.env` files are ignored by Git and should never be committed.

### 3. Start PostgreSQL

To use the repository's local PostgreSQL 16 container:

```bash
docker compose up -d postgres
```

The Compose database is exposed at `localhost:5432` with the database and user set to `barbershop`; its password comes from the root `.env`. To stop the database container:

```bash
docker compose stop postgres
```

### 4. Generate Prisma client, migrate, and seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

`db:migrate` runs Prisma's development migration command. For an already-migrated deployment, use `pnpm --filter @barbershop/prisma db:migrate:deploy` instead.

### 5. Start the application

```bash
pnpm dev
```

This starts the landing/panel development server, the Vite frontend, and backend packages with development scripts. Open:

- Landing page: <http://localhost:8080/>
- Admin panel: <http://localhost:8080/painel> (Vite-backed)
- API health check: <http://localhost:3000/health>

The landing server proxies `/api` to the gateway on port 3000 and `/painel` to Vite. For standalone frontend development, Vite is available at <http://localhost:5173/painel/>.

### Docker Compose application stack

Build and start the complete stack, including PostgreSQL, the one-shot migration/seed job, all backend services, Vite, and the landing/panel proxy:

```bash
docker compose up -d --build
```

On startup, Compose waits for PostgreSQL, applies pending Prisma migrations, and loads the idempotent development seed before starting the APIs. Use the single web entry point at <http://localhost:8080/>: the public booking experience is at `/`, and the administration panel is at <http://localhost:8080/painel>. The gateway health check remains available at <http://localhost:3000/health>. Vite runs inside Compose for hot reload and is proxied through `/painel`; its port is not published to the host. Stop the stack with `docker compose down`; this keeps the database volume. To remove the database and its local data as well, use `docker compose down -v`.

## Development

To run a package independently, use its workspace filter. For example:

```bash
pnpm --filter @barbershop/api-gateway dev
pnpm --filter @barbershop/frontend dev
```

Available workspace package names include `@barbershop/api-gateway`, `@barbershop/auth-service`, `@barbershop/scheduling-service`, `@barbershop/services-service`, `@barbershop/blocks-service`, `@barbershop/business-hours-service`, `@barbershop/settings-service`, and `@barbershop/frontend`.

The integrated Node server can be run with a built frontend:

```bash
pnpm --filter @barbershop/frontend build
pnpm landing
```

By default, it listens on port 8080. Options can be passed to `server.mjs`, for example `pnpm landing -- --port 8081 --gateway http://localhost:3000`. The `--dev` flag proxies `/painel` to Vite:

```bash
pnpm landing:dev
```

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the landing dev server and all workspace development tasks |
| `pnpm build` | Build workspace packages through Turborepo |
| `pnpm start` | Start built workspace packages |
| `pnpm test` | Run package test tasks through Turborepo |
| `pnpm test:unit` | Run unit-test tasks through Turborepo |
| `pnpm test:e2e` | Run end-to-end test tasks through Turborepo, if configured by a package |
| `pnpm lint` | Run lint tasks provided by workspace packages |
| `pnpm format` | Format TypeScript, TSX, JSON, and Markdown files with Prettier |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm db:migrate` | Create/apply development migrations |
| `pnpm db:push` | Push Prisma schema changes without creating a migration |
| `pnpm db:seed` | Insert development seed data |
| `pnpm proto:generate` | Generate gRPC/TypeScript contract code |
| `pnpm landing` | Serve static landing and built panel on port 8080 |
| `pnpm landing:dev` | Serve landing and proxy the panel to Vite |

## HTTP API

The API is available through the gateway at `http://localhost:3000`. Routes are registered in `services/api-gateway/src/main.ts`; the gateway's `/health` endpoint can be used for a basic availability check.

### Public routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/services` | List available services |
| `GET` | `/api/availability` | Retrieve availability for a requested date/service |
| `GET` | `/api/blocked-dates` | Retrieve blocked dates |
| `POST` | `/api/appointments` | Request an appointment |

### Authentication and administration

Admin routes require authentication. The API supports the `auth_token` cookie and bearer authorization where applicable.

| Methods | Route | Purpose |
| --- | --- | --- |
| `POST`, `GET` | `/api/auth/login`, `/api/auth/me` | Sign in and inspect the current session |
| `POST` | `/api/auth/logout` | End the current session |
| `GET`, `POST`, `PUT`, `DELETE` | `/api/admin/services` | Manage services |
| `GET`, `PATCH` | `/api/admin/appointments` | List appointments and change status/reschedule |
| `GET`, `POST`, `DELETE` | `/api/admin/blocks` | Manage blocked dates/times |
| `GET`, `PUT` | `/api/admin/business-hours` | Manage opening hours |
| `GET`, `PUT` | `/api/admin/settings` | Manage booking settings |

For request/response details, see the route handlers under each service's `src/interfaces` directory.

## Default development data

`pnpm db:seed` creates default services, opening hours, settings, and an admin user:

| Field | Development seed value |
| --- | --- |
| Email | `carlos@barbearia.com` |
| Password | `admin123` |

These credentials are defined in `shared/prisma/seed.ts` for local development. Change or remove them before using any non-development environment. The seed also creates Corte, Barba, Corte + Barba, and Sobrancelha services, along with weekday/Saturday business hours and default booking-window settings.

## Booking rules

- Booking dates use the `America/Fortaleza` business timezone.
- Available slots account for each service's duration and the business's opening hours and breaks.
- The scheduling service checks for conflicting appointments before saving a booking.
- Minimum booking notice and maximum days in advance are configurable through settings.
- Appointments use statuses including awaiting confirmation, confirmed, cancelled, and rescheduled.

## Testing

Run all workspace tests with:

```bash
pnpm test
```

Run a specific package's tests with its workspace filter, for example:

```bash
pnpm --filter @barbershop/scheduling-service test
pnpm --filter @barbershop/frontend test
```

Some root-level task names exist for packages to implement; a command only runs tests or lint checks where a workspace package defines the corresponding script.

## Project conventions

- Keep service-specific behavior in the relevant service rather than coupling services directly to one another.
- Keep domain rules independent of transport and persistence concerns.
- Update shared Protocol Buffer definitions and regenerate generated code when changing gRPC contracts.
- Use Prisma migrations for schema changes intended to be shared; use `db:push` only for local schema iteration.
- Do not commit `.env` files, credentials, or `node_modules`. Use `.env.example` to document required environment variable names without values.
