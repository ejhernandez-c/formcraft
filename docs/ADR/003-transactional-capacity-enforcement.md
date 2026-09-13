# ADR-003: Transactional, Row-Lock-Based Capacity Enforcement

## Status
Accepted

## Context
CLAUDE.md §27 treats event-capacity correctness as a hard business invariant: accepted registrations must never exceed the configured maximum, even under concurrent submission requests. A naive implementation —

```
SELECT COUNT(*) → if count < max → INSERT
```

— has a race window: two concurrent requests can both read a count below the limit before either commits its insert, producing an over-capacity result (e.g. `21/20`). This must be structurally impossible, not just unlikely.

## Decision
Use a PostgreSQL row lock to serialize concurrent submission attempts **per form**:

```sql
BEGIN;
SELECT id FROM forms WHERE id = :form_id FOR UPDATE;
SELECT count(*) FROM form_responses
  WHERE form_id = :form_id AND status = 'registered';
-- if count < max_responses: INSERT INTO form_responses (...) VALUES (...);
-- else: raise a domain "capacity reached" error, caller returns 409
COMMIT;
```

The `SELECT ... FOR UPDATE` on the `Form` row means a second concurrent transaction touching the same form blocks until the first commits or rolls back — so the `COUNT(*)` each transaction sees, and the insert-or-reject decision it makes, is always correct relative to every other in-flight submission for that form. Transactions for *different* forms never contend with each other.

Duplicate-email prevention (CLAUDE.md §29) piggybacks on the same lock and transaction: within the same locked section, also check whether `respondent_email_normalized` already has a `registered` response for this form (when `one_response_per_email` is enabled), rejecting with 409 if so. A partial unique index (`docs/DATABASE.md` §2.6) backstops this at the database level in case application logic is ever bypassed.

## Alternatives considered
- **Denormalized counter column** (`Form.current_registrations`, incremented via an atomic `UPDATE ... SET current_registrations = current_registrations + 1 WHERE current_registrations < max_responses RETURNING id`) — a single-statement atomic check-and-increment, no explicit lock needed, and arguably higher-throughput. **Not chosen** because it requires careful, correct maintenance of the counter across every status transition that affects it (a future `cancelled` status must decrement; a future `waitlist`-to-`registered` promotion must increment) — counter drift is a realistic class of bug once more statuses are active (CLAUDE.md §28), and `COUNT(*) WHERE status = 'registered'` is always trivially correct by construction. Revisit if profiling shows the `COUNT` becomes a real bottleneck (not expected at MVP scale — response counts per form are not large).
- **Application-level distributed lock (e.g. Redis)** — rejected outright per CLAUDE.md §66 (no Redis without a real justification) and unnecessary — PostgreSQL already provides the needed locking primitive within the same transaction that performs the write.
- **Serializable isolation level for the whole transaction** — technically viable (Postgres would detect the conflicting concurrent write and force a retry) but requires explicit retry-loop handling in application code for every capacity-sensitive transaction, and is less immediately explainable than an explicit row lock. `FOR UPDATE` at `READ COMMITTED` (Postgres default) achieves the same correctness guarantee with simpler code.

## Consequences
- Correctness is structural — enforced by Postgres locking semantics, not by hoping requests don't arrive close together. Directly testable: the capacity tests in `docs/DEVELOPMENT.md` §1 fire genuinely concurrent requests and assert `accepted <= capacity`.
- Submission throughput for a *single, specific* form is serialized — acceptable, since realistic per-form submission rates (even a popular event) don't approach a bottleneck for a single-row lock held for the duration of a short insert transaction.
- "Automatic closure" at capacity requires no background job — the same check that enforces capacity on write also tells `GET /api/public/forms/{slug}` whether to show the closed-state message, computed live (see `docs/ARCHITECTURE.md` §6).

## Rationale (interview framing)
Correctness is non-negotiable here — capacity is a business invariant, and this uses a database transaction (not application-level coordination) to guarantee it, matching CLAUDE.md's explicit example diagram. Scalability tradeoff (per-form serialization) is acceptable and understood, not accidental.
