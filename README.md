# Formcraft

A simple, professional, mobile-first platform for creating digital forms,
collecting responses, managing registrations, and understanding results.
Spanish-first, i18n-ready. See [`docs/PRD.md`](docs/PRD.md) for the full
product scope and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the
system design.

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React
  Hook Form, Zod, React Router, Recharts. Vitest + React Testing Library.
- **Backend** — Python, FastAPI, Pydantic, SQLAlchemy 2.x, Alembic. Pytest.
- **Database** — PostgreSQL.

## Project structure

```
/
├── frontend/       React app
├── backend/        FastAPI modular-monolith API
├── docs/           PRD, architecture, database, API, security, ADRs
├── infrastructure/ IaC (populated starting Phase 8)
├── scripts/
├── docker-compose.yml
└── .env.example
```

Full structure and module boundaries: `docs/ARCHITECTURE.md` §3 and §8.

## Running locally

### Option A — Docker Compose (whole stack)

```sh
cp .env.example .env   # fill in real values if needed; local defaults work out of the box
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at `/docs`, health check at `/health`)
- PostgreSQL: localhost:5432

Apply database migrations (once, or after a new migration is added):

```sh
docker compose exec backend alembic upgrade head
```

### Signing in locally

No AWS Cognito user pool is provisioned yet. With `COGNITO_USER_POOL_ID`/`COGNITO_APP_CLIENT_ID`/`COGNITO_REGION` left blank (the `.env.example` default), the backend falls back to a local-only dev-login: open http://localhost:5173, and the login page's email/name form signs you in without a password. See `docs/SECURITY.md` §2.

### Option B — Run services individually

**Backend**

```sh
cd backend
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on macOS/Linux
pip install -e ".[dev]"
alembic upgrade head          # requires a running PostgreSQL — see docker-compose.yml
uvicorn app.main:app --reload
```

**Frontend**

```sh
cd frontend
npm install
npm run dev
```

## Quality gates

| | Command (run from `backend/` or `frontend/`) |
|---|---|
| Backend lint | `ruff check .` |
| Backend format | `ruff format .` |
| Backend types | `mypy app` |
| Backend tests | `pytest` |
| Frontend lint | `npm run lint` |
| Frontend format | `npm run format:check` |
| Frontend types | `npm run typecheck` |
| Frontend tests | `npm run test` |

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/DATABASE.md`](docs/DATABASE.md) — schema, ERD, indexing
- [`docs/API.md`](docs/API.md) — REST API conventions and endpoints
- [`docs/SECURITY.md`](docs/SECURITY.md) — security architecture
- [`docs/UX.md`](docs/UX.md) — UX architecture
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — testing strategy and roadmap
- [`docs/ADR/`](docs/ADR/) — architecture decision records
- [`docs/PHASES/`](docs/PHASES/) — per-phase delivery record
