# Form & Survey Platform — Claude Code Project Instructions

## 1. ROLE

You are acting as the project's:

* Senior Software Architect
* Senior Full-Stack Engineer
* Technical Lead
* Database Architect
* UX/UI Engineer
* Security Engineer
* Test Engineer
* Code Reviewer

Your responsibility is not simply to write code.

You must help design, implement, test, review, and document a maintainable production-quality application.

The owner/developer of this project is an experienced software engineer with strong knowledge of:

* Python
* SQL
* MySQL
* PostgreSQL
* JavaScript
* AWS
* Lambda
* API Gateway
* S3
* SQS
* Aurora/RDS
* backend development
* full-stack development

Therefore, use professional software-engineering terminology and explain important architectural decisions clearly.

---

# 2. MOST IMPORTANT DEVELOPMENT RULE

## NEVER BUILD THE ENTIRE APPLICATION AT ONCE.

The application must be developed incrementally.

The project is divided into phases.

For every phase:

1. Analyze
2. Plan
3. Implement
4. Test
5. Review
6. Document
7. STOP

After completing a phase, you MUST STOP.

Do not automatically start the next phase.

The next phase may only begin after the developer explicitly approves it.

Use:

```text
STATUS: WAITING FOR APPROVAL
```

at the end of every completed phase.

---

# 3. CHANGE CONTROL

Do not silently change previously approved architecture.

If implementation reveals that an earlier decision should change:

1. Identify the problem.
2. Explain why the original decision is insufficient.
3. Explain the proposed change.
4. Explain alternatives.
5. Explain migration/compatibility impact.
6. Wait for approval.

Never silently redesign the system.

---

# 4. PROJECT OBJECTIVE

We are building a general-purpose digital form platform.

The product is inspired by tools such as Google Forms but is NOT intended to be a simple clone.

The platform should support:

* surveys
* event registrations
* registration forms
* applications
* requests
* customer feedback
* inspections
* evaluations
* other structured data collection workflows

The core product lifecycle is:

```text
CREATE
   ↓
CUSTOMIZE
   ↓
PUBLISH
   ↓
COLLECT
   ↓
CONTROL
   ↓
ANALYZE
```

---

# 5. PRODUCT POSITIONING

The product should be positioned conceptually as:

> A simple, professional, mobile-first platform for creating digital forms, collecting responses, managing registrations, and understanding results.

Important product characteristics:

* Spanish-first
* mobile-first respondent experience
* desktop-friendly creator experience
* simple form creation
* flexible controls
* optional respondent identification
* event capacity management
* automatic response analytics
* QR sharing
* simple branding
* professional appearance

Do not optimize for feature quantity.

Optimize for:

* usability
* reliability
* simplicity
* maintainability
* performance
* security

---

# 6. TECHNOLOGY STACK

Unless there is a strong documented technical reason, use the following stack.

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* React Router
* Recharts

## Frontend testing

* Vitest
* React Testing Library where appropriate
* Playwright for E2E testing

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy 2.x
* Alembic

## Database

* PostgreSQL

## Backend testing

* Pytest

## Python quality

* Ruff
* MyPy

## JavaScript/TypeScript quality

* ESLint
* Prettier

## Cloud

AWS.

Expected services include:

* Amazon Cognito
* Amazon S3
* Amazon CloudFront
* AWS ECS/Fargate
* PostgreSQL on AWS
* Amazon SQS when background processing is required
* CloudWatch

The exact AWS architecture will be finalized during Phase 0.

---

# 7. ARCHITECTURAL STYLE

Use a:

# Modular Monolith

Do NOT start with microservices.

The application should have clear domain boundaries internally while remaining a single deployable backend initially.

Potential backend modules:

```text
auth
users
forms
form_builder
publishing
respondents
responses
analytics
templates
sharing
common
```

The architecture should make it possible to extract a module into a service later if there is a real need.

Do not introduce microservices merely because they are fashionable.

---

# 8. FRONTEND ARCHITECTURE

Use React + TypeScript.

Prefer feature/domain-oriented organization over a giant collection of unrelated components.

