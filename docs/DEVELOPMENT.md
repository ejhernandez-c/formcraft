# Formcraft — Development, Testing & Roadmap

## 1. Testing strategy

### Backend — Pytest
Cover services, business rules, API endpoints, validation, authorization, database behavior. An endpoint is not "done" until its service-layer logic, its ownership check, and its validation edge cases each have a test — not just a happy-path smoke test.

### Frontend — Vitest + React Testing Library
Cover components, validation, user interactions, form rendering, builder behavior. Prefer asserting observable behavior over implementation detail.

### End-to-end — Playwright
Critical flows: login, create form, edit form, publish form, open public form, submit response, view results, share form, register for an event, reach capacity, attempt registration after capacity.

### Capacity/concurrency testing — mandatory (CLAUDE.md §55)
- Capacity = 1, two simultaneous registration attempts → exactly one succeeds.
- Capacity = 20, current = 19, concurrent requests → accepted registrations never exceed 20.
- Invariant asserted always: `accepted registrations <= capacity`, under real concurrency (parallel transactions), not sequential calls dressed up as concurrent. These tests exercise the transactional mechanism chosen in ADR-003 directly and must be re-run if that mechanism changes.

## 2. Code quality gates

Backend: Ruff (lint), MyPy (types), Pytest (tests). Frontend: ESLint, Prettier, TypeScript, Vitest, Playwright. Both run locally for fast feedback and in CI as an enforced merge gate (Phase 1 sets this up; see `.claude/skills/devops`).

## 3. Environments

`local`, `development`, `staging`, `production` — fully separate databases, secrets, and (where applicable) Cognito app clients. `.env.example` is the maintained contract for required local configuration. No environment reads another's credentials.

## 4. Development roadmap (phases, per CLAUDE.md §60)

| Phase | Scope | Key skills |
|---|---|---|
| 0 | Requirements & architecture (this document set) | software-architecture, postgresql-database-design, api-design, security, ui-ux-product-design, documentation |
| 1 | Foundation — repo scaffold, React/Vite/Tailwind/shadcn, FastAPI, PostgreSQL, Docker, Alembic, health endpoint, lint/format/test wiring | backend-development, frontend-development, postgresql-database-design, testing, devops, documentation |
| 2 | Authentication & dashboard — Cognito, Google/email login, protected routes, user profile, form CRUD, form status | authentication-authorization, backend-development, frontend-development, security, testing |
| 3 | Form builder — sections, content components, questions, controls, properties panel, validation, ordering, autosave, preview | frontend-development, ui-ux-product-design, accessibility, responsive-mobile-design, testing |
| 4 | Themes & public forms — theming, branding, public URLs, publishing, mobile-first public form, previews, thank-you page | frontend-development, responsive-mobile-design, accessibility, ui-ux-product-design, testing |
| 5 | Responses & event capacity — submission, anonymous/identified, duplicate prevention, response limits, capacity, open/close dates, concurrency-safe registration | backend-development, postgresql-database-design, security, testing |
| 6 | Results & analytics — response dashboard, statistics, charts, individual responses, filters, search, CSV export | backend-development, frontend-development, postgresql-database-design, testing |
| 7 | Sharing & templates — QR codes, sharing, templates, duplicate form | frontend-development, backend-development, testing |
| 8 | Production hardening — security/accessibility/performance/mobile/API/DB/authorization/error-handling review, logging, monitoring, AWS deployment, production docs | security, testing, aws-cloud-architecture, devops, accessibility, documentation |

Each phase follows Analyze → Plan → Implement → Test → Review → Document → **STOP**, and requires explicit developer approval before the next phase begins (CLAUDE.md §2).

## 5. Definition of done (per phase)

- Code compiles/runs; lint and type checks pass.
- New business logic has test coverage (unit + integration as appropriate; E2E once the relevant UI exists).
- No known regression in previously completed phases.
- Phase Completion report delivered in the CLAUDE.md §61 format, ending with `STATUS: WAITING FOR APPROVAL`.
