# Planning Poker

> Real-time estimation ceremonies with collaborative UX, Socket.IO events, and a typed API/SPA monorepo powered by Turborepo.

![pnpm](https://img.shields.io/badge/pnpm-9.15+-f69220?logo=pnpm&logoColor=white) ![turbo](https://img.shields.io/badge/turborepo-2.8-000?logo=turbo&logoColor=white) ![tests](https://img.shields.io/badge/tests-81_passing-2ea44f) ![license](https://img.shields.io/badge/license-AGPL--3.0-blue)

**Live:** [planning-poker.up.railway.app](https://planning-poker.up.railway.app)

Planning Poker is a full-stack workspace for running agile estimation sessions. It bundles an Express + Prisma API, a Vite/React front-end, and a `@planning-poker/shared` package that centralizes socket contracts and validation schemas so both sides stay in sync.

## Highlights
- **Hidden votes & facilitation tools** -- All votes stay private until the facilitator reveals the round, preventing anchoring bias.
- **Real-time collaboration** -- Socket.IO propagates joins, vote submissions, and results instantly to connected participants.
- **Typed contracts** -- Shared Zod schemas and TypeScript types are published from `packages/shared`, reducing drift between clients.
- **Analytics-ready** -- The API exposes room summaries, completed stories, and user history endpoints for retro insights.
- **81 automated tests** -- 21 backend unit + 25 frontend unit + 35 Playwright e2e tests run on every push.
- **CI/CD pipeline** -- 6-stage GitHub Actions pipeline with parallel builds, integration tests, and auto-deploy to Railway.

## Monorepo Layout
```
.
├── apps
│   ├── api         # Express + Prisma server with JWT auth & Socket.IO
│   └── web         # React 19, Vite, Tailwind UI for facilitators & voters
├── packages
│   └── shared      # Reusable types, Zod schemas, socket event enums
├── e2e             # Playwright test suite (integration + production smoke)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

## Tech Stack
| Area | Tools |
| --- | --- |
| Front-end | React 19, Vite 7, TypeScript, Tailwind CSS, Zustand, React Router, Lucide icons |
| Back-end | Express 4, Socket.IO 4, Prisma 6, PostgreSQL 16, Zod validation, JWT auth |
| Testing | Vitest (unit), Playwright (e2e), Testing Library (components) |
| CI/CD | GitHub Actions (6-stage pipeline), Railway (deploy) |
| Tooling | pnpm 9, Turborepo 2, ESLint 9, Docker multi-stage builds |

## CI/CD Pipeline

Every push triggers a 6-stage pipeline:

```
📦 Setup → 🔧 Backend + 🎨 Frontend (parallel) → 🧪 E2E → 🚀 Deploy Web + API → 🏥 Production Smoke
```

| Stage | What it does |
| --- | --- |
| Setup | Install deps, generate Prisma client, build shared package |
| Backend | Build, lint, 21 unit tests |
| Frontend | Build, lint, 25 unit tests |
| Integration | 35 Playwright tests with Postgres service container |
| Deploy | Railway deploy for both frontend (nginx) and backend (Node.js) |
| Production Smoke | 3-user e2e test against live production URL |

Deploy and smoke test stages only run on `main` branch pushes.

## Getting Started
### Prerequisites
- Node.js 20+
- pnpm 9.15+ (`corepack enable pnpm`)
- Docker Desktop (for local Postgres)

### Installation
```bash
# 1. Clone and install
pnpm install

# 2. Start Postgres
docker compose up -d postgres

# 3. Generate Prisma client + sync schema
pnpm --filter @planning-poker/api db:generate
pnpm --filter @planning-poker/api db:push

# 4. Start everything
pnpm dev
```

The API boots on `http://localhost:3001` and Vite serves the web UI on `http://localhost:5173`.

## Environment Variables

| Name | Location | Description |
| --- | --- | --- |
| `DATABASE_URL` | API | PostgreSQL connection string used by Prisma |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | API | Secrets for auth tokens and refresh tokens |
| `PORT` | API | Express listen port (defaults to `3001`) |
| `CORS_ORIGIN` | API | Allowed origin for both REST & Socket.IO requests |
| `VITE_API_URL` | Web | Base URL for REST calls (defaults to same-origin) |
| `VITE_WS_URL` | Web | Socket.IO endpoint (defaults to same-origin) |

## Scripts

| Scope | Command | Description |
| --- | --- | --- |
| Root | `pnpm dev` | Runs dev servers via Turborepo (API + Web) |
| Root | `pnpm build` | Builds all workspaces with caching |
| Root | `pnpm lint` | ESLint + TypeScript checks |
| API | `pnpm --filter @planning-poker/api test` | 21 backend unit tests |
| Web | `pnpm --filter @planning-poker/web test` | 25 frontend unit tests |
| E2E | `pnpm --filter @planning-poker/e2e test` | 35 Playwright integration tests |
| E2E | `pnpm --filter @planning-poker/e2e test:prod` | Production smoke test (3 users) |

## Deployment

Both frontend and backend deploy to **Railway** automatically after CI passes on `main`.

| Service | URL | Stack |
| --- | --- | --- |
| Frontend | [planning-poker.up.railway.app](https://planning-poker.up.railway.app) | nginx + static files (Docker) |
| Backend | api-production-31a2.up.railway.app | Node.js + Prisma (Docker) |
| Database | Railway Postgres | PostgreSQL 16 |

## Self-Hosted Deployment

Deploy to your own AWS account with Terraform:

```bash
cd deploy
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init && terraform apply
```

Everything runs on a single EC2 instance (~$17/month). See [deploy/README.md](deploy/README.md) for full docs.

## Architecture
- **API (`apps/api`)**: Express with CORS, rate limiting, JWT auth, and Zod validation. Socket.IO handles real-time room/vote events.
- **Web (`apps/web`)**: React 19 + Vite + Tailwind. Zustand stores manage auth, rooms, and vote state.
- **Shared (`packages/shared`)**: Socket event types, DTOs, and validation schemas shared between API and Web.
- **E2E (`e2e`)**: Playwright tests covering auth, rooms, voting, and production smoke tests.

## Contributing
1. Create a feature branch
2. Run `pnpm lint` and `pnpm test` before pushing
3. Submit a PR -- CI will run all 81 tests automatically

## License

Copyright 2025 **Mani Movassagh Ghazani**

This project is licensed under the **GNU Affero General Public License v3.0** -- see the [LICENSE](LICENSE) file for details.

Free for individuals and open-source projects. Organizations running this as a service must open-source their modifications or obtain a commercial license.
