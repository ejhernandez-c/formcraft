---
name: accessibility
description: Use when building or reviewing any user-facing UI — public form, form builder, dashboard — for WCAG compliance, keyboard navigation, screen reader support, and touch targets. Primarily Phases 3, 4, and the Phase 8 accessibility review.
---

# Accessibility

## Responsibility

Own WCAG-aligned accessibility of the UI. Applies to both the creator experience (builder, dashboard) and the respondent experience (public form) — the public form in particular must remain fully usable without a mouse, since it's the highest-traffic, most exposed surface.

## Focus areas

- **Semantic HTML** — use the element that means what it does (`<button>`, `<label>`, `<fieldset>`, headings in order) rather than `<div onClick>` everywhere.
- **Labels** — every input has a programmatically associated label, not just adjacent text.
- **Keyboard navigation** — every interactive element (including builder drag-and-drop, dropdowns, dialogs) must be operable via keyboard alone.
- **Focus management** — focus moves predictably on navigation, modal open/close, and validation errors; nothing traps focus unintentionally.
- **Screen readers** — dynamic content (validation errors, capacity status, autosave state) is announced, not silently updated visually only.
- **Error messages** — associated with their field, readable by assistive tech, not conveyed by color alone.
- **Contrast** — text and interactive elements meet WCAG contrast minimums, including across custom themes (see `ui-ux-product-design`).
- **Accessible dialogs and dropdowns** — correct ARIA roles/states, not just visual approximations of native behavior.
- **Touch targets** — large enough for real-world mobile tapping, not just visually distinct.

## Cross-references

- Mobile touch-target sizing overlaps with responsive layout: `responsive-mobile-design`
- Component implementation (shadcn/ui primitives, ARIA wiring): `frontend-development`
- E2E/keyboard-only test coverage: `testing`
