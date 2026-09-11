---
name: authentication-authorization
description: Use when implementing or touching creator login (Cognito/Google/email), respondent access/identification, or any authorization check that gates access to a form or its data — primarily Phase 2, and any later change to who can see or do what.
---

# Authentication & Authorization

## Responsibility

Own identity and access control: who the creator is, how a respondent is (or isn't) identified, and whether an authenticated actor is allowed to act on a specific resource. These are two distinct concerns that must not be conflated.

## Creator authentication

AWS Cognito, with Google login and email authentication as the initial providers (Apple/Microsoft may follow later, per Phase 0 decisions). Creator auth is completely separate from respondent identification — a respondent filling out a public form is never asked to go through Cognito.

## Respondent access

Respondents normally need no account at all: open the public link (`/f/{slug}`), fill the form, submit, see confirmation. Support two respondent identification modes:
- **Anonymous** — no identifying data collected.
- **Identified** — collect name/email/phone as configured by the creator.

Verified identity (email verification, Google/Microsoft identity, org auth) is a future capability — do not build it into MVP flows unless explicitly approved, but don't design the response model in a way that would block adding it later.

## Authorization is not implied by authentication

Every creator-facing operation that touches a specific form must independently verify the authenticated user owns (or has permission on) that form — possession of a valid ID in the URL is never sufficient:

```
GET    /forms/{id}
PUT    /forms/{id}
DELETE /forms/{id}
GET    /forms/{id}/responses
```

Each of these needs an explicit ownership/permission check in the service layer, not just a "user is logged in" check at the route. Missing this check on any single endpoint is a full authorization bypass on that endpoint — treat it as a hard requirement, not a nice-to-have, on every new form-scoped route.

## Cross-references

- Public endpoint hardening (rate limiting, abuse detection) beyond identity: `security`
- Opaque public identifiers used in respondent URLs: `postgresql-database-design`
- Endpoint/resource shape these checks attach to: `api-design`
