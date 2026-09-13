# Phase 2 — Authentication & Dashboard

Status: Complete, awaiting developer approval.

## Deliverables

| Deliverable | Where |
|---|---|
| Cognito (production path, JWKS RS256 verification) | `backend/app/core/security.py` |
| Google / email authentication | Cognito Hosted UI (not wired — no pool provisioned, see Known Limitations) + local dev-login stand-in (`POST /api/auth/dev-login`) as the email-auth equivalent |
| Protected routes | `frontend/src/features/auth/ProtectedRoute.tsx` |
| User profile | `GET /api/users/me`, `backend/app/modules/users/`, shown in `AppLayout` header |
| Dashboard | `frontend/src/features/dashboard/` |
| Form CRUD | `backend/app/modules/forms/` (service/router/schemas), `frontend/src/features/forms/FormEditPage.tsx` |
| Form status (publish/close/archive lifecycle) | `POST /api/forms/{id}/publish|close|archive`, dashboard + form-edit lifecycle actions |

No form builder (sections/elements/questions), no public form, no responses — those are Phase 3+.

## Notes for next phase

- **Local-dev auth stand-in.** No Cognito user pool exists yet (developer choice at the start of this phase). The backend's Cognito JWT verification path (`app/core/security.py`) is real and production-ready, but untestable live until a pool is provisioned. `POST /api/auth/dev-login` fills that gap for local development only — see `docs/SECURITY.md` §2. Provisioning Cognito later is a `.env` change, not a code change; the app refuses to start in any non-local environment without it (`app/main.py`).
- **Google login is a visibly disabled placeholder** in `LoginPage.tsx`, not a guessed OAuth redirect — wiring the real Cognito Hosted UI flow needs a hosted UI domain, which doesn't exist until a pool is provisioned.
- **Publish snapshot is structurally real but content-empty.** `POST /forms/{id}/publish` builds `published_snapshot` from the live section/element tree, but that tree can't be populated until Phase 3's builder exists — so today's snapshot always has `sections: []`. The mechanism doesn't need to change once the builder lands.
- **Duplicate only clones metadata**, not a section/element/option tree — same reason, nothing to duplicate yet.
- `@tanstack/react-query` — approved this phase (was flagged pending in Phase 0); used for the dashboard's list-refresh-after-mutation.
- A **Phase 1 bug was found and fixed**: the initial migration created native Postgres `ENUM` types for `form_type`/`status`/`identification_type`/`element_kind`/`response_status`, but the SQLAlchemy models declared these as plain `String` columns — every INSERT failed with a type mismatch. `docs/DATABASE.md` §3 had explicitly left ENUM-vs-CHECK undecided at Phase 1; resolved now as `VARCHAR` + `CHECK`, matching the models. Caught by actually exercising the schema through the ORM against a real Postgres instance (see Tests below) — this could not have been caught by ruff/mypy/offline-SQL-generation alone.
- A second Phase 1 gap was found and fixed: `app/main.py` never imported `app/db_registry.py`, so SQLAlchemy's mapper configuration failed on the first query touching a cross-module relationship (`Form.sections` → `FormSection`). `/health` never exercised this in Phase 1, so it went unnoticed until Phase 2's first real database query.
