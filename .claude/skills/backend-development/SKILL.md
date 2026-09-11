---
name: backend-development
description: Use when implementing FastAPI backend features — services, business logic, form/response handling, capacity enforcement, background jobs — across Phases 1, 2, 3, 5, 6, 7. Not for schema design itself (postgresql-database-design) or endpoint contract shape (api-design).
---

# Backend Development

## Responsibility

Own the implementation of business logic inside the layered backend: services, domain rules, and orchestration between the API layer and the data layer. Assumes `api-design` has defined the contract and `postgresql-database-design` has defined the schema — this skill is about what happens *inside* a handler's call chain.

## Layering discipline

`API layer → service/application layer → domain logic → data access → infrastructure`. Route handlers stay thin: authenticate, validate, call a service, return. If you're writing a business rule (a `if`/`else` that decides something about a form, response, or capacity) directly in a route handler, it belongs in the service layer instead.

## Form types are templates, not engines

Survey, Event Registration, Registration Form, Application/Request, and Blank Form all run through the *same* form engine and the *same* generic question model (`control_type` + `settings` + `validation`). Never special-case behavior based on `form_type` — a "survey" is free to contain a rating question and an "event registration" is free to collect free text. `form_type` is a template/labeling concern, not a branch point in business logic.

## Capacity enforcement — critical, always transactional

This is the one business rule the codebase must never get wrong. Never implement capacity as a separate count-then-insert:

```
SELECT COUNT(*) → if count < max → INSERT   # WRONG: race condition
```

Two concurrent requests can both pass the check before either inserts, producing `21/20`. Use a PostgreSQL transactional/locking mechanism (e.g. `SELECT ... FOR UPDATE` on a capacity row, or an atomic conditional update) so that under concurrent registration attempts, accepted registrations never exceed capacity — full stop. This rule has mandatory test coverage; see `testing`.

## Business logic wins over client state, always

Never trust a count, a validation result, or an authorization decision computed in the browser. The backend recomputes and re-checks everything server-side, even when the frontend already showed "2 spaces remaining" or disabled a button. Treat all client-supplied state (hidden fields, disabled controls, cached counters) as advisory UI only.

## Background processing

Use SQS for work that doesn't need to block the HTTP response — CSV/Excel generation, large exports, notification email, heavy analytics processing. Don't introduce a queue for something that's fast and synchronous; that's queue overhead without benefit.

## Data integrity in application code

Rely on the database constraints from `postgresql-database-design` as the source of truth; application-level checks are a UX nicety (better error messages) layered on top, not a substitute for the constraint.

## Cross-references

- Endpoint shape / error envelope: `api-design`
- Schema, constraints, indexing behind these operations: `postgresql-database-design`
- Ownership/permission checks: `authentication-authorization`
- Capacity concurrency test scenarios: `testing`
- Rate limiting / input sanitization on public endpoints: `security`
