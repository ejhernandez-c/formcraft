# Phase 1 — Foundation

Status: Complete, awaiting developer approval.

## Deliverables

| Deliverable | Where |
|---|---|
| Repository structure | root, `backend/`, `frontend/` — matches `docs/ARCHITECTURE.md` §8 |
| React + TypeScript + Vite | `frontend/` |
| Tailwind CSS + shadcn/ui | `frontend/src/index.css`, `frontend/components.json`, `frontend/src/components/ui/` |
| FastAPI | `backend/app/main.py` |
| PostgreSQL | `docker-compose.yml` (service `db`), schema in `backend/app/modules/*/models.py` |
| Docker | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| Environment configuration | `.env.example`, `backend/app/core/config.py`, Vite `import.meta.env` |
| SQLAlchemy | `backend/app/core/db.py`, module `models.py` files |
| Alembic | `backend/alembic/`, initial migration `0001_initial_schema.py` |
| Health endpoint | `GET /health`, `GET /health/db` — `backend/app/modules/common/router.py` |
| Frontend/backend connectivity | `frontend/src/services/api.ts` + `useHealthCheck` hook, rendered in `App.tsx`; verified live (see §9 below) |
| Linting/formatting | Ruff + MyPy (backend), ESLint + Prettier (frontend) |
| Initial tests | `backend/tests/test_health.py`, `frontend/src/app/App.test.tsx` |

No form/user/response business logic, no auth, no API routes beyond health — those are Phase 2+.

## Notes for next phase

- The 8 SQLAlchemy models (data layer only, no services/routers yet) already match `docs/DATABASE.md` exactly, including the ADR-005 `FormElement` generalization and the ADR-006 publish-snapshot column — Phase 2/3 can build services directly against this schema without a migration rewrite.
- `@tanstack/react-query` (flagged as a proposed addition in `docs/ARCHITECTURE.md` §3.2) was **not** added — the health-check hook uses plain `fetch` + a custom hook, per the documented fallback. Revisit when Phase 2/3's dashboard/builder data-fetching needs (cache invalidation after mutations, etc.) make the case concretely.
- i18n is a minimal, dependency-free `t(key)` helper (`frontend/src/i18n/`) rather than `react-i18next` — sufficient for Phase 1's one string set; flag for upgrade once pluralization/interpolation/multiple locales are actually needed.
- `frontend/src/features/*` subfolders (auth, dashboard, forms, builder, public-form, responses, analytics, templates, sharing) were **not** pre-created empty — they'll be added starting Phase 2 as each gets real content, consistent with "no half-finished implementations."
