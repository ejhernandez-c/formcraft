# Formcraft — Security Architecture

## 1. Threat model summary

Two trust boundaries:
- **Creator surface** (`/api/...`) — authenticated via Cognito-issued JWT; risk is authorization bypass (acting on another creator's form) and credential/session handling.
- **Public surface** (`/api/public/...`) — no authentication by design; risk is abuse (scripted floods, capacity-check races, bot spam), injection, and data exposure to a fully untrusted caller.

Every requirement below maps to CLAUDE.md §37–§39, §67–§70.

## 2. Authentication

AWS Cognito user pool. Providers: Google (federated OIDC) and native email/password, at MVP. Apple deferred pending a Phase 0/1 implementation-cost decision; Microsoft explicitly deferred (CLAUDE.md §22).

FastAPI verifies the Cognito-issued JWT (`id_token`) against the user pool's JWKS on every authenticated request via a shared dependency (`get_current_user`). No custom session/token issuance — Cognito is the source of truth for creator identity. On first successful verification, the backend upserts a `User` row keyed by `cognito_sub` (see `docs/DATABASE.md`).

**Local-dev stand-in (Phase 2):** no Cognito user pool is provisioned yet. `app/core/config.py:auth_mode` resolves to `"local"` whenever `COGNITO_USER_POOL_ID`/`COGNITO_APP_CLIENT_ID`/`COGNITO_REGION` are blank, which is only ever allowed when `ENVIRONMENT=local` — the app refuses to start otherwise (`app/main.py`). In that mode, `POST /api/auth/dev-login` (only mounted in local mode) issues a self-signed HS256 token for any email/name the caller supplies, and `get_current_user` verifies it the same way it verifies a Cognito RS256 token, converging on the same `TokenPayload` shape either way. This exists purely so Phase 2+ is testable end-to-end without a live AWS account; switching to a real pool is a configuration change, not a code change — see `backend/app/core/security.py`.

Respondent access requires no authentication at all (CLAUDE.md §23) — this is separate from, and never shares code paths with, creator authentication.

## 3. Authorization

Authentication is necessary but not sufficient. Every creator-facing endpoint that touches a specific form runs an explicit ownership check in the service layer before reading or mutating anything:

```
GET/PUT/DELETE /api/forms/{id}
GET            /api/forms/{id}/responses
... every /api/forms/{id}/** route
```

A form ID that exists but belongs to someone else returns `404` (not `403`) — this avoids confirming a resource's existence to a caller who has no business knowing about it. There is no "trust the ID" shortcut anywhere in the creator API; see `docs/API.md`.

## 4. Public endpoint hardening

`GET /api/public/forms/{slug}` and `POST /api/public/forms/{slug}/responses`:

- **Rate limiting** — per-IP (and/or per-slug) request throttling. MVP approach: application-level limiter (e.g. token bucket keyed by IP+slug) as a defense-in-depth layer; edge-level rate limiting (CloudFront/WAF) is the primary control and is finalized in `docs/ARCHITECTURE.md` §AWS Architecture / Phase 8.
- **Payload limits** — request body size capped well below any reasonable form-answer payload; oversized requests rejected before full parsing.
- **Bot/abuse detection** — lightweight, proportionate to exposure (e.g. honeypot field, submission-timing heuristic) for MVP; CAPTCHA-grade protection is a Phase 8/hardening decision, not built by default into every form.
- **Safe error messages** — a public 500 never includes exception detail; a public 404 never distinguishes "no such form" from "not published" beyond generic wording.
- **No PII on read** — `GET /api/public/forms/{slug}` returns only what's needed to render the form (structure, theme, accepting-responses state) — never other respondents' data, never response statistics.

## 5. Input handling

- All input validated server-side via Pydantic — client-side (Zod) validation is UX only, never trusted as the boundary (CLAUDE.md §67).
- SQL access exclusively through SQLAlchemy's parameterized query construction — no raw string-built SQL, anywhere.
- User-supplied rich text (form titles, instructions, question labels) is escaped/sanitized on render in the frontend (React's default JSX escaping covers most of this; anything rendered as raw HTML — e.g. a future rich-text instruction block — requires an explicit sanitizer, not `dangerouslySetInnerHTML` on raw input).
- File upload is out of MVP scope (CLAUDE.md §71); when it lands, it gets its own security review (content-type validation, size limits, virus scanning consideration, S3 signed-URL upload pattern) before implementation — not designed here.

## 6. Privacy

- Respondent answers are not logged as part of normal application/request logging — logs capture operational metadata (form ID, response ID, status codes, timing), not answer content.
- `FormResponse.ip_hash` stores a salted hash of the submitting IP, not the raw address — enough for basic abuse/duplicate heuristics without retaining a directly identifying value long-term.
- Anonymous and identified response paths are structurally distinct (`Respondent` row is `NULL` for anonymous — see `docs/DATABASE.md` §2.4), preventing an anonymous response from ever accidentally carrying identifying fields.
- No cross-form respondent profile is built or exposed (CLAUDE.md §11 lists `Respondent` per-form, not globally — see ADR discussion in `docs/DATABASE.md`).

## 7. Secrets & environment separation

- `.env`, credentials, private keys, tokens, passwords, and AWS secrets are never committed. `.env.example` ships with placeholder values only, and is the up-to-date contract for required variables (owned jointly with `devops`).
- local / development / staging / production are fully separate: separate databases, separate Cognito app clients (or user pools), separate secrets. No environment ever reads another environment's credentials.
- Production secrets resolve through an AWS secret/config service (finalized in `docs/ARCHITECTURE.md` §AWS Architecture), not plain environment variables baked into an image.

## 8. Transport & headers

HTTPS enforced everywhere (terminated at CloudFront/ALB, no plaintext HTTP path in any environment beyond local dev). Standard secure headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`/frame-ancestors CSP, `Referrer-Policy`) applied at the API and CDN layer. CSRF protection is evaluated in Phase 2 against the actual auth-token transport chosen (bearer-token APIs typically don't need CSRF tokens the way cookie-session APIs do — this is confirmed once the Cognito token flow is implemented, not assumed here).

## 9. Capacity & duplicate-prevention as a security-adjacent concern

The transactional capacity/duplicate-email mechanism (owned in detail by `docs/DATABASE.md` §2.6 and ADR-003) is also a security control: a naive count-then-insert isn't just a business-rule bug, it's a race an attacker can trigger deliberately by firing concurrent requests to force over-capacity registrations. The chosen locking approach closes that abuse vector as a side effect of correctness.

## 10. Explicitly deferred (not MVP, tracked for later phases)

WAF rules beyond baseline rate limiting, CAPTCHA, verified respondent identity, file-upload security review, full audit logging, SOC2-grade compliance tooling. None of these are precluded by the MVP design.
