# Formcraft — API Design

RESTful, resource-oriented. Two distinct namespaces with different trust levels: `/api/...` (authenticated, creator-facing) and `/api/public/...` (unauthenticated, respondent-facing, untrusted by definition).

## 1. Conventions

- **Pagination** — `?page=1&page_size=25` (default `page_size=25`, max `100`) on every list endpoint. Response envelope: `{ "items": [...], "page": 1, "page_size": 25, "total": 137 }`.
- **Filtering** — plain query params scoped to the resource, e.g. `?status=published&search=feedback`.
- **Sorting** — `?sort=-created_at` (`-` prefix = descending); default sort documented per endpoint.
- **Error envelope** — identical shape everywhere:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "One or more fields are invalid.",
      "fields": { "max_responses": "must be a positive integer" }
    }
  }
  ```
  Never includes a stack trace, SQL text, internal file path, or infrastructure detail (CLAUDE.md §41).
- **Status codes** — `200/201` success, `400` malformed request, `401` unauthenticated, `403` authenticated but not permitted, `404` not found (including "not yours" — never distinguish "doesn't exist" from "not yours" in the response body), `409` conflict (capacity reached, duplicate email, slug collision), `422` Pydantic validation failure, `429` rate limited, `500` generic safe error.
- **OpenAPI** — FastAPI's generated schema is the contract of record and must stay accurate (Pydantic models reflect reality, no `Any` escape hatches to make something compile).

## 2. Creator API (`/api/...`, authenticated)

### Identity
```
GET  /api/users/me
```

### Forms
```
GET    /api/forms                       list (paginated, filter by status/search, sort)
POST   /api/forms                       create (blank or from template_id)
GET    /api/forms/{id}
PUT    /api/forms/{id}                  update metadata / settings / theme
POST   /api/forms/{id}/duplicate
POST   /api/forms/{id}/publish          snapshot draft → published_snapshot
POST   /api/forms/{id}/close            manual close (independent of capacity/close_at)
POST   /api/forms/{id}/archive
```
No `DELETE /api/forms/{id}` in MVP — CLAUDE.md's dashboard actions (§34) list Edit/Results/Preview/Share/Duplicate/Close/Archive, not Delete. Archive is the terminal creator-initiated state. Flagged in `docs/ARCHITECTURE.md` as an assumption to confirm.

### Builder — sections & elements
```
GET    /api/forms/{id}/sections
POST   /api/forms/{id}/sections
PUT    /api/forms/{id}/sections/{section_id}
DELETE /api/forms/{id}/sections/{section_id}
POST   /api/forms/{id}/sections/reorder             body: [{id, order_index}, ...]

GET    /api/forms/{id}/elements
POST   /api/forms/{id}/sections/{section_id}/elements
PUT    /api/forms/{id}/elements/{element_id}
DELETE /api/forms/{id}/elements/{element_id}
POST   /api/forms/{id}/elements/reorder              body: [{id, section_id, order_index}, ...]
```
Autosave (CLAUDE.md §15) means the builder calls `PUT`/`POST` on individual sections/elements frequently and debounced client-side — no separate "autosave endpoint," it's the same CRUD surface called opportunistically.

### Responses & analytics
```
GET  /api/forms/{id}/responses                       paginated, filter, search
GET  /api/forms/{id}/responses/{response_id}
GET  /api/forms/{id}/responses/export                 CSV; synchronous for small sets,
                                                        SQS-backed async job + signed S3
                                                        download link once size justifies it
GET  /api/forms/{id}/analytics
```

### Sharing & templates
```
GET  /api/forms/{id}/qr                                QR image (PNG/SVG) for the public URL
GET  /api/templates
```

Every one of the `/api/forms/{id}...` routes above passes through an ownership check before touching the resource — see `docs/SECURITY.md` §Authorization. A form ID that exists but isn't owned by the caller returns `404`, not `403` (avoids confirming existence to a non-owner).

## 3. Public API (`/api/public/...`, unauthenticated, untrusted)

```
GET  /api/public/forms/{slug}              published_snapshot + theme + live accepting-responses state
POST /api/public/forms/{slug}/responses    submit a response
```

`GET /api/public/forms/{slug}` computes and returns whether the form is currently accepting responses (status, `open_at`/`close_at`, capacity remaining if the creator has chosen to surface it) so the client can render the closed-state message without a failed submit round-trip. The authoritative check still happens again, server-side, at submit time (CLAUDE.md §67 — backend wins).

`POST /api/public/forms/{slug}/responses` is the one endpoint under sustained abuse risk (bots, scripted floods) — see `docs/SECURITY.md` for rate limiting and payload limits applied here specifically.

Public error responses never leak database identifiers, internal IDs, or distinguish "form doesn't exist" from "form not published" beyond a generic not-found message.

## 4. Non-goals for MVP

No `PATCH` partial-update semantics (full-resource `PUT` only, keeps client/server contract simpler); no GraphQL; no webhook/callback API; no public read access to response data (results are creator-only, always authenticated).
