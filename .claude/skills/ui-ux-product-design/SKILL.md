---
name: ui-ux-product-design
description: Use when making product/UX decisions — positioning, theming, dashboard/results UX intent, templates, QR sharing, thank-you page, overall visual/interaction tone — Phase 0 product framing and Phases 3–4 builder/public-form UX.
---

# UI/UX & Product Design

## Responsibility

Own product intent and UX tone — what the product should feel like and what a screen is *for* — as distinct from `frontend-development` (how it's built) and `responsive-mobile-design`/`accessibility` (device and access constraints on the how).

## Positioning

Formcraft is a simple, professional, mobile-first platform for creating digital forms, collecting responses, managing registrations, and understanding results — Spanish-first, with a desktop-friendly creator experience and a mobile-first respondent experience. It is inspired by tools like Google Forms but is not a clone; optimize for usability, reliability, simplicity, maintainability, performance, and security over raw feature count.

## Tone

Modern, professional, simple, trustworthy, fast, approachable. Avoid over-designing: no unnecessary animation, gradients, decorative elements, complicated navigation, or excessive modal usage. At every builder step, the next action should be obvious — if a screen needs an explanatory tooltip to be usable, reconsider the layout first.

## Theming — configuration, not a design tool

Support logo, organization name, primary/secondary color, background, font, and form width/layout, via a small set of initial themes (Modern, Professional, Minimal, Corporate, Friendly). This is a bounded set of creator-facing options, not a general-purpose design/graphics tool — resist requests to expand it into arbitrary CSS control.

## Thank-you page

Custom title, custom message, optional redirect URL, logo. This is the respondent's last impression — keep it as simple and fast as the rest of the public form.

## Dashboard & results — what to show, not how to query it

Creator dashboard: forms list, status, response count, last updated, create-form entry point, and per-form actions (Edit, Results, Preview, Share, Duplicate, Close, Archive). Results dashboard: total responses, completion rate, average completion time where measurable, per-question statistics with visualization matched to control type (bar chart for radio/dropdown, percentage split for yes/no, average+distribution for rating, average/min/max for number, frequency distribution for checkbox, response list for free text), individual response drill-down, filters, search, CSV export. This skill defines *what* belongs on these screens; `frontend-development` implements it.

## Templates

Survey, Event Registration, Registration, Application/Request, Blank Form — templates seed the normal form engine with pre-populated structure; they are not a separate system or engine (see `backend-development` for why form types share one engine).

## QR sharing

QR code generation/display/download alongside the public URL and copy-link action — particularly important for event/restaurant/school/business use cases where a physical scan point drives traffic.

## Cross-references

- Implementation of these screens/components: `frontend-development`
- Mobile-first constraints on the public form: `responsive-mobile-design`
- Why form types share one engine: `backend-development`
