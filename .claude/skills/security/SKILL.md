---
name: security
description: Use for cross-cutting security review — public endpoint hardening, input sanitization, XSS/SQL-injection prevention, secrets management, privacy — Phase 0 threat modeling and Phase 8 hardening, and whenever a public-facing endpoint or respondent data handling changes.
---

# Security

## Responsibility

Own the cross-cutting security posture: what protects public endpoints from abuse, what prevents injection/XSS, how secrets are managed, and privacy handling of respondent data. Capacity-as-a-business-invariant lives in `backend-development`; authz/ownership checks live in `authentication-authorization`; public opaque IDs live in `postgresql-database-design` — this skill covers what's left: the OWASP-style perimeter and data-handling concerns.

## Baseline requirements

HTTPS everywhere; server-side validation on every input (never trust client-side validation alone); rate limiting; input sanitization; XSS prevention; SQL-injection prevention (parameterized queries via SQLAlchemy — never string-built SQL); CSRF protection where applicable; secure response headers; request size limits; secure file handling once file upload exists; bot protection on public forms where appropriate; privacy-conscious logging; proper secrets management (never hardcoded, never committed).

## Public endpoints need extra scrutiny

`GET /public/forms/{slug}` and `POST /public/forms/{slug}/responses` are untrusted by definition — anyone with the link can hit them. Beyond normal validation, apply: rate limiting per IP/session, abuse/bot detection appropriate to the form's exposure, strict payload size limits, and safe error messages that reveal nothing about internal structure (no SQL errors, no stack traces, no "no such column" leaks) to the public API surface.

## Privacy

The platform collects names, emails, phone numbers, survey answers, and registration data. Don't log respondent answers unless there's a genuine operational need — application logs are not a place for PII by default. Never expose respondent information through a public API response (e.g. a public results endpoint should never leak other respondents' identifying data). Keep anonymous and identified response semantics cleanly separated — an "anonymous" response must never end up carrying identifying fields because of a shared code path with "identified" responses.

## Secrets and environments

Never commit `.env`, credentials, private keys, tokens, passwords, or AWS secrets. Provide `.env.example` with placeholder values. Use environment variables plus the appropriate AWS secret/config service per environment (local/dev/staging/production) — see `aws-cloud-architecture` for the service choice itself.

## Cross-references

- Ownership/permission checks per request: `authentication-authorization`
- Transactional capacity enforcement (a business-invariant issue, but also prevents abuse via race conditions): `backend-development`
- Opaque, non-sequential public identifiers: `postgresql-database-design`
- Structured, safe API error envelope: `api-design`
