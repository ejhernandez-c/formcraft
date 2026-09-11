---
name: testing
description: Use when writing or reviewing tests — Pytest for backend, Vitest/RTL for frontend, Playwright for E2E — across all implementation phases (1 through 8). Always required for capacity/concurrency logic.
---

# Testing

## Responsibility

Own test strategy and coverage expectations across the stack. Testing is mandatory for every phase that ships functionality — not an optional follow-up.

## Backend — Pytest

Cover: services, business rules, API endpoints, validation, authorization, and database behavior. An endpoint isn't done until its service-layer logic, its authorization check, and its validation edge cases each have a test — not just a happy-path smoke test.

## Frontend — Vitest + React Testing Library

Cover: components, validation behavior, user interactions, form rendering, and builder behavior. Prefer testing observable behavior (what the user sees/does) over implementation details.

## End-to-end — Playwright

Cover the critical flows end to end: login, create form, edit form, publish form, open public form, submit response, view results, share form, register for an event, reach capacity, attempt registration after capacity is reached.

## Capacity/concurrency testing — mandatory, not optional

This is called out separately because it is the one place a bug is a business-rule violation, not just a UX defect. Required scenarios:

- **Capacity = 1**, two simultaneous registration attempts — exactly one succeeds.
- **Capacity = 20, current = 19**, concurrent requests arriving together — accepted registrations never exceed 20.

The invariant to assert, always: `accepted registrations <= capacity`, under real concurrency (parallel requests/transactions), not just sequential calls that happen to look concurrent. If `backend-development`'s capacity implementation changes, these tests must be re-run, not assumed still valid.

## Cross-references

- The transactional capacity implementation being tested: `backend-development`
- Accessibility assertions (keyboard nav, screen reader labels) as part of frontend/E2E coverage: `accessibility`
- CI pipeline wiring for these test suites: `devops`
