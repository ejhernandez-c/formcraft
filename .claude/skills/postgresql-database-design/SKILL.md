---
name: postgresql-database-design
description: Use when designing or modifying the database schema, domain model, ERD, migrations, or indexes — Phase 0 schema design, and any time a table, column, relationship, constraint, or index changes in later phases.
---

# PostgreSQL Database Design

## Responsibility

Own the relational schema: table design, relationships, JSONB usage, constraints, indexing, and migration hygiene. Does not own API request/response shapes (`api-design`) or business-rule enforcement logic itself (`backend-development`) — though it owns the *constraints* that back those rules at the data layer.

## Relational core + JSONB for flexibility, not for everything

Core entities are relational tables with real foreign keys:

```
User → Form → FormSection → FormQuestion → QuestionOption
Respondent → FormResponse → ResponseAnswer
```

Use JSONB only for genuinely flexible, control-specific configuration — e.g. a rating question's `{"min": 1, "max": 5, "allow_half": false}`. Do not:
- create one column per question, or one table per control type,
- store an entire form as a single JSON blob,
- default to JSONB when a proper column/relationship would do,
- duplicate business logic into database triggers.

Every question row has a generic shape: `control_type`, `settings` (JSONB), `validation` (JSONB) — one table for all control types, not N tables.

## Data integrity is enforced in the schema, not just in code

Use foreign keys, `NOT NULL`, `UNIQUE`, and `CHECK` constraints wherever the invariant is real — e.g. a unique index on `(form_id, respondent_email)` when "one response per email" is enabled, not just an application-level check. Application code should not be the only thing standing between the database and an invalid state.

## Indexing — based on access patterns, not blanket coverage

Likely-needed indexes: form owner, form slug (public lookup), form status, response→form_id, response submission timestamp, question↔response relationships, respondent email (when identification is enabled). Add an index because a real query needs it, not preemptively on every column.

## Migrations

Alembic, always. Every schema change ships a migration — never hand-edit a production schema. Migrations must be reviewable, reversible where practical, and exercised by tests before merge.

## Public identifiers

Internal primary keys may be UUIDs. Anything exposed in a public URL (e.g. `/f/8Kx72LmQ`) must be a separate opaque, non-sequential identifier — never let a sequential internal ID leak into a public path.

## Cross-references

- Business rules that these constraints back (e.g. capacity enforcement transaction pattern): `backend-development`
- Whether a field belongs in the request/response contract: `api-design`
- Data-model extensibility for future entities (waitlist, organizations, etc.): don't implement early, but don't design in a way that blocks them later — see `software-architecture` for the "no premature build-out" boundary.