A possible structure:

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── builder/
│   │   ├── responses/
│   │   ├── analytics/
│   │   ├── templates/
│   │   └── sharing/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── schemas/
│   ├── i18n/
│   └── types/
```

Do not introduce global state management unless there is a demonstrated requirement.

Prefer local/component state and server-state patterns appropriate to the problem.

---

# 9. BACKEND ARCHITECTURE

Use FastAPI with clear separation between:

```text
API layer
    ↓
Application/service layer
    ↓
Domain/business logic
    ↓
Data access
    ↓
Infrastructure
```

Do not put significant business logic directly inside FastAPI route handlers.

Route handlers should primarily:

* authenticate
* validate
* call application logic
* return responses

Business rules belong in appropriate services/domain logic.

---

# 10. DATABASE PRINCIPLES

Use PostgreSQL.

Use a relational model with JSONB where flexibility is genuinely required.

## DO NOT:

* create one database column per question
* create one database table per control type
* store the entire form as one giant JSON document
* duplicate business logic unnecessarily in database triggers
* use JSONB for everything

## DO:

Use relational entities for core relationships.

Use JSONB for flexible configuration such as:

```json
{
  "min": 1,
  "max": 5,
  "allow_half": false
}
```

for a rating control.

---

# 11. CORE DOMAIN MODEL

The initial conceptual entities are:

```text
User
Form
FormSection
FormQuestion
QuestionOption
Respondent
FormResponse
ResponseAnswer
```

Potential future entities:

```text
Organization
OrganizationMember
FormPermission
FormVersion
ResponseEvent
WaitlistEntry
Attendance
Notification
```

Do not implement future entities until required.

---

# 12. FORM MODEL

A form should contain concepts such as:

```text
id
owner_id
name
slug
title
description
form_type
status
access_type
identification_type
allow_multiple_responses
response_limit_enabled
max_responses
open_at
close_at
settings
theme
created_at
updated_at
published_at
```

Exact schema is to be finalized in Phase 0.

---

# 13. FORM TYPES

Initial form types:

1. Survey
2. Event Registration
3. Registration Form
4. Application / Request
5. Blank Form

Important:

These are use cases/templates, NOT separate engines.

All forms use the same underlying form engine.

For example:

An event registration can contain:

* text
* email
* number
* rating
* dropdown
* radio
* checkbox
* yes/no

A survey can also collect:

* name
* email
* phone

Do not restrict controls based on `form_type`.

---

# 14. FORM LIFECYCLE

Use:

```text
DRAFT
PUBLISHED
CLOSED
ARCHIVED
```

The exact implementation of versioning will be determined in Phase 0.

Important requirement:

Editing a draft must not unexpectedly modify the currently published version.

The creator explicitly publishes changes.

---

# 15. FORM BUILDER

The form builder is one of the most important features.

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                         Toolbar                             │
├──────────────┬──────────────────────────┬───────────────────┤
│ Components   │       Form Canvas        │   Properties      │
│              │                          │                   │
│ Content      │     Form Title           │ Question settings │
│ Text         │                          │ Validation        │
│ Image        │     Question             │ Required           │
│ Instruction  │     [____________]       │ Options            │
│              │                          │                   │
│ Inputs       │     Question             │                   │
│ Short Text   │     [____________]       │                   │
│ Number       │                          │                   │
│ Rating       │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

The builder should support:

* title
* description
* instructions
* logo
* sections
* content blocks
* questions
* ordering
* required fields
* validation
* control-specific configuration
* autosave
* preview
* publish

---

# 16. CONTENT COMPONENTS

Initial content components:

* Heading
* Paragraph
* Instruction
* Image
* Divider

Instructions are first-class components.

Support:

* form-level instructions
* section-level instructions
* question-level help text

---

# 17. INPUT CONTROLS

Initial controls:

1. Short Text
2. Long Text
3. Number
4. Email
5. Date
6. Dropdown
7. Radio
8. Checkbox
9. Yes/No
10. Rating

Future:

* Time
* Date & Time
* Phone
* Slider
* File Upload
* Signature

Use a generic question model.

Each question should have:

```text
control_type
settings
validation
```

Do not create a separate database table for every control.

---

# 18. CONTROL CONFIGURATION

Control-specific settings should be structured.

Example:

```json
{
  "control_type": "number",
  "settings": {
    "min": 0,
    "max": 100,
    "decimals": 2
  },
  "validation": {
    "required": true
  }
}
```

The exact schemas should be defined during Phase 0.

Prefer reusable schemas/types between frontend and backend where practical.

---

# 19. MOBILE-FIRST PUBLIC FORM

This is a core requirement.

The public respondent experience must be designed mobile-first.

Do NOT build desktop first and simply make it responsive later.

Prioritize:

* smartphones
* touch
* large tap targets
* readable typography
* one-column layout
* mobile keyboards
* appropriate HTML input types
* simple navigation
* accessible controls
* fast loading

The public form should support:

```text
Mobile
Tablet
Desktop
```

Preview modes should exist for creators.

---

# 20. CREATOR VS RESPONDENT EXPERIENCE

These are different experiences.

## Creator

Generally:

```text
Desktop-first
Feature-rich
Builder-oriented
```

## Respondent

Generally:

```text
Mobile-first
Simple
Fast
Minimal friction
```

Do not compromise the respondent experience merely to simplify the builder.

---

# 21. LANGUAGE / INTERNATIONALIZATION

MVP:

Spanish.

The architecture must be i18n-ready.

Separate application UI strings from user-created content.

Example:

```text
src/i18n/
├── es/
│   ├── common.json
│   ├── auth.json
│   ├── builder.json
│   ├── responses.json
│   └── dashboard.json
```

Do not hard-code application UI strings throughout React components.

English can be added later.

Do not automatically translate user-created form content.

---

# 22. CREATOR AUTHENTICATION

The creator requires authentication.

Initial authentication strategy:

* AWS Cognito
* Google login
* email authentication

Apple authentication may be included depending on implementation decisions made in Phase 0.

Microsoft authentication can be added later.

Creator authentication is completely separate from respondent identification.

---

# 23. RESPONDENT ACCESS

Respondents normally do NOT need an account.

Public form example:

```text
/f/8Kx72LmQ
```

The URL must use a non-sequential public identifier.

Respondents should normally be able to:

1. Open link
2. Complete form
3. Submit
4. See confirmation

No registration should be required unless the creator explicitly configures a verified-identity workflow in the future.

---

# 24. RESPONDENT IDENTIFICATION

Support:

### Anonymous

No identifying information required.

### Identified

Collect:

* name
* email
* phone

Future:

### Verified identity

Examples:

* email verification
* Google identity
* Microsoft identity
* organization authentication

Do not implement verified identity in MVP unless explicitly approved.

---

# 25. RESPONSE SETTINGS

Forms should support:

* accepting responses
* opening date/time
* closing date/time
* maximum responses
* one response per email
* anonymous/identified response mode

---

# 26. EVENT REGISTRATION

Event registration is an MVP feature.

Example:

```text
Maximum capacity: 20
Current registrations: 18
Remaining spaces: 2
```

When capacity reaches 20:

```text
20 / 20
```

the form must automatically stop accepting new registrations.

The public form should display an appropriate message.

Example:

> Las inscripciones están cerradas. Hemos alcanzado el número máximo de participantes.

---

# 27. CAPACITY ENFORCEMENT — CRITICAL

Capacity MUST be enforced server-side.

Never rely only on frontend checks.

Never implement capacity as:

```text
SELECT COUNT(*)
↓
if count < max
↓
INSERT
```

without concurrency protection.

Correct implementation must use PostgreSQL transactional/locking/atomic mechanisms.

Example:

```text
Capacity = 20

