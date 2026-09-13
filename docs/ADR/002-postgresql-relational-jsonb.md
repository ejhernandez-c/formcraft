# ADR-002: PostgreSQL with Relational Core + Targeted JSONB

## Status
Accepted

## Context
Formcraft's form model needs to support ten-plus input control types today and more in the future (Time, Phone, Slider, File Upload, Signature, ...), each with different configuration shapes (a Number control needs min/max/decimals; a Rating control needs min/max/allow_half). A naive relational design would need either a new table per control type or a wide, mostly-null `FormQuestion` table with a column per possible setting across all control types.

## Decision
PostgreSQL. Core entities and relationships (`User`, `Form`, `FormSection`, `FormElement`, `QuestionOption`, `Respondent`, `FormResponse`, `ResponseAnswer`) are real relational tables with foreign keys. Control-specific configuration (`settings`, `validation`) is JSONB on a single generic `FormElement` row shape — one table for every control type, not one table per type.

## Alternatives considered
- **One table per control type** (`ShortTextQuestion`, `NumberQuestion`, `RatingQuestion`, ...) — rejected. Adding a control type would require a new table and new query paths everywhere a "list this form's questions" operation happens; directly contradicts CLAUDE.md §17.
- **Entire form as one JSON document** — rejected. Loses the ability to efficiently query/index/join at the question or response-answer level (needed for analytics aggregation, capacity counts, per-question filtering) and makes partial updates (single question edit) awkward.
- **JSONB for everything, including core relationships** — rejected. `Form.owner_id`, `FormResponse.form_id`, etc. are real, always-present relationships that benefit from foreign-key integrity, joins, and indexing — modeling them as JSONB would sacrifice referential integrity for no benefit.

## Consequences
- Adding a new control type (e.g. future Slider) is a `control_type` enum/string addition plus new `settings`/`validation` shape convention — no schema migration for the table itself, only if a genuinely new relational concept is needed (as with `QuestionOption`, promoted out of JSONB deliberately — see `docs/DATABASE.md` §2.2).
- Aggregation queries for analytics use typed columns (`value_text`/`value_number`) on `ResponseAnswer` rather than JSONB casts, keeping the common "average rating" / "min/max number" queries native SQL.
- Requires discipline to resist the temptation to push more into JSONB "because it's flexible" — anything queried, joined, or aggregated across rows belongs in a real column/table.

## Rationale (interview framing)
Correctness: foreign keys enforce real invariants the app can't silently violate. Performance: native aggregation over typed columns, proper indexing on hot paths (slug lookup, owner listing, response counts). Maintainability: one question table to reason about, not N. Flexibility where it's actually needed: JSONB absorbs per-control variance without schema churn.
