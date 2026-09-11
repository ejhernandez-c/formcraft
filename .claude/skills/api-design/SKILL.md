---
name: api-design
description: Use when defining or changing REST API endpoints, resource shapes, request/response contracts, pagination, filtering, sorting, or API-level error structure — Phase 0 API design, and any time a new endpoint is added.
---

# API Design

## Responsibility

Own the shape of the HTTP contract: resource naming, verbs, status codes, pagination/filtering/sorting conventions, and the structure of API error responses. Does not own what happens inside a handler (`backend-development`) or the underlying schema (`postgresql-database-design`).

## Resource conventions

RESTful, resource-oriented, nested where the relationship is real:

```
/api/forms
/api/forms/{id}
/api/forms/{id}/sections
/api/forms/{id}/questions
/api/forms/{id}/publish
/api/forms/{id}/close
/api/forms/{id}/responses
/api/forms/{id}/analytics
/api/public/forms/{slug}
```

Public respondent-facing endpoints live under a distinct `/api/public/...` namespace and use the form's opaque slug, never its internal ID. Actions that aren't pure CRUD (publish, close) are modeled as sub-resource POSTs, not overloaded PATCH semantics.

## Consistency

Use consistent HTTP status codes, a consistent error-response envelope (so every client-facing error looks the same shape regardless of which endpoint produced it), and consistent pagination/filtering/sorting query parameters across all list endpoints. Don't invent a new convention per endpoint.

## Error responses

API error payloads are structured and safe: a machine-readable code/type, a human-readable message, and (for validation errors) per-field detail — never a raw stack trace, SQL fragment, internal file path, or infrastructure detail. This is the API-facing half of error handling; how errors are logged and handled internally is `backend-development`'s concern.

## Documentation

FastAPI's generated OpenAPI schema is the source of truth for the contract and must stay accurate — that means Pydantic models and route signatures should reflect reality, not be papered over with `Any` or loose typing to make something compile.

## Cross-references

- Internal error handling / logging: `backend-development`
- Authorization checks on each endpoint (ownership, permissions): `authentication-authorization`
- Rate limiting, payload limits, abuse protection on public endpoints: `security`
- Schema that request/response models map to: `postgresql-database-design`