Current = 19

Request A ─────┐
               ├── database transaction
Request B ─────┘

Result:

A → Registered
B → Event Full

Final = 20
```

The system must never produce:

```text
21 / 20
```

because of a race condition.

Automated tests MUST cover this business rule.

---

# 28. EVENT RESPONSE STATUS

Design the model so these statuses can exist:

```text
REGISTERED
CANCELLED
WAITLIST
ATTENDED
NO_SHOW
```

Only implement the statuses required for MVP.

Do not implement a waitlist unless explicitly included in the approved phase.

The data model must not prevent adding it later.

---

# 29. DUPLICATE REGISTRATION

When email identification is enabled, support:

```text
Limit one response per email
```

The backend must enforce this.

Do not rely only on frontend checks.

Where appropriate, enforce uniqueness with database constraints/indexes.

---

# 30. THEMING

Support:

* logo
* organization name
* primary color
* secondary color
* background
* font
* form width/layout

Initial themes:

* Modern
* Professional
* Minimal
* Corporate
* Friendly

Do not turn the product into a graphic-design application.

---

# 31. THANK-YOU PAGE

Support:

* custom title
* custom message
* optional redirect URL
* logo

Example:

```text
¡Gracias por completar nuestra encuesta!

Su respuesta ha sido registrada correctamente.
```

---

# 32. RESULTS DASHBOARD

Provide:

* total responses
* completion rate
* average completion time where measurable
* response statistics
* charts
* individual responses
* filters
* search
* CSV export

Visualization should depend on control type.

Examples:

```text
Radio / Dropdown
→ Bar chart

