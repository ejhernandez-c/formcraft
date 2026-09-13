# Formcraft — Product Requirements Document

## 1. Summary

Formcraft is a simple, professional, mobile-first platform for creating digital forms, collecting responses, managing registrations, and understanding results. Inspired by tools like Google Forms, but not a clone — the product optimizes for usability, reliability, simplicity, maintainability, performance, and security rather than feature breadth.

MVP language: Spanish. Architecture: i18n-ready from day one.

## 2. Product lifecycle

```
CREATE → CUSTOMIZE → PUBLISH → COLLECT → CONTROL → ANALYZE
```

- **Create** — start from a blank form or a template.
- **Customize** — build structure (sections, content, questions), apply a theme.
- **Publish** — make the form reachable at a public, non-sequential URL.
- **Collect** — respondents submit answers; capacity/date rules are enforced.
- **Control** — creator monitors status, closes/archives, manages capacity.
- **Analyze** — dashboard statistics, per-question charts, CSV export.

## 3. Users

- **Creator** — authenticated user (Cognito). Builds forms, manages publishing, views results. Desktop-first, feature-rich tooling.
- **Respondent** — unauthenticated by default. Opens a public link, fills the form, submits. Mobile-first, minimal-friction experience. May optionally be identified (name/email/phone) per form configuration.

These are two distinct experiences with different design priorities (see `docs/UX.md`); the respondent experience is never compromised to simplify the creator tooling.

## 4. Form types (templates, not engines)

1. Survey
2. Event Registration
3. Registration Form
4. Application / Request
5. Blank Form

All five run on the same underlying form engine and the same generic question model. `form_type` is a labeling/template concern only — it never restricts which content or input controls a form may contain (an event registration may include free text; a survey may collect name/email/phone). See ADR-005.

## 5. Content components (MVP)

Heading, Paragraph, Instruction, Image, Divider. Instructions are first-class and exist at three levels: form-level, section-level, and question-level help text.

## 6. Input controls (MVP)

Short Text, Long Text, Number, Email, Date, Dropdown, Radio, Checkbox, Yes/No, Rating.

Deferred (data model must not block adding them later): Time, Date & Time, Phone, Slider, File Upload, Signature.

Every control shares one generic shape: `control_type`, `settings` (JSONB), `validation` (JSONB).

## 7. Form lifecycle

```
DRAFT → PUBLISHED → CLOSED → ARCHIVED
```

Editing a draft never silently changes what respondents currently see — the creator explicitly publishes. See ADR-006 for the versioning mechanism (publish-time snapshot).

## 8. Event capacity (MVP)

Forms may define a maximum number of accepted responses (reused for both "event capacity" and "response limit" — same mechanism, different framing depending on `form_type`; see ADR-005). Capacity is enforced **server-side only**, transactionally, and must never be exceeded under concurrent submissions. See `docs/DATABASE.md` §Capacity and ADR-003.

When capacity is reached, the public form shows a clear closed-state message (e.g. *"Las inscripciones están cerradas. Hemos alcanzado el número máximo de participantes."*) instead of the submission form.

## 9. Respondent identification (MVP)

- **Anonymous** — no identifying data collected.
- **Identified** — name, email, phone collected per the creator's configuration.

**Deferred to a future phase, not MVP:** verified identity (email verification, Google/Microsoft identity, org auth).

## 10. Response settings (MVP)

- Accept/pause responses (derived from `status`, `open_at`, `close_at`, and capacity — see ADR-003; no background job required).
- Opening/closing date-time.
- Maximum responses.
- One response per email (when identification is enabled).
- Anonymous vs. identified mode.

## 11. Theming (MVP)

Logo, organization name, primary/secondary color, background, font, form width/layout. Initial presets: Modern, Professional, Minimal, Corporate, Friendly. This is a bounded configuration surface, not a general design tool.

## 12. Thank-you page (MVP)

Custom title, custom message, optional redirect URL, logo.

## 13. Results & analytics (MVP)

Total responses, completion rate, average completion time where measurable, per-question statistics with visualization matched to control type, individual response drill-down (with previous/next navigation), filters, search, CSV export.

## 14. Dashboard (MVP)

Forms list with status, response count, last updated; create-form entry point; per-form actions: Edit, Results, Preview, Share, Duplicate, Close, Archive. **No hard-delete action in MVP** — Archive is the terminal creator-initiated state (see `docs/API.md`).

## 15. Sharing (MVP)

QR code (generate/display/download), public URL, copy-link.

## 16. Out of scope for MVP (explicitly deferred)

Conditional logic/branching, waitlists, cancellations/attendance tracking beyond a minimal status field, file uploads, signatures, verified respondents, Microsoft login, organizations/teams/permissions, Excel/PDF export, email notifications, AI features (generation, analysis, summarization), multilingual form content. The data model is designed so none of these are blocked later (see `docs/DATABASE.md`).

## 17. Success criteria for MVP

- A creator can build, publish, and share a form in under a few minutes without documentation.
- A respondent can complete a public form on a phone with no friction and no account.
- Event capacity is provably correct under concurrent load (automated concurrency tests, see `docs/DEVELOPMENT.md`).
- Every creator-facing operation enforces ownership; every public operation enforces server-side validation and rate limiting.

## 18. Open questions

See `docs/ARCHITECTURE.md` §Risks, Assumptions & Open Questions for the consolidated list requiring developer confirmation before or during Phase 1.
