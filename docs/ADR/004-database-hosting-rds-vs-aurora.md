# ADR-004: RDS PostgreSQL (Standard) Over Aurora at MVP

## Status
Proposed — confirm during Phase 1/8 infrastructure setup

## Context
CLAUDE.md §6/§47 lists "PostgreSQL on AWS" and "Aurora/RDS" as acceptable, without committing to one. Both are managed PostgreSQL-compatible services on AWS; the choice is a cost/operational-complexity tradeoff, not a correctness one.

## Decision
Default to standard Amazon RDS for PostgreSQL (single instance for `development`/`staging`; Multi-AZ optional for `production`, decided at Phase 8 based on actual uptime requirements) rather than Aurora PostgreSQL, at MVP.

## Alternatives considered
- **Aurora PostgreSQL** — better read-scaling (Aurora Replicas), faster failover, higher baseline durability guarantees. **Not chosen for MVP** — meaningfully higher baseline cost (Aurora's storage/compute pricing model has a higher floor than RDS) for scaling characteristics Formcraft's MVP traffic does not need. Same PostgreSQL wire protocol and SQL dialect, so this is a hosting decision, not a schema or application-code decision — migrating later is realistic if growth demands it.
- **Self-managed PostgreSQL on EC2** — rejected. Forgoes managed backups/patching/failover for no offsetting benefit at this scale; pure operational-complexity cost with no upside.

## Consequences
- Lower baseline AWS cost during MVP/early growth.
- A future move to Aurora (if read load or failover SLAs demand it) is a data-layer migration (snapshot/restore or logical replication), not an application rewrite.
- Multi-AZ (RDS) vs. Aurora's inherently multi-AZ storage architecture is a separate availability decision to make explicitly at Phase 8, not implied by this choice.

## Rationale (interview framing)
Cost and operational complexity favor RDS at current scale; scalability is preserved as an option (same engine) rather than foreclosed. This is exactly the kind of decision CLAUDE.md §75 asks to be made by weighing multiple dimensions rather than defaulting to "the fancier option."