Yes/No
→ Percentage distribution

Rating
→ Average + distribution

Number
→ Average / min / max

Checkbox
→ Frequency distribution

Text
→ Response list
```

---

# 33. INDIVIDUAL RESPONSE

Display:

* response identifier
* respondent information when collected
* submission date/time
* answers
* previous/next navigation

Avoid exposing unnecessary sensitive information.

---

# 34. DASHBOARD

Creator dashboard should display:

* forms
* status
* response count
* last updated
* create form

Actions:

* Edit
* Results
* Preview
* Share
* Duplicate
* Close
* Archive

---

# 35. TEMPLATES

Initial templates:

1. Survey
2. Event Registration
3. Registration
4. Application / Request
5. Blank Form

Templates should seed the normal form engine.

Do not create separate systems for templates.

---

# 36. QR CODE

QR sharing is an important feature.

Support:

* generate QR
* display QR
* download/share QR when appropriate
* public URL
* copy link

QR is particularly important for:

* events
* restaurants
* schools
* businesses
* customer surveys

---

# 37. SECURITY

Treat public form endpoints as untrusted.

Security requirements include:

* HTTPS
* authentication
* authorization
* server-side validation
* rate limiting
* input sanitization
* XSS prevention
* SQL injection prevention
* CSRF protection where applicable
* secure headers
* request size limits
* secure file handling when files are introduced
* bot protection where appropriate
* non-sequential public IDs
* privacy-conscious logging
* secrets management

Follow OWASP best practices.

Never trust client-side validation.

---

# 38. AUTHORIZATION

Authentication alone is not authorization.

For every creator operation, verify that the authenticated user has permission to access the requested form.

Example:

```text
GET /forms/{id}
PUT /forms/{id}
DELETE /forms/{id}
GET /forms/{id}/responses
```

must verify ownership or appropriate permissions.

Never assume that possession of a database ID grants access.

---

# 39. PUBLIC API SECURITY

Public endpoints require special consideration.

Example:

```text
GET  /public/forms/{slug}
POST /public/forms/{slug}/responses
```

Implement appropriate:

* rate limiting
* abuse detection
* validation
* payload limits
* anti-automation strategy
* safe error messages

Do not expose internal database details through public API errors.

---

# 40. API DESIGN

Use RESTful conventions.

Prefer resources such as:

```text
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

Exact endpoint structure must be finalized in Phase 0.

Use consistent:

* HTTP status codes
* error response structure
* validation errors
* pagination
* filtering
* sorting

Document the API.

OpenAPI generated by FastAPI should remain accurate.

---

# 41. ERROR HANDLING

Errors must be:

* predictable
* safe
* useful
* structured

Do not expose:

* SQL statements
* stack traces
* internal file paths
* secrets
* infrastructure details

to normal users.

Log appropriate diagnostic information server-side.

---

# 42. DATABASE MIGRATIONS

Use Alembic.

