# ADR-006: Publish-Time JSONB Snapshot for Draft/Published Isolation

## Status
Accepted

## Context
CLAUDE.md §14 requires that editing a draft never unexpectedly changes the currently published form — publishing is an explicit creator action — and defers the exact versioning mechanism to Phase 0. CLAUDE.md §11 lists `FormVersion` (full version history) only as a *potential future* entity, not required now. These two constraints together mean: some draft/published separation is required immediately, but a full history mechanism is not.

## Decision
The live relational tree (`FormSection` → `FormElement` → `QuestionOption`) is always the **draft** — the builder reads and writes it directly, with no "draft" flag needed since there's only ever one live tree per form. `Form.published_snapshot` (JSONB) holds a serialized copy of that tree as of the most recent publish action, alongside `Form.published_at`. The public form (`GET /api/public/forms/{slug}`) reads exclusively from `published_snapshot`, never from the live relational tree. `POST /api/forms/{id}/publish` re-serializes the current tree into `published_snapshot`, overwriting the previous one.

## Alternatives considered
- **Full `FormVersion` history table** (`id, form_id, version_number, snapshot, published_at`, one row per publish) — the more extensible option, explicitly named in CLAUDE.md's future-entities list. **Not built now** because MVP has no requirement to view/restore prior published versions — only to isolate draft edits from the current published state. Deferred rather than rejected: the snapshot shape is identical, so adding this table later is an additive migration (start appending rows instead of overwriting one column), not a redesign.
- **Parallel relational tree** (duplicate `FormSection`/`FormElement`/`QuestionOption` rows tagged `is_published`) — rejected. Doubles write complexity for every builder mutation (must decide whether to touch draft-only or both trees) and doubles the join complexity of public-form rendering, for a capability (querying the published structure relationally) that MVP doesn't need — the public form only ever needs to render it, which a JSONB blob does directly and efficiently.
- **No draft/published separation; public form always reflects live edits** — rejected outright; directly violates CLAUDE.md §14.

## Consequences
- Public-form load is a single-row read (`published_snapshot`), which is also a deliberate performance win for the highest-traffic path (`docs/DATABASE.md` §6).
- A form with no successful publish yet has `published_snapshot = NULL`; the public route returns "not available" rather than partial/draft content.
- No "this form has unpublished changes" indicator is derivable for free (would require diffing live tree vs. snapshot, or a dirty flag) — acceptable gap for MVP, flagged as a possible Phase 3/4 UX nicety, not a blocker.
- Migrating to full version history later requires no schema change to the snapshot's *shape*, only where it's stored (column → table rows).

## Rationale (interview framing)
Matches CLAUDE.md's own JSONB-for-flexible-content principle (`docs/DATABASE.md`/ADR-002): the published snapshot is exactly the kind of "genuinely flexible, not queried piecemeal" content JSONB is for, since the public form only ever needs to render the whole structure, never query into it relationally. Minimal mechanism that satisfies the actual MVP requirement, explicitly not foreclosing the richer future entity CLAUDE.md already names.
