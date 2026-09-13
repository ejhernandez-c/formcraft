# ADR-005: Unified `FormElement` Model for Content Components and Questions

## Status
Proposed — confirm before Phase 3 (form builder implementation)

## Context
CLAUDE.md's core domain model (§11) names `FormQuestion` as an entity but does not name a distinct entity for content components (Heading, Paragraph, Instruction, Image, Divider — §16). Both kinds of block are placed and reordered together on the same builder canvas, within the same section, and both need "insert here, drag to reorder" semantics relative to each other — not two independently-ordered lists that happen to render interleaved.

## Decision
Model both as rows in a single table, `FormElement`, discriminated by `element_kind` (`content` | `question`) and further specialized by `control_type` (e.g. `heading`, `paragraph`, `instruction`, `image`, `divider` for content; `short_text`, `number`, `rating`, etc. for questions). `validation` (JSONB) is only populated/meaningful when `element_kind = question`. `QuestionOption` rows only ever reference question-kind elements.

This generalizes, rather than replaces, CLAUDE.md's `FormQuestion` concept — every "question" CLAUDE.md describes is a `FormElement` with `element_kind = question`.

## Alternatives considered
- **Two separate tables** (`FormContentBlock`, `FormQuestion`) with a shared `order_index` scheme coordinated across both — rejected. Keeping two tables' ordering consistent (a content block inserted between two questions) requires either a shared sequencing table anyway or fragile cross-table order arithmetic, for no benefit over one discriminated table.
- **Keep `FormQuestion` as the literal name, ignore content components as a domain entity, store them as a special "presentational" question variant** — rejected as a naming choice: `FormQuestion` implies something answerable, which is misleading for a Divider. `FormElement` is the more accurate name for the generalized concept; behaviorally identical to the alternative, just clearer.

## Consequences
- One ordering system per section (`FormElement.section_id`, `order_index`) drives both the builder canvas and the public-form render order — no cross-table coordination.
- The generic control-model rule (`control_type` + `settings` + `validation`, CLAUDE.md §17) extends naturally to content components (`settings` covers e.g. an Image block's URL/alt-text; `validation` stays empty/unused).
- Deviates from CLAUDE.md's literal entity name (`FormQuestion` → `FormElement`); flagged explicitly here and in `docs/ARCHITECTURE.md` §9 for developer confirmation before Phase 3, per CLAUDE.md §3's change-control expectation that a departure from stated architecture is surfaced, not silently assumed.

## Rationale (interview framing)
Maintainability: one canvas, one ordering model, one generic row shape — matches the "generic question model, no table per type" principle CLAUDE.md already applies to input controls, extended consistently to content components.