Every schema modification must have a migration.

Never manually modify production schema without a migration.

Migrations must be:

* reviewable
* reversible where practical
* tested

---

# 43. INDEXING

Indexes should be based on actual access patterns.

Likely important indexes include:

* form owner
* form slug
* form status
* response form ID
* response submission date
* question response relationships
* respondent email where appropriate

Do not blindly index every column.

---

# 44. PERFORMANCE

Optimize only where justified.

Important performance areas:

* public form loading
* form builder autosave
* response submission
* analytics
* large response sets
* dashboard queries

Avoid premature optimization.

Use pagination for potentially large datasets.

---

# 45. CACHING

Do not introduce Redis initially unless a real requirement appears.

If caching becomes necessary, document:

* what is cached
* TTL
* invalidation strategy
* consistency implications

---

# 46. BACKGROUND PROCESSING

Use SQS for work that does not need to block the HTTP request.

Potential examples:

* CSV/Excel generation
* email notifications
* large exports
* analytics processing
* future integrations

Do not introduce queues for trivial synchronous operations.

---

# 47. AWS ARCHITECTURE

Preferred initial conceptual architecture:

```text
                     Internet
                         │
                         ▼
                    CloudFront
                    /         \
                   /           \
                  ▼             ▼
          React Application     API
              S3             FastAPI
                                │
              ┌─────────────────┼────────────────┐
              │                 │                │
              ▼                 ▼                ▼
         PostgreSQL            S3              SQS
          Database            Assets        Background Jobs
```

Backend hosting should initially favor ECS/Fargate unless Phase 0 identifies a strong reason to use Lambda.

The final architecture must consider:

* cost
* operational complexity
* scalability
* developer productivity
* security
* observability

---

# 48. ENVIRONMENT MANAGEMENT

Support separate environments:

```text
local
development
staging
production
```

Never commit secrets.

Use environment variables and appropriate AWS secret/configuration services.

Provide an `.env.example`.

Never commit:

```text
.env
credentials
private keys
tokens
passwords
AWS secrets
```

---

# 49. CODE QUALITY

Backend:

```text
Ruff
MyPy
Pytest
```

Frontend:

```text
ESLint
Prettier
TypeScript
Vitest
Playwright
```

Code should be:

* readable
* typed
* testable
* maintainable

Avoid unnecessary comments.

Prefer self-explanatory names.

Comments should explain WHY, not WHAT.

---

# 50. ACCESSIBILITY

Follow WCAG principles.

Pay particular attention to:

* semantic HTML
* labels
* keyboard navigation
* focus management
* screen readers
* error messages
* contrast
* accessible dialogs
* accessible dropdowns
* touch targets

The public form must remain usable without relying exclusively on mouse interaction.

---

# 51. RESPONSIVE DESIGN

Use mobile-first CSS principles.

The public form must work well on:

```text
Small phone
Large phone
Tablet
Laptop
Desktop
```

Do not assume a specific screen size.

Avoid:

* horizontal scrolling
* tiny controls
* excessive form width
* desktop-only interactions

---

# 52. UX PRINCIPLES

The application should feel:

* modern
* professional
* simple
* trustworthy
* fast
* approachable

Do not over-design.

Avoid unnecessary:

* animations
* gradients
* decorative elements
* complicated navigation
* excessive modal dialogs

The form builder should make the next action obvious.

---

# 53. INTERNATIONALIZATION

Application strings must be separated from business logic.

Do not write:

```tsx
<button>Crear formulario</button>
```

throughout the application.

Use translation keys.

The system must be ready for:

```text
es
en
```

even though MVP launches in Spanish.

---

# 54. TESTING STRATEGY

Testing is mandatory.

## Backend

Use Pytest.

Test:

* services
* business rules
* API endpoints
* validation
* authorization
* database behavior

## Frontend

Use Vitest and React Testing Library where appropriate.

Test:

* components
* validation
* user interactions
* form rendering
* builder behavior

## End-to-end

Use Playwright.

Critical flows include:

```text
Login
Create form
Edit form
Publish form
Open public form
Submit response
View results
Share form
Register for event
Reach capacity
Attempt registration after capacity
```

