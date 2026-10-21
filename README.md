# 💈 Sistema de Agendamento — Seu Carlos Barbearia

MVP de agendamento online para barbearia: site público com reserva de horários e painel administrativo completo (calendário, serviços, bloqueios, expediente e status de agendamentos).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind (painel) + landing estática (scroll-craft) |
| Backend | 7 microserviços em Node.js + **Fastify 5** |
| Banco | PostgreSQL 16 + Prisma ORM |
| Comunicação interna | HTTP (JSON) + gRPC (proto/ts-proto) |
| Monorepo | pnpm workspaces + Turborepo 2 |
| Testes | Vitest (50 testes unitários no domínio crítico) |
| Infra local | Docker Compose |

## Arquitetura

```
barbershop-mvp/
├── frontend/                  # React (Vite) — painel admin em /app (porta 5173)
├── server.mjs                 # landing em /, painel em /app, proxy /api -> gateway
├── scrollcraft/               # landing pública (HTML/CSS/JS estático, sem build)
├── services/
│   ├── api-gateway/           # :3000 — proxy, CORS, rate-limit e auth JWT das rotas /api/admin/*
│   ├── auth-service/          # :3001 / gRPC :5001 — login, JWT, cookie de sessão
│   ├── scheduling-service/    # :3002 — disponibilidade, criação/status/reagendamento (regras de agenda)
│   ├── services-service/      # :3003 — CRUD de serviços
│   ├── blocks-service/        # :3004 — bloqueios pontuais (feriados, férias)
│   ├── business-hours-service/# :3005 — expediente semanal + horário de almoço
│   └── settings-service/      # :3006 — antecedência mínima e janela de dias
└── shared/
    ├── prisma/                # schema único + migrations + seed
    ├── proto/                 # contratos gRPC (.proto)
    └── types/                 # tipos compartilhados
```

- **Portas & Adapters**: cada serviço tem `domain/` (regras puras), `usecases/`, `interfaces/` (HTTP/gRPC) e `infrastructure/` (Prisma) — seguindo o template `hexagonal-template`.
- O **gateway** expõe um único entry point (`:3000`), encaminha `/api/**` para os serviços e aplica JWT nas rotas `/api/admin/*`.
- O frontend consome **apenas** o gateway (`VITE_API_URL`).

## Pré-requisitos

- Node.js ≥ 20 (testado com 24)
- pnpm 9 (`corepack enable`)
- Docker + Docker Compose (para subir o Postgres)

## Setup rápido (Docker)

```bash
cp .env.example .env
docker compose up -d --build      # sobe Postgres + 7 serviços + frontend
docker compose exec prisma npx prisma migrate deploy
docker compose exec prisma npx tsx seed.ts
```

- Painel (Vite): http://localhost:5173/app
- API Gateway: http://localhost:3000/health

> O `docker compose` sobe o painel; a landing estática é servida pelo `server.mjs` (veja abaixo).

> Se o `docker compose up` executar os serviços antes das migrations, eles reiniciam até o banco aceitar conexões (healthcheck do Postgres).

## Landing + painel (Option B)

A landing pública fica em `scrollcraft/builds/barbershop-mvp` (HTML/CSS/JS, sem build) e o painel React em `/app`. O `server.mjs` serve os dois na mesma origem e encaminha `/api` para o gateway.

```bash
pnpm --filter @barbershop/frontend build
pnpm landing                 # http://localhost:8080
```

- Landing: http://localhost:8080
- Painel: http://localhost:8080/app
- API: `/api` na mesma origem, proxy para `http://localhost:3000`
- Sem gateway no ar, a landing usa **modo demonstração**; `?demo=1` força o modo.

Para desenvolver o painel com HMR e a landing na mesma porta:

```bash
pnpm --filter @barbershop/frontend dev   # Vite :5173
pnpm landing:dev                         # :8080 -> /app no Vite, /api no gateway
```

## Desenvolvimento local

```bash
pnpm install                      # (se postinstall travar: pnpm install --ignore-scripts)
pnpm db:generate                  # gera o Prisma Client
pnpm build                        # builda todos os pacotes (Turbo)
pnpm test                         # roda todos os testes

# 1) banco
docker compose up -d postgres
cd shared/prisma && npx prisma migrate dev && npx tsx seed.ts

# 2) backends (em terminais separados, ou use: pnpm dev)
pnpm --filter @barbershop/api-gateway dev
pnpm --filter @barbershop/auth-service dev
pnpm --filter @barbershop/scheduling-service dev
pnpm --filter @barbershop/services-service dev
pnpm --filter @barbershop/blocks-service dev
pnpm --filter @barbershop/business-hours-service dev
pnpm --filter @barbershop/settings-service dev

# 3) frontend
pnpm --filter @barbershop/frontend dev
```

