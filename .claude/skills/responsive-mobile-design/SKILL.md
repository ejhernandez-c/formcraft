---
name: responsive-mobile-design
description: Use when building or reviewing the public respondent-facing form and any layout that must work across phone/tablet/desktop — Phases 3, 4, and the Phase 8 mobile review. The creator's builder/dashboard is desktop-first and not the primary concern here.
---

# Responsive & Mobile Design

## Responsibility

Own the mobile-first respondent experience and cross-device responsive behavior of the public form. The creator tool (builder, dashboard) is deliberately desktop-first/feature-rich — don't apply mobile-first constraints there at the cost of builder productivity; that tradeoff is intentional per the creator-vs-respondent split below.

## Creator vs. respondent — different design targets

| | Creator | Respondent |
|---|---|---|
| Priority | Desktop-first, feature-rich, builder-oriented | Mobile-first, simple, fast, minimal friction |

Never compromise the respondent experience to make the builder simpler to implement — if a tradeoff arises, the respondent side wins.

## Mobile-first, not "responsive afterward"

Design and build the public form for smartphones first, then verify it scales up — not the reverse. Concretely: touch-sized targets, readable type without zooming, single-column layout by default, correct mobile keyboard types per field (`email`, `tel`, `number`, etc. — use the matching HTML input type/inputmode), simple linear navigation, accessible controls (see `accessibility`), and fast load on mobile networks.

The public form must work across small phone, large phone, tablet, laptop, and desktop — never assume a specific viewport. Avoid horizontal scrolling, undersized controls, excessive max-width on the form container, and any interaction that only works with a mouse (hover-only affordances, drag-only controls).

## Preview modes

The builder must offer the creator a way to preview the public form at mobile/tablet/desktop breakpoints before publishing — this is how a desktop-first creator verifies a mobile-first result without leaving the builder.

## Cross-references

- Keyboard/screen-reader/touch-target accessibility specifics: `accessibility`
- Component/layout implementation: `frontend-development`
- Theme-driven layout width/branding: `ui-ux-product-design`
