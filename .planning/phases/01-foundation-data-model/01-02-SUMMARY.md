---
phase: 01-foundation-data-model
plan: 02
subsystem: database
tags:
  - drizzle-orm
  - sqlite
  - drizzle-kit
  - turso
  - libsql

requires:
  - phase: 01-foundation-data-model
    plan: 01
    provides: Next.js scaffold, Drizzle config, dependencies, env templates
provides:
  - Database client with Turso/local SQLite dual-mode connection
  - All 9 Drizzle ORM table definitions in a single schema file
  - Generated SQL migration for all tables
  - Local SQLite database with all tables created
affects:
  - 02-authentication (imports users table)
  - 03-subject-topic-management (imports subjects, topics tables)
  - 04-timetable-engine (imports study_plans, plan_topics, schedule_slots tables)
  - 05-study-sessions (imports study_sessions, completions tables)
  - 06-revision-scheduling (imports revisions table)

tech-stack:
  added:
    - drizzle-orm/libsql (SQLite dialect for Turso compatibility)
  patterns:
    - Single-file schema for all 9 tables (per D-02)
    - Dual-mode database client: local SQLite dev, Turso remote prod (per D-03)
    - All IDs as UUID text strings (not auto-increment integers)
    - ISO 8601 string timestamps (timezone handling in application code)
    - Foreign keys with cascade/set-null onDelete for referential integrity

key-files:
  created:
    - src/lib/db/client.ts (database client singleton with Turso/local SQLite connection)
    - src/lib/db/schema.ts (all 9 Drizzle ORM table definitions)
    - src/lib/db/migrations/0000_first_magdalene.sql (generated migration SQL)
    - src/lib/db/migrations/meta/0000_snapshot.json (Drizzle Kit snapshot)
    - src/lib/db/migrations/meta/_journal.json (migration journal)
  modified: []

key-decisions:
  - "Single-file schema for all 9 tables (per D-02) — 9 tables is small enough that splitting by domain would add complexity without benefit"
  - "All IDs use text() UUID primary keys — enables offline-generated IDs and avoids sequential ID guessing"
  - "Foreign keys with cascade onDelete for owned entities (subjects, topics, plan_topics, schedule_slots, completions, revisions) and set-null for optional references (study_sessions planId/topicId)"
  - "SQLite dialect for Drizzle ORM (drizzle-orm/sqlite-core) — Turso is wire-compatible with SQLite"
  - "Indexes on schedule_slots(planId, date) and revisions(planId, scheduledDate) for efficient calendar queries"
  - "Unique constraint on plan_topics(planId, topicId) prevents duplicate topic assignment"

requirements-completed: []
---

# Phase 01: Foundation — Plan 02 Summary

**Database client with Turso/local SQLite dual-mode connection and all 9 Drizzle ORM schema tables (users, subjects, topics, study_plans, plan_topics, schedule_slots, study_sessions, completions, revisions) with generated migration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-22T20:43:16Z
- **Completed:** 2026-06-22T20:46:23Z
- **Tasks:** 3
- **Files created:** 5 (1156 insertions)

## Accomplishments

- Database client (`src/lib/db/client.ts`) with Turso/local SQLite dual-mode connection — falls back to local file when `TURSO_DATABASE_URL` is unset
- Complete schema (`src/lib/db/schema.ts`) with all 9 Drizzle ORM table definitions using `drizzle-orm/sqlite-core`
- Migration generated via `drizzle-kit generate` with proper SQL for all tables, foreign keys, indexes, and unique constraints
- Local SQLite database (`data/dev.db`) created with all 9 tables verified by SQLite query
- `pnpm build` passes with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database client for Turso/local SQLite** — `4f58774` (feat)
2. **Task 2: Create all 9 Drizzle ORM schema tables** — `da1a75f` (feat)
3. **Task 3: Generate and run database migration against local SQLite** — `ae145b0` (feat)

## Files Created

- `src/lib/db/client.ts` — Database client singleton with `createClient` from `@libsql/client`, wraps Drizzle ORM with schema exports. Dev: `file:./data/dev.db`, Prod: `TURSO_DATABASE_URL` env var.
- `src/lib/db/schema.ts` — All 9 Drizzle ORM table definitions: `users`, `subjects`, `topics`, `studyPlans`, `planTopics`, `scheduleSlots`, `studySessions`, `completions`, `revisions`. Uses `text()` for all primary keys (UUID), `integer({ mode: "boolean" })` for booleans, `real()` for floats. Includes foreign keys with cascade/set-null onDelete, unique indexes, and composite indexes.
- `src/lib/db/migrations/0000_first_magdalene.sql` — Generated migration SQL creating all 9 tables, foreign keys, unique indexes (`uq_plan_topic`, `users_email_unique`), and composite indexes (`idx_slots_plan_date`, `idx_revisions_plan_date`).
- `src/lib/db/migrations/meta/0000_snapshot.json` — Drizzle Kit schema snapshot for migration tracking.
- `src/lib/db/migrations/meta/_journal.json` — Migration journal tracking applied migrations.

## Decisions Made

- **Single-file schema:** All 9 tables defined in one `schema.ts` file per D-02. 9 tables is small enough that domain-splitting would add complexity without benefit.
- **UUID text primary keys:** All tables use `text().primaryKey()` instead of auto-increment integers. Enables offline-generated IDs and avoids sequential ID guessing.
- **SQLite dialect:** Used `drizzle-orm/sqlite-core` imports (not pg-core or mysql-core) for Turso compatibility.
- **Dual-mode connection:** Client falls back to `file:./data/dev.db` when `TURSO_DATABASE_URL` is unset — enables offline development without Turso, per D-03.
- **Cascade deletes:** Foreign keys use `onDelete: "cascade"` for owned relationships and `onDelete: "set null"` for optional references (study sessions can outlive their parent plan/topic).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks completed without issues.

## User Setup Required

None — no external service configuration required at this stage. Turso database setup will occur when deploying to production.

## Next Phase Readiness

- Database foundation complete — client and schema ready for all downstream phases
- `users` table available for Phase 2 (authentication)
- `subjects`, `topics` tables available for Phase 3 (subject & topic management)
- `study_plans`, `plan_topics`, `schedule_slots` tables available for Phase 4 (timetable engine)
- `study_sessions`, `completions` tables available for Phase 5 (study sessions & progress)
- `revisions` table available for Phase 6 (revision scheduling)
- Note: `data/dev.db` is gitignored — must be recreated via `drizzle-kit push` when cloning the repo

---

*Phase: 01-foundation-data-model*
*Completed: 2026-06-22*

## Self-Check: PASSED

All verification criteria met:
- **client.ts exists:** `test -f src/lib/db/client.ts` ✓
- **client.ts exports db:** `grep -q "export const db"` ✓
- **schema.ts defines 9 tables:** `grep -c "export const" = 9` ✓
- **Build passes:** `pnpm build` exits 0 ✓
- **Migration generated:** `src/lib/db/migrations/0000_first_magdalene.sql` exists ✓
- **Database created:** `data/dev.db` exists ✓
- **All 9 tables present:** Verified via SQLite query — all 9 `✓` ✓