## Credenciais do painel admin

| Campo | Valor |
|---|---|
| E-mail | `carlos@barbearia.com` |
| Senha | `admin123` |

## Scripts principais

| Comando | Descrição |
|---|---|
| `pnpm dev` | Sobe todos os serviços + frontend em modo watch |
| `pnpm build` | Build de produção de todos os pacotes |
| `pnpm test` | Todos os testes (Vitest via Turbo) |
| `pnpm landing` | Landing em `:8080`, painel em `/app` e proxy `/api` |
| `pnpm landing:dev` | Idem, com `/app` apontando para o Vite `:5173` |
| `pnpm db:migrate` / `db:push` / `db:seed` | Migrations e seed do Prisma |
| `pnpm proto:generate` | Regenera os stubs gRPC (ts-proto) |

## API (resumo)

**Público** (via gateway `:3000`):

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/services` | Lista serviços ativos |
| GET | `/api/availability?date=YYYY-MM-DD&serviceId=` | Slots livres do dia |
| GET | `/api/blocked-dates?month=YYYY-MM` | Datas totalmente bloqueadas (`{ dates: string[] }`) |
| POST | `/api/appointments` | Cria agendamento (validações server-side) |

**Admin** (JWT obrigatório — cookie `auth_token` ou `Authorization: Bearer`):

| Método | Rota |
|---|---|
| POST | `/api/auth/login` · POST `/api/auth/logout` · GET `/api/auth/me` |
| GET/POST/PUT/DELETE | `/api/admin/services` |
| GET | `/api/admin/appointments?month=YYYY-MM` |
| PATCH | `/api/admin/appointments/:id/status` · `/:id/reschedule` |
| GET/POST/DELETE | `/api/admin/blocks` |
| GET/PUT | `/api/admin/business-hours` |
| GET/PUT | `/api/admin/settings` |

## Regras de negócio implementadas

- **Fuso fixo** `America/Fortaleza (UTC-3)`: datas chegam como `YYYY-MM-DD` e são tratadas como dia calendário; instantes são gravados com offset explícito.
- **Slots por serviço**: `slotMin` do serviço contra o expediente (`open–close`), com **almoço excluído** (`lunchStart–lunchEnd`).
- **Conflitos** verificados transacionalmente (nenhum slot ocupado por status ≠ `CANCELADO`).
- **Antecedência mínima** (`minNoticeHours`, padrão 2h) e **janela máxima** de agendamento (`maxDaysAhead`, padrão 60 dias) — configuráveis no painel.
- **Bloqueios** pontuais por data intervalo e expediente semanal com fechado/aberto (inclui sábado/domingo).
- Status: `AGUARDANDO_CONFIRMACAO` → `CONFIRMADO` / `CANCELADO` / `REAGENDADO`.

## Seed padrão

- Serviços: **Corte** (30 min, R$ 30) · **Barba** (30 min, R$ 20) · **Corte + Barba** (60 min, R$ 45) · **Sobrancelha** (15 min, R$ 15)
- Expediente: Seg–Sex 09:00–18:00 (almoço 12:00–13:00) · Sáb 08:00–14:00 · Dom fechado

## Estado dos testes

- `scheduling-service`: **47 testes** (geração de slots, regras de agenda, detecção de conflitos, serviço de disponibilidade)
- `auth-service`: **3 testes** (hash de senha, geração/verificação de JWT)
- Demais pacotes: sem testes de unidade ainda (ver "Próximos passos").

## Próximos passos conhecidos

1. Testes de unidade para `blocks`, `business-hours`, `settings`, `services` e páginas críticas do frontend.
2. Testes E2E do fluxo completo de agendamento (Playwright).
3. CI (lint + testes + build) e deploy.
4. `pnpm proto:generate` é o caminho oficial para regenerar stubs; os gerados estão versionados por serviço em `src/interfaces/grpc/generated/`.

> **Nota de ambiente**: o schema do Prisma compartilha um único `DATABASE_URL` — em produção, cada serviço pode apontar para o mesmo banco (esquema único) ou ser separado por variáveis próprias.
