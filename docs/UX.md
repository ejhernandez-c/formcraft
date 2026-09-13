# Formcraft — UX Architecture

## 1. Positioning

A simple, professional, mobile-first platform for creating digital forms, collecting responses, managing registrations, and understanding results. Spanish-first at MVP, i18n-ready architecture. Inspired by Google Forms, not a clone. Optimize for usability, reliability, simplicity, maintainability, performance, security — not feature count.

Tone: modern, professional, simple, trustworthy, fast, approachable. No unnecessary animation, gradients, decorative elements, complicated navigation, or excessive modals. Every builder screen makes the next action obvious.

## 2. Two experiences, two design targets

| | Creator | Respondent |
|---|---|---|
| Priority | Desktop-first, feature-rich, builder-oriented | Mobile-first, simple, fast, minimal friction |

The respondent experience is never compromised to simplify the builder. Where the two pull in different directions, respondent wins.

## 3. Form builder (creator)

Three-pane desktop layout:

```
┌─────────────────────────────────────────────────────────────┐
│                         Toolbar                              │
├──────────────┬──────────────────────────┬───────────────────┤
│ Components   │       Form Canvas         │   Properties      │
│ (content +   │  title / sections /       │  (selected        │
│  input list) │  content blocks / Qs      │   element config) │
└──────────────┴──────────────────────────┴───────────────────┘
```

Supports: title, description, instructions, logo, sections, content blocks, questions, drag-reorder, required-field toggles, validation config, control-specific settings, autosave, preview (mobile/tablet/desktop), publish.

## 4. Public form (respondent)

Mobile-first from the first line of CSS — not desktop-built-then-shrunk. One-column layout, large tap targets, readable type without zoom, correct mobile keyboard/input type per field, simple linear navigation, fast load. Must remain fully usable across small phone → large phone → tablet → laptop → desktop, and without a mouse. Detailed breakpoint/interaction rules: see `.claude/skills/responsive-mobile-design` and `.claude/skills/accessibility` (applied starting Phase 3–4).

## 5. Theming

Configurable: logo, organization name, primary/secondary color, background, font, form width/layout. Initial presets: Modern, Professional, Minimal, Corporate, Friendly. Bounded configuration, not a graphic-design surface — resist scope creep toward arbitrary CSS control.

## 6. Thank-you page

Custom title, custom message, optional redirect URL, logo — the respondent's last impression, kept as simple and fast as the rest of the public flow. Example copy: *"¡Gracias por completar nuestra encuesta! Su respuesta ha sido registrada correctamente."*

## 7. Dashboard

Forms list: status, response count, last updated, create-form entry point. Per-form actions: Edit, Results, Preview, Share, Duplicate, Close, Archive.

## 8. Results dashboard

Total responses, completion rate, average completion time where measurable, per-question statistics with control-appropriate visualization:

```
Radio / Dropdown → bar chart
Yes/No           → percentage distribution
Rating           → average + distribution
Number           → average / min / max
Checkbox         → frequency distribution
Text             → response list
```

Individual response view: response identifier, respondent info when collected, submission timestamp, answers, previous/next navigation. No unnecessary sensitive data exposed.

## 9. Templates

Survey, Event Registration, Registration, Application/Request, Blank Form. Templates seed the normal form engine with pre-populated structure — not a separate system (see `docs/PRD.md` §4, ADR-005).

## 10. QR sharing

Generate, display, download/share the QR alongside the public URL and copy-link action. High-value for event/restaurant/school/business/customer-survey use cases with a physical scan point.

## 11. Internationalization

MVP ships Spanish only, but no application UI string is ever hardcoded in a component — every string routes through a translation key (`src/i18n/es/*.json`), ready for an `en/` addition later without a refactor. User-created form content (a creator's own question text) is never auto-translated — that's content, not UI chrome.

## 12. Accessibility baseline (detail owned by `accessibility` skill)

The public form must remain usable without exclusive reliance on mouse interaction — semantic HTML, labeled inputs, keyboard navigation, managed focus, screen-reader-announced dynamic states (validation errors, capacity status), WCAG-conformant contrast, accessible dialogs/dropdowns, real touch-target sizing. Applied starting Phase 3.
