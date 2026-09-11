---
name: devops
description: Use when setting up local dev environment (Docker/docker-compose), CI pipelines, or code-quality gates (Ruff/MyPy/ESLint/Prettier/test runners) — Phase 1 foundation setup and Phase 8 hardening.
---

# DevOps

## Responsibility

Own the developer-facing tooling and pipeline: local environment reproducibility, linting/formatting/type-checking gates, and CI wiring that runs the test suites owned by `testing`. Does not own the target cloud topology itself (`aws-cloud-architecture`) — it owns getting code there reliably and keeping it clean before it does.

## Local environment

Docker/docker-compose brings up the full local stack (API, PostgreSQL, frontend dev server) reproducibly — a new contributor should be able to clone and run one command to get a working environment. Keep `.env.example` current as the contract for required environment variables; never let local setup silently depend on undocumented manual steps.

## Quality gates

Backend: Ruff (lint), MyPy (types), Pytest (tests). Frontend: ESLint, Prettier, TypeScript, Vitest, Playwright. These run both locally (fast feedback) and in CI (enforced gate) — a PR that fails lint/type-check/tests should not merge. Don't treat these as optional or "fix later."

## Environments and secrets in CI/CD

CI/CD must respect the same local/dev/staging/production separation as the AWS topology — never let a pipeline use production secrets for a non-production build, and never commit secrets to get a pipeline green. See `aws-cloud-architecture` for the environment topology and `security` for secrets handling; this skill just ensures the pipeline honors both.

## Migrations in the pipeline

Alembic migrations should run as an explicit, reviewable pipeline step (not implicitly on app boot in production) — see `postgresql-database-design` for migration authoring rules.

## Cross-references

- What the test suites actually cover: `testing`
- Target AWS services deployed to: `aws-cloud-architecture`
- Secrets management specifics: `security`
- Migration authoring rules: `postgresql-database-design`
