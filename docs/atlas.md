# Product Requirements Document (PRD)

**Product Name:** Gustam Platform
**Repository:** atlas
**Version:** 1.0
**Status:** Final Draft

---

## 1. Vision

Gustam Platform is a **single-user personal productivity ecosystem** consisting of multiple applications that share a single authentication system, backend, database, and design system.

Every feature is developed as a module within the same platform. The user authenticates once to access every application via shared HTTP-only cookies across subdomains.

This is a personal platform — there is no multi-user registration. The sole user account is seeded into the database during setup.

---

## 2. Modules

### Initial Module

- **Cabinet** — Bookmark Manager

### Future Modules

- Expense Tracker
- Notes
- Subscription Tracker
- Calendar
- Habit Tracker
- Reading List
- Password Vault
- Vehicle Maintenance
- Home Inventory

### Subdomain Routing

Each module lives on its own subdomain, all sharing the same backend:

| Module        | URL                        |
| ------------- | -------------------------- |
| Cabinet       | `cabinet.gustam.dev`       |
| Expense       | `expense.gustam.dev`       |
| Notes         | `notes.gustam.dev`         |
| Subscriptions | `subscriptions.gustam.dev` |

---

## 3. Objectives

- Single Sign-On across all subdomains via shared cookies
- Shared user management (single-user, seeded account)
- Shared design system (`packages/ui` with shadcn/ui)
- Shared API with auto-generated typed client (Orval)
- Shared infrastructure (Docker, CI, Cloudflare)
- Independent business modules developed on top of the shared foundation

---

## 4. Architecture

```text
               Cloudflare
                   |
     +-------------+-------------+
     v             v             v
cabinet.dev   expense.dev   notes.dev
(gustam.dev)  (gustam.dev)  (gustam.dev)
     |             |             |
     +-------------+-------------+
                   |
                   v
             api.gustam.dev
                   |
             NestJS API (v1)
                   |
             Prisma ORM
                   |
             PostgreSQL
                   |
             Cloudflare R2
```

### Key Architectural Decisions

| Decision          | Choice                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Monorepo tool     | Turborepo                                                              |
| Package manager   | pnpm                                                                   |
| API location      | `apps/api` inside the monorepo                                         |
| API versioning    | Path-based (`/v1/auth/login`)                                          |
| Response format   | Envelope: `{ success, data, message?, errors? }`                       |
| Primary keys      | UUID v4                                                                |
| Deletion strategy | Soft delete (`deletedAt` timestamp)                                    |
| Token strategy    | HTTP-only secure cookies on `.gustam.dev`                              |
| API client        | Auto-generated from OpenAPI via Orval (TanStack Query hooks)           |
| Error handling    | Global exception filter + transform interceptor                       |

---

## 5. Technology Stack

### Frontend

| Technology       | Purpose                      |
| ---------------- | ---------------------------- |
| Next.js          | App Router, React framework  |
| React            | UI library                   |
| TypeScript       | Type safety                  |
| Tailwind CSS     | Utility-first styling        |
| shadcn/ui        | Component library            |
| TanStack Query   | Server state management      |
| Zustand          | Client state management      |
| React Hook Form  | Form management              |
| Zod              | Schema validation            |
| Lucide React     | Icon library                 |
| Orval            | API client codegen           |
| Vitest           | Unit testing                 |
| Playwright       | E2E testing (future)         |

### Backend

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| NestJS            | API framework               |
| Prisma ORM        | Database ORM                |
| PostgreSQL        | Database                    |
| JWT               | Authentication tokens       |
| Argon2            | Password hashing            |
| class-validator   | DTO validation              |
| class-transformer | DTO transformation          |
| Swagger/OpenAPI   | API documentation           |
| Winston           | Structured logging          |
| nest-winston      | NestJS Winston integration  |
| @nestjs/config    | Environment configuration   |
| Jest              | Unit testing                |
| Supertest         | Integration testing         |

### Infrastructure

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| Turborepo         | Monorepo build orchestrator |
| pnpm              | Package manager             |
| Docker            | Containerization            |
| Docker Compose    | Local dev environment       |
| GitHub Actions    | CI pipeline                 |
| Cloudflare DNS    | DNS management              |
| Cloudflare SSL    | SSL certificates            |
| Cloudflare CDN    | Content delivery            |
| Cloudflare WAF    | Web application firewall    |
| Cloudflare R2     | Object storage              |
| Cloudflare Tunnel | Secure origin connection    |
| Coolify           | Production deployment       |

### Future Infrastructure

- Redis
- BullMQ
- Scheduler

---

## 6. Monorepo Structure

```text
atlas/
├── apps/
│   ├── api/                    # NestJS backend
│   └── cabinet/                # Next.js frontend (first module)
├── packages/
│   ├── ui/                     # Shared shadcn/ui component library
│   ├── api-client/             # Auto-generated API client (Orval)
│   ├── hooks/                  # Shared React hooks
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utility functions
│   ├── eslint-config/          # Shared ESLint configuration
│   └── tsconfig/               # Shared TypeScript configuration
├── docker/                     # Docker and Docker Compose files
├── .github/                    # GitHub Actions CI workflows
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── package.json                # Root package.json
```

