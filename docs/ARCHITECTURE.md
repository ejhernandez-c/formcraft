# Formcraft — System Architecture

## 1. Architectural style — modular monolith

Single deployable FastAPI backend, single deployable React frontend, clear internal domain boundaries. No microservices at MVP (see ADR-001).

Backend modules:

```
auth · users · forms · form_builder · publishing
respondents · responses · analytics · templates · sharing · common
```

Each module owns its own service logic and data access; other modules call it through its service interface, never through its models/repositories directly. A module is extractable into its own service later *if* a real need appears — not built for that eventuality today.

## 2. Backend layering

```
API layer (FastAPI routes)
    ↓  authenticate, validate, call service, return response
Application/service layer
    ↓  orchestration, transactions
Domain/business logic
    ↓  rules: capacity, publish/draft isolation, duplicate-email, form-type-agnostic engine
Data access (SQLAlchemy 2.x repositories per module)
    ↓
Infrastructure (PostgreSQL, S3, SQS, Cognito)
```

Route handlers never contain business rules. This is enforced by convention/review, not tooling, at MVP scale.

## 3. Frontend architecture

Feature/domain-oriented, not a flat component pile:

```
frontend/
├── src/
│   ├── app/                # routing, providers, app shell
│   ├── components/         # shared/generic UI (shadcn/ui-based)
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── builder/
│   │   ├── public-form/    # ADDED — respondent-facing surface, see §3.1
│   │   ├── responses/
│   │   ├── analytics/
│   │   ├── templates/
│   │   └── sharing/
│   ├── hooks/
│   ├── lib/
│   ├── services/            # typed API clients
│   ├── schemas/              # Zod, mirrored from backend Pydantic where practical
│   ├── i18n/
│   └── types/
```

No global state management by default — local/component state plus a server-state pattern (see §3.2) where a real cross-component caching need exists.

### 3.1 `features/public-form/` — flagged addition

CLAUDE.md §8's example structure doesn't list a distinct `public-form` feature area. Given the respondent surface is explicitly a *different* experience from the builder/dashboard (mobile-first, unauthenticated, different design priorities per `docs/UX.md`), it gets its own feature folder rather than living inside `forms/` alongside creator-facing form management. Flagged for confirmation in §7.

### 3.2 Server-state library — `@tanstack/react-query`, approved in Phase 2

CLAUDE.md's frontend stack list does not include a data-fetching/cache library, so this was flagged for explicit approval rather than adopted silently (§65/§3). **Approved at the start of Phase 2**, ahead of the dashboard's list-refresh-after-mutation needs (create/publish/close/archive/duplicate a form). Small, actively maintained, directly solves request de-dupe and cache invalidation after a mutation instead of every feature hand-rolling fetch/loading/error state.

## 4. Domain model & database

Full schema, ERD, and every data-integrity/indexing decision: `docs/DATABASE.md`. Summary of entities: `User`, `Form`, `FormSection`, `FormElement` (proposed generalization of `FormQuestion` — see `docs/DATABASE.md` §2.1), `QuestionOption`, `Respondent`, `FormResponse`, `ResponseAnswer`.

## 5. Form lifecycle & versioning

`DRAFT → PUBLISHED → CLOSED → ARCHIVED`. Draft edits never silently change what's published — enforced via a publish-time JSONB snapshot (`Form.published_snapshot`), not a parallel relational tree or full version-history table. Full rationale and alternatives considered: ADR-006.

## 6. Capacity enforcement strategy

Capacity **must** be server-side, transactional, and race-free — CLAUDE.md §27 is explicit that a naive count-then-insert is unacceptable. Chosen mechanism: row-lock the `Form` row (`SELECT ... FOR UPDATE`) at the start of the response-submission transaction, `COUNT(*)` current `registered` responses for that form within the lock, then insert-or-reject before commit — releasing the lock. This serializes concurrent submissions *per form* only (no cross-form contention) and avoids denormalized-counter drift across cancellations. Full tradeoff discussion (vs. an atomic conditional-UPDATE counter): ADR-003.

Duplicate-email prevention uses the same transaction (one lock, two checks) plus a database-level partial unique index as a backstop — see `docs/DATABASE.md` §2.6.

"Automatic closure" at capacity or `close_at` does **not** require a background job: accepting-state is computed at read/submit time from `status` + `open_at`/`close_at` + live capacity count. Introducing a scheduled job to flip a `status` column would be exactly the kind of unjustified background processing CLAUDE.md §46 warns against — checking a timestamp/count per request is trivial.

## 7. AWS architecture

```
Internet → CloudFront
             ├─→ S3 (React app, static)
             └─→ API (FastAPI on ECS/Fargate)
                    ├─→ PostgreSQL (RDS, see §7.1)
                    ├─→ S3 (uploaded/generated assets — exports, logos, QR images)
                    └─→ SQS (background jobs: large CSV export, future email notifications)
```

