---
name: frontend-development
description: Use when implementing React/TypeScript features — the form builder, content components, input controls, dashboard, or any component work — across Phases 1, 2, 3, 4, 6, 7. For mobile/responsive layout specifics use responsive-mobile-design; for a11y specifics use accessibility.
---

# Frontend Development

## Responsibility

Own React/TypeScript implementation: project structure, component composition, the form builder's interactive behavior, and how content/input control types are rendered and configured. Mobile-first layout rules live in `responsive-mobile-design`; accessibility specifics live in `accessibility` — this skill implements *with* those constraints, not instead of them.

## Structure — feature-oriented, not a flat component pile

```
src/
├── app/
├── components/        # shared/generic UI
├── features/           # domain-oriented: auth, dashboard, forms, builder,
│                        #   responses, analytics, templates, sharing
├── hooks/
├── lib/
├── services/
├── schemas/            # Zod schemas, ideally shared shape with backend Pydantic
├── i18n/
└── types/
```

Don't invent global state management (Redux, etc.) unless a concrete cross-cutting need is demonstrated — prefer local/component state and server-state patterns (e.g. query caching for API data) suited to the specific problem.

## Form builder

Desktop-first, three-pane layout: component palette → form canvas → properties panel. The builder must support title/description/instructions/logo, sections, content blocks, questions, drag-reordering, required-field toggles, validation config, control-specific settings, autosave, preview, and publish. The builder is the creator's tool — feature-rich and desktop-oriented is correct here, unlike the public form.

## Content components vs. input controls

Content components (Heading, Paragraph, Instruction, Image, Divider) carry no response data — Instructions are first-class and exist at form-level, section-level, and as question help text. Input controls (Short Text, Long Text, Number, Email, Date, Dropdown, Radio, Checkbox, Yes/No, Rating, and later Time/Phone/Slider/File/Signature) each render from the generic `control_type` + `settings` + `validation` shape — don't build a bespoke component contract per control when the generic shape covers it.

## i18n — never hardcode UI strings

```tsx
// wrong
<button>Crear formulario</button>
// right
<button>{t('common.createForm')}</button>
```

Application UI strings go through translation keys (`src/i18n/es/*.json` initially, `en/` structure ready to add) — this is separate from user-created form content, which is never auto-translated. This applies to every component, not just user-facing copy screens.

## Cross-references

- Mobile-first public form layout, breakpoints, touch targets: `responsive-mobile-design`
- WCAG/keyboard/screen-reader requirements: `accessibility`
- Theming (colors, logo, fonts) as a builder feature: `ui-ux-product-design`
- Zod validation shape mirrored from backend Pydantic models: `backend-development`, `api-design`
