---
name: aws-cloud-architecture
description: Use when deciding or implementing cloud infrastructure topology — hosting, environments, background processing infra, CDN — Phase 0 AWS architecture design and Phase 8 production deployment.
---

# AWS Cloud Architecture

## Responsibility

Own cloud service topology and environment strategy. Backend application logic itself belongs to `backend-development`; this skill decides *where and how* things run in AWS, and when infra-level tools (queues, caches) are justified.

## Target topology

```
Internet → CloudFront
             ├─→ S3 (React app)
             └─→ API (FastAPI)
                    ├─→ PostgreSQL (Aurora/RDS)
                    ├─→ S3 (assets)
                    └─→ SQS (background jobs)
```

Backend hosting defaults to ECS/Fargate; only move to Lambda if Phase 0 analysis surfaces a strong, specific reason (e.g. sharply spiky/low-baseline traffic) — don't default to Lambda just because it's serverless-fashionable.

Expected services: Cognito (creator auth), S3 (frontend + assets), CloudFront (CDN), ECS/Fargate, PostgreSQL on AWS, SQS (background jobs), CloudWatch (observability). Evaluate any addition against cost, operational complexity, scalability, developer productivity, security, and observability — not just technical elegance.

## Environments

Support local, development, staging, and production as distinct environments, each with its own configuration and secrets — never share a database or secret between environments. Every environment reads config from environment variables plus the appropriate AWS secret/config service; provide `.env.example` for local setup, and never let production credentials exist in a non-production environment or vice versa.

## When to introduce caching or a queue

Do not add Redis (or any cache) until a concrete, measured requirement appears. If one does, document: what's cached, TTL, invalidation strategy, and consistency implications, before implementing — an undocumented cache is a future correctness bug.

Use SQS for work that shouldn't block the HTTP response (CSV/exports, notification email, heavy analytics, future integrations) — this is the infra half of the decision; the business logic that enqueues the job is `backend-development`'s concern.

## Cross-references

- What actually runs inside ECS/Lambda (application logic): `backend-development`
- Secrets/credential hygiene specifics: `security`
- CI/CD pipeline that deploys to these environments: `devops`