Cognito sits alongside as the identity provider for the creator app (not diagrammed as a data-flow node — it's a token-issuing side channel the API verifies against).

### 7.1 Database hosting — RDS PostgreSQL (standard), not Aurora, at MVP

Aurora PostgreSQL offers better scale-out and failover characteristics; RDS PostgreSQL (single instance, Multi-AZ optional) has a materially lower baseline cost and simpler operational model, and MVP traffic does not justify Aurora's premium. Same engine, same SQL dialect — migrating to Aurora later is a hosting change, not a schema/application change, if scale ever demands it. Full rationale: ADR-004.

### 7.2 Compute — ECS/Fargate over Lambda, per CLAUDE.md default

No Phase 0 finding overrides the CLAUDE.md default (favor ECS/Fargate unless a strong reason for Lambda emerges). FastAPI as a long-running container process is simpler to reason about for this workload (moderate, fairly steady request volume; no sharply spiky/idle-heavy traffic pattern that would favor Lambda's pay-per-invocation model) — revisit only if real traffic data says otherwise.

### 7.3 Environments

`local` (Docker Compose), `development`, `staging`, `production` — separate AWS accounts or, at minimum, fully separate resource sets (DB, Cognito app client, S3 buckets, secrets) per non-local environment. No shared database or secret across environments, ever.

## 8. Project structure (top-level)

```
/
├── frontend/
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI app factory
│       ├── core/                   # config, db session, security/auth deps
│       └── modules/
│           ├── auth/
│           ├── users/
│           ├── forms/
│           ├── form_builder/
│           ├── publishing/
│           ├── respondents/
│           ├── responses/
│           ├── analytics/
│           ├── templates/
│           ├── sharing/
│           └── common/
│       # each module: router.py, service.py, models.py, schemas.py, repository.py
├── tests/                          # cross-cutting/E2E (Playwright); unit tests colocated in frontend/backend
├── docs/
├── infrastructure/                 # IaC — tool choice open, see §9
├── scripts/
├── .github/                        # CI workflows
├── CLAUDE.md
├── README.md
├── docker-compose.yml
└── .env.example
```

Repository scaffolding itself is a Phase 1 deliverable — this section documents the *target* structure only; nothing under `frontend/`, `backend/`, `infrastructure/`, etc. is created in Phase 0.

## 9. Risks, Assumptions & Open Questions

Items below need explicit developer confirmation before or during Phase 1; each states the default assumption Formcraft will proceed with if not overridden.

1. **`FormElement` naming** (`docs/DATABASE.md` §2.1) — generalizes CLAUDE.md's `FormQuestion` to also host content-only blocks. *Default: proceed with `FormElement`.*
2. **`features/public-form/` frontend folder** (§3.1) — addition beyond CLAUDE.md's example structure. *Default: include it; the respondent surface is materially different enough to warrant its own feature area.*
3. **`@tanstack/react-query` as a new frontend dependency** (§3.2) — not in CLAUDE.md's stack list. **Resolved: approved in Phase 2.**
4. **Duplicate-email database constraint can't be conditional on `Form.one_response_per_email`** (`docs/DATABASE.md` §2.6) — the partial unique index is always-on once an email is present; the *business rule* toggle is enforced in the service layer. *Default: proceed as designed; a form that disables the rule after collecting responses simply can't have the DB-level backstop selectively relaxed for that form without a more complex per-form trigger, which is not justified at MVP scale.*
5. **No hard-delete endpoint for forms** (`docs/API.md` §2) — CLAUDE.md's dashboard actions don't list Delete. *Default: Archive is the terminal state; hard delete can be added later if requested.*
6. **RDS PostgreSQL over Aurora at MVP** (§7.1, ADR-004). *Default: RDS, standard instance, Multi-AZ optional per environment/cost decision in Phase 1/8.*
7. **CSV export sync-vs-async threshold** (`docs/API.md` §2) — exact response-count threshold where export moves from synchronous to SQS-backed async isn't fixed yet; depends on real payload-size testing in Phase 6. *Default: implement synchronous first in Phase 6, add the async path only if a real dataset proves it necessary.*
8. **IaC tool for `infrastructure/`** (§8) — Terraform vs. AWS CDK not chosen. *Default: decide at Phase 8 (AWS deployment), not blocking Phases 0–7.*
9. **Apple authentication** (CLAUDE.md §22 — "may be included") — not committed to for MVP. *Default: Google + email only in Phase 2; Apple revisited if requested.*

None of the above block starting Phase 1 — they're either non-breaking defaults or decisions naturally deferred to the phase that needs them.
