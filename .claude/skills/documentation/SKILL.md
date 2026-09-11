---
name: documentation
description: Use when creating or updating project documentation — PRD, architecture docs, ADRs, keeping OpenAPI accurate — Phase 0 documentation set-up and Phase 1 onward whenever a documented decision changes.
---

# Documentation

## Responsibility

Own the project's persistent documentation set and where a given piece of knowledge belongs. Does not own the phase-completion report format or in-conversation file-change reporting — those are process rules defined directly in CLAUDE.md and apply regardless of this skill.

## Documentation set

```
docs/
├── PRD.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── SECURITY.md
├── DEVELOPMENT.md
├── DEPLOYMENT.md
├── UX.md
├── PHASES/
│   ├── PHASE-0.md
│   ├── PHASE-1.md
│   └── ...
└── ADR/
    ├── 001-modular-monolith.md
    ├── 002-postgresql.md
    └── ...
```

Route content to the right file rather than duplicating it across several: schema decisions → `DATABASE.md`, endpoint contracts → `API.md` (plus the live FastAPI-generated OpenAPI schema, which must stay accurate as the executable source of truth), threat model/security posture → `SECURITY.md`, UX intent → `UX.md`.

## Architecture Decision Records

Any significant, hard-to-reverse decision (a new dependency, a module-boundary choice, a chosen tradeoff between alternatives) gets an ADR: numbered, stating the context, the decision, and the consequences/alternatives considered. An ADR is written once a decision is made, not as a running log of exploration — see `software-architecture` for the correctness/security/maintainability/... framing an ADR's rationale should use.

## Keep docs load-bearing, not decorative

A doc that's wrong is worse than no doc — when an implementation detail changes that a doc describes (an endpoint shape, a schema field, a security control), update the doc in the same change, not as separate follow-up work that may never happen.

## Cross-references

- Decision rationale framework for ADRs: `software-architecture`
- API contract accuracy: `api-design`
- Schema documentation content: `postgresql-database-design`