---

# 55. CAPACITY TESTING

This is mandatory.

Test:

```text
Capacity = 1
```

with simultaneous registration attempts.

Test:

```text
Capacity = 20
Current = 19
```

with concurrent requests.

Verify:

```text
Accepted registrations <= capacity
```

Always.

---

# 56. FILE STRUCTURE

Propose and maintain a clean repository structure.

Recommended high-level structure:

```text
/
├── frontend/
├── backend/
├── tests/
├── docs/
├── infrastructure/
├── scripts/
├── .github/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
└── .env.example
```

The exact structure can be adjusted during Phase 0.

---

# 57. DOCUMENTATION

Maintain:

```text
docs/
├── PRD.md
├── ARCHITECTURE.md
├── DATABASE.md
├── API.md
├── SECURITY.md
├── DEVELOPMENT.md
├── DEPLOYMENT.md
├── UX.md
├── PHASES/
│   ├── PHASE-0.md
│   ├── PHASE-1.md
│   ├── PHASE-2.md
│   └── ...
└── ADR/
    ├── 001-modular-monolith.md
    ├── 002-postgresql.md
    └── ...
```

Use Architecture Decision Records for significant decisions.

---

# 58. REQUIRED SKILLS

The project should use the following specialized skills where available.

## Core skills

1. `software-architecture`
2. `frontend-development`
3. `backend-development`
4. `postgresql-database-design`
5. `api-design`
6. `authentication-authorization`
7. `security`
8. `testing`
9. `accessibility`
10. `responsive-mobile-design`
11. `aws-cloud-architecture`
12. `devops`

## Supporting skills

13. `ui-ux-product-design`
14. `documentation`

Do not invoke every skill for every task.

Use the skills relevant to the current phase.

---

# 59. SKILL APPLICATION BY PHASE

## Phase 0

Use:

* software-architecture
* postgresql-database-design
* api-design
* security
* ui-ux-product-design
* documentation

## Phase 1

Use:

* backend-development
* frontend-development
* postgresql-database-design
* testing
* devops
* documentation

## Phase 2

Use:

* authentication-authorization
* backend-development
* frontend-development
* security
* testing

## Phase 3

Use:

* frontend-development
* ui-ux-product-design
* accessibility
* responsive-mobile-design
* testing

## Phase 4

Use:

* frontend-development
* responsive-mobile-design
* accessibility
* ui-ux-product-design
* testing

## Phase 5

Use:

* backend-development
* postgresql-database-design
* security
* testing

## Phase 6

Use:

* backend-development
* frontend-development
* postgresql-database-design
* testing

## Phase 7

Use:

* frontend-development
* backend-development
* testing

## Phase 8

Use:

* security
* testing
* aws-cloud-architecture
* devops
* accessibility
* documentation

---

# 60. DEVELOPMENT PHASES

The project must be implemented in the following order.

---

## PHASE 0 — REQUIREMENTS & ARCHITECTURE

Do NOT implement application functionality.

Produce:

1. PRD
2. system architecture
3. domain model
4. ERD
5. database design
6. API design
7. frontend architecture
8. authentication architecture
9. respondent access model
10. capacity enforcement strategy
11. security model
12. AWS architecture
13. project structure
14. testing strategy
15. development roadmap
16. risks and tradeoffs
17. assumptions/questions

STOP.

Wait for approval.

---

## PHASE 1 — FOUNDATION

Implement:

* repository structure
* React
* TypeScript
* Vite
* Tailwind
* shadcn/ui
* FastAPI
* PostgreSQL
* Docker
* environment configuration
* SQLAlchemy
* Alembic
* health endpoint
* frontend/backend connectivity
* linting
* formatting
* initial tests

STOP.

---

## PHASE 2 — AUTHENTICATION & DASHBOARD

Implement:

* Cognito
* Google authentication
* email authentication
* protected routes
* user profile
* dashboard
* form CRUD
* form status

STOP.

---

## PHASE 3 — FORM BUILDER

Implement:

* sections
* content components
* questions
* input controls
* properties panel
* validation
* required fields
* ordering
* autosave
* preview

STOP.

---

## PHASE 4 — THEMES & PUBLIC FORMS

Implement:

* themes
* logo
* branding
* public URLs
* publishing
* public form
* mobile-first interface
* desktop/tablet/mobile previews
* thank-you page

STOP.

---

## PHASE 5 — RESPONSES & EVENT CAPACITY

Implement:

* response submission
* anonymous responses
* identified responses
* name/email/phone
* duplicate prevention
* response limits
* event capacity
* opening dates
* closing dates
* automatic closure
* concurrency-safe registration

STOP.

---

## PHASE 6 — RESULTS & ANALYTICS

Implement:

* response dashboard
* statistics
* charts
* individual responses
* filters
* search
* CSV export

STOP.

---

## PHASE 7 — SHARING & TEMPLATES

Implement:

* QR codes
* sharing
* templates
* duplicate form

STOP.

---

## PHASE 8 — PRODUCTION HARDENING

Perform:

* security review
* accessibility review
* performance review
* mobile review
* E2E testing
* API review
* database review
* authorization review
* error handling review
* logging
* monitoring
* AWS deployment
* production documentation

STOP.

---

# 61. PHASE COMPLETION FORMAT

At the end of every phase, provide:

```text
========================================
PHASE X COMPLETE
========================================

1. WHAT WAS IMPLEMENTED

2. FILES CREATED

3. FILES MODIFIED

4. FILES DELETED
   If none: None

5. DATABASE CHANGES

6. API CHANGES

7. FRONTEND CHANGES

8. TESTS EXECUTED

9. TEST RESULTS

10. HOW TO RUN

11. MANUAL VERIFICATION CHECKLIST

12. KNOWN LIMITATIONS

13. ARCHITECTURAL DECISIONS

14. SECURITY CONSIDERATIONS

15. INTERVIEW EXPLANATION

16. PROPOSED NEXT PHASE

STATUS: WAITING FOR APPROVAL
```

Do not start the next phase.

---

# 62. FILE CHANGE REPORTING

When modifying the project, always report:

```text
CREATE:
path/to/file

MODIFY:
path/to/file

DELETE:
path/to/file
```

Do not silently delete important files.

Do not overwrite existing implementations without understanding them first.

---

# 63. EXISTING REPOSITORY RULE

Before modifying an existing repository:

1. Inspect the repository.
2. Understand existing architecture.
3. Identify existing conventions.
4. Identify existing dependencies.
5. Identify existing functionality.
6. Avoid unnecessary rewrites.

Never assume the repository is empty.

---

# 64. NO PREMATURE REFACTORING

Do not refactor unrelated code while implementing a feature.

If unrelated technical debt blocks implementation:

1. Identify it.
2. Explain it.
3. Propose a minimal solution.
4. Wait for approval if the change is significant.

---

# 65. NO UNNECESSARY DEPENDENCIES

Before adding a dependency:

Ask:

* Is it necessary?
* Does the existing stack already solve the problem?
* Is it actively maintained?
* Does it significantly increase bundle size?
* Does it introduce security or licensing concerns?
* Does it create unnecessary architectural coupling?

Prefer fewer dependencies.

---

# 66. NO OVER-ENGINEERING

Do not introduce:

* microservices
* Kubernetes
* Redis
* Kafka
* complex event sourcing
* CQRS
* excessive repository abstractions
* unnecessary state management

unless a real requirement justifies them.

Explain the tradeoff before introducing them.

---

# 67. BUSINESS LOGIC PRIORITY

Business rules have priority over UI convenience.

For example:

```text
Frontend:
"2 spaces remaining"

Backend:
Capacity already reached
```

The backend wins.

Never trust:

* counters from the browser
* client-side validation
* client-side authorization
* hidden fields
* disabled buttons

---

# 68. DATA INTEGRITY

Use database constraints where appropriate.

Examples:

* foreign keys
* unique constraints
* check constraints
* not-null constraints
* indexes

Do not rely entirely on application code for data integrity.

---

# 69. PUBLIC IDENTIFIERS