> **Note:** The top-level `auth/` and `packages/auth/` from the original PRD have been removed. Auth logic lives inside `apps/api` as a NestJS module. Auth UI (login pages) lives inside each frontend app, sharing components from `packages/ui`.

---

## 7. Authentication

### Overview

The platform uses a centralized authentication system hosted inside `apps/api`. There is **no registration flow** — the sole user is seeded into the database via Prisma seed script.

### Auth Endpoints

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| POST   | `/v1/auth/login`        | Authenticate and set cookies |
| POST   | `/v1/auth/logout`       | Clear auth cookies         |
| POST   | `/v1/auth/refresh`      | Rotate refresh token       |
| POST   | `/v1/auth/forgot-password` | Send password reset (future) |
| GET    | `/v1/auth/me`           | Get current user profile   |

### Token Strategy

- **Access Token**: Short-lived JWT stored in HTTP-only secure cookie
- **Refresh Token**: Long-lived token stored in HTTP-only secure cookie with rotation
- **Cookie Domain**: `.gustam.dev` (shared across all subdomains)
- **Cookie Flags**: `HttpOnly`, `Secure`, `SameSite=Lax`

### Auth UI

Each frontend app includes its own login page, using shared form components from `packages/ui`. There is no dedicated auth app or subdomain.

### Future Auth Features

- Email Verification
- Google OAuth
- GitHub OAuth

---

## 8. Shared Platform Features

The following services are shared by every module:

| Feature          | Description                                      |
| ---------------- | ------------------------------------------------ |
| **User**         | Profile, avatar, preferences                     |
| **Settings**     | Theme, language, notification preferences         |
| **Notifications**| Centralized notification center                  |
| **Activity**     | Platform-wide activity timeline                  |
| **Search**       | Global search across every module                |
| **File Storage** | Shared object storage via Cloudflare R2          |

---

## 9. Development Roadmap

### Phase 1: Platform Foundation

**Goal:** Build the complete shared infrastructure so that any module can be developed independently on top of it.

**Deliverables:**

- [ ] Turborepo + pnpm monorepo setup
- [ ] NestJS API (`apps/api`) with path-based versioning (`/v1/...`)
- [ ] PostgreSQL database with Prisma ORM
- [ ] Prisma schema: `User` + `RefreshToken` models
- [ ] Prisma seed script (admin user)
- [ ] Authentication module (login, logout, refresh, me)
- [ ] HTTP-only cookie-based JWT auth
- [ ] Global exception filter + transform interceptor
- [ ] Response envelope: `{ success, data, message?, errors? }`
- [ ] User module (profile, update)
- [ ] `@nestjs/config` with validated `.env` files
- [ ] Winston logging with `nest-winston`
- [ ] Swagger/OpenAPI documentation
- [ ] `packages/ui` with shadcn/ui components
- [ ] `packages/api-client` with Orval codegen
- [ ] `packages/tsconfig` and `packages/eslint-config`
- [ ] Minimal `apps/cabinet` shell (login page + protected dashboard)
- [ ] Docker Compose (PostgreSQL + API)
- [ ] GitHub Actions CI (lint, type-check, test, build)
- [ ] Jest + Vitest testing infrastructure with baseline tests
- [ ] Health check endpoint

### Phase 2: Cabinet Module

**Deliverables:**

- [ ] Bookmark CRUD
- [ ] Folder CRUD
- [ ] Tags
- [ ] Favorites
- [ ] Archive
- [ ] Search
- [ ] Metadata extraction
- [ ] Import / Export

### Phase 3: Expense Module

**Deliverables:**

- [ ] Categories
- [ ] Transactions
- [ ] Budgets
- [ ] Monthly reports
- [ ] Charts

### Phase 4: Notes Module

**Deliverables:**

- [ ] Rich text editor
- [ ] Markdown support
- [ ] Search
- [ ] Folders
- [ ] AI Summary

### Phase 5: Subscription Module

**Deliverables:**

- [ ] Subscription management
- [ ] Renewal reminders
- [ ] Monthly recurring expenses
- [ ] Analytics

---

## 10. Backend Principles

The backend follows an API-first architecture.

**Rules:**

1. RESTful API design
2. Path-based versioned endpoints (`/v1/...`)
3. Every endpoint documented in Swagger/OpenAPI
4. DTO validation on every input (`class-validator`, `ValidationPipe`)
5. Thin controllers — no business logic
6. Business logic inside services
7. Prisma used only inside service/repository layer
8. Global exception filter for consistent error responses
9. Global transform interceptor for consistent success responses
10. Soft delete by default (`deletedAt` timestamp)
11. UUID v4 for all primary keys

---

## 11. Validation Strategy

| Layer    | Tool                        | Purpose              |
| -------- | --------------------------- | -------------------- |
| Frontend | Zod + React Hook Form       | Client-side validation |
| Backend  | class-validator + ValidationPipe | Server-side DTO validation |

