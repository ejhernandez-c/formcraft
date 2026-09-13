# Phase 3 — Form Builder

Status: Complete, awaiting developer approval.

## Deliverables

| Deliverable | Where |
|---|---|
| Sections | `backend/app/modules/form_builder/{schemas,service,router}.py`, `frontend/src/features/builder/Canvas.tsx` |
| Content components (Heading, Paragraph, Instruction, Image, Divider) | `frontend/src/features/builder/controlTypes.ts`, `ElementRenderer.tsx` |
| Questions / input controls (all 10 from CLAUDE.md §17) | same, plus `PropertiesPanel.tsx` |
| Properties panel | `frontend/src/features/builder/PropertiesPanel.tsx`, `propertiesForm.ts`, `OptionsEditor.tsx` |
| Validation (required toggle, choice-control option rules) | backend: `form_builder/schemas.py` (`_validate_control_type`); frontend: same toggle wired to `validation.required` |
| Ordering | `POST .../sections/reorder`, `POST .../elements/reorder` — up/down buttons, not drag-and-drop (see `docs/UX.md` §3 for the rationale) |
| Autosave | `frontend/src/hooks/useDebouncedCallback.ts`, wired into `PropertiesPanel.tsx` (600ms debounce, matching `docs/API.md`'s "no separate autosave endpoint" design) |
| Preview (mobile/tablet/desktop) | `frontend/src/features/builder/PreviewDialog.tsx` |

No public form, no theming, no publishing UI beyond what Phase 2 already built (the publish/close/archive actions on `FormEditPage`) — those are Phase 4+.

## Notes for next phase

- **No new database migration.** `FormSection`/`FormElement`/`QuestionOption` were already created in Phase 1's initial migration; this phase only added the API and UI layers on top of an unchanged schema.
- **Two real Phase 1 bugs found and fixed while building this phase's tests** (see Known Limitations/Architectural Decisions below for detail): none this time — Phase 1/2's bugs were already caught and fixed in the Phase 2 report. This phase's own bug (the `!token` render-gate gap) was caught by its own test suite, not a leftover from an earlier phase.
- **Publish snapshot still empty.** `Form.publish_form` (Phase 2) now has real content to snapshot — sections/elements exist — but the snapshot builder (`backend/app/modules/forms/service.py:_build_snapshot`) still hard-codes `sections: []`. Wiring it to actually serialize the live tree is Phase 4 work (that's when the public form needs to read it for the first time); flagging now so it's not forgotten.
- **Options don't preserve identity across an edit.** `_sync_options` replaces a question's options wholesale on every save (see the docstring in `form_builder/service.py`). This is fine until responses reference a specific option id (Phase 5+) — revisit then if response integrity requires preserving option ids across edits.
- **Reordering is up/down buttons, not drag-and-drop** — a deliberate scope/dependency tradeoff, not an oversight. See `docs/UX.md` §3.

## Known limitations

- Backend DB-backed tests (`pytest`, 9 new tests in `test_form_builder.py`) could not be executed live this session — the local PostgreSQL instance used earlier in Phase 2 is no longer reachable (Docker Desktop still isn't fully set up on this machine). All tests are written and pass `ruff`/`mypy --strict`; run `docker compose up --build` then `docker compose exec backend pytest` to execute them for real once Docker is available.
- The properties panel's `number`/`rating` min/max fields are plain number inputs with no cross-field validation (e.g. min > max isn't rejected client-side) — low-risk given the backend doesn't enforce it either; revisit if it becomes a real usability complaint.
- Image content blocks take a raw URL, no upload — matches CLAUDE.md §71 (file upload is explicitly out of MVP scope).

## Tests

Backend: 9 new tests in `test_form_builder.py` (section/element CRUD, ownership isolation, reorder including cross-section element moves, choice-control option validation, cascade delete, archived-form edit lockout) — written and statically verified (ruff/mypy), pending a live Postgres run (see above).

Frontend: 5 new tests in `BuilderPage.test.tsx` (renders existing content, auto-creates a first section for a blank form, palette-add creates an element via the API, selecting an element populates the properties panel, preview dialog opens) — all passing. Full suite: 5 files, 16 tests, ruff/mypy/eslint/typecheck/prettier all clean, production build succeeds.

A real bug was caught by the frontend test suite itself, not just observed: `BuilderPage`'s loading gate checked `sectionsQuery.isLoading`/`elementsQuery.isLoading`, but a *disabled* query (`enabled: Boolean(token)`, before auth resolves) reports `isLoading: false` — not `true` — because nothing is fetching yet. In production this is masked by `ProtectedRoute` always guaranteeing a token before `BuilderPage` mounts, but the component itself was still relying on that external guarantee rather than being correct on its own. Fixed by also gating on `!token` directly in `BuilderPage`.
