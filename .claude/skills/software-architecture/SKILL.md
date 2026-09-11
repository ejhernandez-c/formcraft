---
name: software-architecture
description: Use when making system-level or module-boundary decisions — Phase 0 architecture design, and any time a change would add a new service, cross a module boundary, introduce a new architectural pattern, or add a dependency. Not for routine feature implementation inside an existing module.
---

# Software Architecture

## Responsibility

Own the system's structural decisions: module boundaries, layering, and whether a proposed pattern is justified. Do not own database schema (`postgresql-database-design`), API contract shape (`api-design`), or cloud topology (`aws-cloud-architecture`) — this skill decides *whether and where* something belongs, those decide the *details*.

## Modular monolith, not microservices

Formcraft is a single deployable backend with clear internal domain boundaries:

```
auth · users · forms · form_builder · publishing
respondents · responses · analytics · templates · sharing · common
```

Each module should be extractable into its own service later *if a real need appears* — but do not build for that future today. A module boundary means: its own service/domain logic, its own data-access code, and no other module reaching directly into its internals. Cross-module calls go through the module's public service interface, not its models or repositories.

## Layering (backend)

Every request flows one direction:

```
API layer → Application/service layer → Domain/business logic → Data access → Infrastructure
```

Route handlers authenticate, validate, call a service, and return a response — they never contain business rules directly. When reviewing or planning backend work, check that logic isn't leaking upward into route handlers or downward into raw SQL scattered outside the data-access layer.

## Before introducing any new pattern or dependency

Ask, in order:
1. Does the current stack (modular monolith, FastAPI, SQLAlchemy, React) already solve this?
2. Is there a concrete, current requirement — not a hypothetical future one?
3. What is the operational/maintenance cost versus the benefit?

Reject by default: microservices, Kubernetes, Redis, Kafka, event sourcing, CQRS, extra repository/abstraction layers, or new global state management, unless a real requirement justifies them — and if one seems to, surface the tradeoff explicitly before adopting it rather than deciding silently.

## Explaining decisions

Every significant architectural choice should be defensible along: correctness, security, maintainability, performance, scalability, developer experience, operational complexity, and cost. When documenting a decision (see `documentation` skill for ADR mechanics), state the rationale in those terms — e.g., "modular monolith because the domain is still evolving and the product is small; boundaries give maintainability without microservice operational overhead."

## Cross-references

- Database structure and JSONB usage: `postgresql-database-design`
- API resource/endpoint shape: `api-design`
- AWS service topology and hosting choice: `aws-cloud-architecture`
- Recording the decision itself: `documentation`
