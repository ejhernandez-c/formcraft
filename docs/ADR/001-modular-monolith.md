# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Context
Formcraft needs clear internal domain boundaries (auth, forms, responses, analytics, etc.) but is an early-stage, small-scope product with an evolving domain model. A microservices split would require settling service boundaries, inter-service contracts, and distributed-transaction handling (e.g. for capacity enforcement) before the domain itself has stabilized.

## Decision
Build a single deployable FastAPI backend and single deployable React frontend, with strict internal module boundaries (`auth`, `users`, `forms`, `form_builder`, `publishing`, `respondents`, `responses`, `analytics`, `templates`, `sharing`, `common`). Each module owns its own service logic and data access; cross-module calls go through a module's public service interface only.

## Alternatives considered
- **Microservices from day one** — rejected. Operational overhead (deployment, service discovery, distributed tracing, network-boundary error handling) is not justified by current scale, and the domain is still evolving — premature service boundaries would likely be wrong boundaries.
- **Unstructured monolith (no internal module discipline)** — rejected. Without enforced boundaries, a small team under time pressure tends toward cross-cutting coupling that makes any future extraction (or even confident local reasoning) far harder.

## Consequences
- Single deployment pipeline, single database connection pool, simpler local development (`docker-compose` brings up the whole system).
- Capacity enforcement and other cross-entity invariants can use real database transactions instead of distributed-transaction patterns (sagas, 2PC) — directly enables the correctness guarantee in ADR-003.
- A module can be extracted into its own service later if a real scaling or team-ownership need appears — the interface boundary already exists, so extraction is a deployment change, not a rewrite.
- Requires discipline (code review) to keep modules from reaching into each other's models/repositories directly, since nothing prevents that at the language level.

## Rationale (interview framing)
Correctness: transactions stay local, simplifying capacity/duplicate-email invariants. Maintainability: module boundaries without service-call overhead. Operational complexity: one deployable, not N. Cost: no per-service infra multiplication. Developer experience: local dev stays simple. Revisit if: a specific module's load, team ownership, or deployment cadence genuinely diverges from the rest of the system.