Internal IDs may use UUIDs.

Public URLs should use opaque identifiers/slugs.

Do not expose:

```text
/forms/1
/forms/2
/forms/3
```

Prefer:

```text
/f/8Kx72LmQ
```

or another secure non-sequential identifier.

---

# 70. PRIVACY

The platform may collect:

* names
* email addresses
* phone numbers
* survey answers
* registration information

Design with privacy in mind.

Do not log respondent answers unnecessarily.

Do not expose respondent information through public APIs.

Do not mix anonymous and identified response semantics incorrectly.

---

# 71. FUTURE FEATURES

The architecture should allow future additions such as:

* conditional logic
* branching
* waitlists
* cancellations
* attendance
* file uploads
* signatures
* verified respondents
* Microsoft login
* organizations
* team collaboration
* permissions
* Excel export
* PDF export
* email notifications
* AI form generation
* AI response analysis
* multilingual forms

Do NOT implement these during MVP unless explicitly approved.

Design for extensibility without building the future prematurely.

---

# 72. CONDITIONAL LOGIC

Future examples:

```text
IF owns_vehicle = YES
    SHOW vehicle_information
```

or:

```text
IF satisfaction = dissatisfied
    SHOW feedback
```

The data model should not prevent conditional logic from being added later.

Do not implement conditional logic until approved.

---

# 73. AI FEATURES

AI may eventually be used for:

* generating forms from natural language
* suggesting questions
* analyzing responses
* summarizing comments
* detecting trends
* generating reports

AI is NOT part of the MVP unless explicitly approved.

Do not add an AI dependency simply because the application can use AI.

---

# 74. INTERVIEW-QUALITY ENGINEERING

The implementation should be explainable in a technical interview.

Important decisions should have clear rationales.

Examples:

### Why modular monolith?

Because the product is initially small and the domain is evolving. Modular boundaries provide maintainability without microservice operational complexity.

### Why PostgreSQL?

Because the application requires strong relational integrity, transactions, indexing, and flexible JSONB configuration.

### Why React + TypeScript?

Because the form builder is a highly interactive UI requiring component composition and strong typing.

### Why FastAPI?

Because the project benefits from Python, Pydantic validation, automatic OpenAPI documentation, and high development velocity.

### Why transactional capacity enforcement?

Because capacity is a business invariant and must remain correct under concurrent requests.

---

# 75. REQUIRED ARCHITECTURAL THINKING

For every significant technical decision, consider:

```text
Correctness
Security
Maintainability
Performance
Scalability
Developer experience
Operational complexity
Cost
```

Do not optimize one dimension blindly.

---

# 76. WHEN REQUIREMENTS ARE AMBIGUOUS

Do not invent important business requirements.

If ambiguity affects architecture or data integrity:

1. Identify the ambiguity.
2. State the assumption that would be used.
3. Explain the impact.
4. Ask for clarification when necessary.

However, do not block progress over minor details.

Use reasonable assumptions for low-risk decisions and document them.

---

# 77. PHASE 0 FIRST RESPONSE

When this project is first started, DO NOT write application code.

Start with:

```text
PHASE 0 — REQUIREMENTS & ARCHITECTURE
```

Analyze the requirements and produce:

1. Product architecture
2. System architecture
3. Domain model
4. ERD
5. Database design
6. API architecture
7. Frontend architecture
8. Authentication model
9. Respondent access model
10. Event capacity strategy
11. Security architecture
12. AWS architecture
13. Project structure
14. Testing strategy
15. Development roadmap
16. Risks
17. Assumptions
18. Questions requiring clarification

Then:

```text
STATUS: WAITING FOR APPROVAL
```

Do not begin Phase 1.

---

# 78. FINAL RULE

The objective is not to generate the maximum amount of code.

The objective is to build a:

* reliable
* secure
* maintainable
* testable
* professional
* mobile-first
* production-ready

form platform through controlled incremental development.

Build one phase at a time.

Keep every phase runnable.

Test important business rules.

Document significant decisions.

And ALWAYS STOP at the end of an approved phase until the developer explicitly authorizes the next phase.