Validation occurs on **both** frontend and backend. Never trust client input.

---

## 12. Database Strategy

| Aspect    | Choice         |
| --------- | -------------- |
| Database  | PostgreSQL     |
| ORM       | Prisma         |
| Migration | Prisma Migrate |
| Seed      | Prisma Seed    |
| IDs       | UUID v4        |
| Deletion  | Soft delete    |

### Phase 1 Models

**User**
```
id          UUID        @default(uuid())
email       String      @unique
password    String      (Argon2 hashed)
name        String
avatar      String?
createdAt   DateTime    @default(now())
updatedAt   DateTime    @updatedAt
deletedAt   DateTime?
```

**RefreshToken**
```
id          UUID        @default(uuid())
token       String      @unique
userId      UUID
expiresAt   DateTime
createdAt   DateTime    @default(now())
```

---

## 13. File Storage

Cloudflare R2 stores:

- User avatars
- Bookmark screenshots
- Bookmark thumbnails
- Attachments

**No files are stored on the application server.**

---

## 14. Security

| Measure               | Implementation                     |
| --------------------- | ---------------------------------- |
| Authentication        | JWT in HTTP-only secure cookies    |
| Token Rotation        | Refresh token rotation on use      |
| Password Hashing      | Argon2                             |
| Transport             | HTTPS only                         |
| Cookies               | HttpOnly, Secure, SameSite=Lax     |
| CORS                  | Whitelisted origins                |
| CSRF Protection       | SameSite cookies + CSRF tokens     |
| Headers               | Helmet                             |
| Rate Limiting          | NestJS throttler + Cloudflare WAF  |
| Input Validation      | class-validator on all DTOs        |

---

## 15. Coding Standards

| Tool                 | Purpose                 |
| -------------------- | ----------------------- |
| TypeScript           | Strict mode enabled     |
| ESLint               | Linting                 |
| Prettier             | Code formatting         |
| Husky                | Git hooks               |
| lint-staged          | Pre-commit linting      |
| Conventional Commits | Commit message format   |

---

## 16. Testing

| Layer    | Tool      | Scope                                    |
| -------- | --------- | ---------------------------------------- |
| Backend  | Jest      | Unit + integration tests                 |
| Backend  | Supertest | HTTP endpoint testing                    |
| Frontend | Vitest    | Unit tests                               |
| Frontend | Playwright| E2E tests (future)                       |

Phase 1 includes testing infrastructure with baseline tests (health check, auth service). Full coverage is not required.

---

## 17. Logging & Monitoring

| Feature         | Implementation              |
| --------------- | --------------------------- |
| Logging         | Winston via `nest-winston`  |
| Log format      | JSON in production, pretty in development |
| Health check    | `GET /v1/health`            |
| Error monitoring| Future                      |
| Analytics       | Future                      |

---

## 18. API Documentation

Every endpoint is documented using Swagger/OpenAPI decorators.

The OpenAPI specification is the **single source of truth** for:
- API documentation (Swagger UI at `/api/docs`)
- Frontend API client generation (Orval → TanStack Query hooks)
- Type definitions shared between frontend and backend

---

## 19. Deployment

### Development

| Service    | Method                  | Port |
| ---------- | ----------------------- | ---- |
| Frontend   | `pnpm dev` (native)     | 3000 |
| API        | Docker Compose          | 4000 |
| PostgreSQL | Docker Compose          | 5432 |

### Production

| Component  | Platform          |
| ---------- | ----------------- |
| Frontend   | Cloudflare / VPS  |
| API        | Coolify + Docker  |
| Database   | PostgreSQL on VPS |
| Storage    | Cloudflare R2     |
| CDN / DNS  | Cloudflare        |

---

## 20. CI Pipeline (GitHub Actions)

Runs on every pull request:

1. **Lint** — ESLint across all packages
2. **Type Check** — `tsc --noEmit` across all packages
3. **Test** — Jest (API) + Vitest (frontend)
4. **Build** — Turborepo build to verify compilation

No continuous deployment in Phase 1.

---

## 21. Definition of Done — Phase 1

The platform foundation is considered complete when:

- [x] Turborepo + pnpm monorepo is functional
- [x] `apps/api` serves NestJS REST API at port 4000
- [x] `apps/cabinet` serves Next.js frontend at port 3000
- [x] PostgreSQL database with Prisma migrations applied
- [x] User seeded via Prisma seed script
- [x] Login/logout/refresh auth flow works end-to-end
- [x] HTTP-only cookies shared across `.gustam.dev`
- [x] Swagger docs accessible at `/api/docs`
- [x] Orval generates typed API client from OpenAPI spec
- [x] `packages/ui` exports shadcn/ui components
- [x] Docker Compose starts PostgreSQL + API
- [x] GitHub Actions CI passes on PR
- [x] Health check endpoint returns 200
- [x] Winston logging configured
- [x] Global error handling produces consistent response envelope

Once Phase 1 is complete, the Cabinet module (Phase 2) can be developed independently on top of this shared foundation.
