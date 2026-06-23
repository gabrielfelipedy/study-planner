---
phase: 04-timetable-engine-schedule-view
plan: 01
subsystem: database, testing, infra
tags: dnd-kit, vitest, drizzle, sqlite, drag-and-drop

# Dependency graph
requires:
  - phase: 03-subject-topic-management
    provides: schema with study_plans, schedule_slots, topics tables
provides:
  - dnd-kit packages (core, sortable, utilities) for drag-and-drop
  - Vitest testing infrastructure with React/JSDOM support
  - Schema with nullable topicId for buffer/catch-up slots
  - Generation snapshot fields on study_plans for staleness detection
  - Drizzle migration 0003 for local dev database
affects:
  - Timetable Engine (schedule generation)
  - Schedule View (drag-and-drop UI)
  - Adaptive Rescheduling (staleness detection)

# Tech tracking
tech-stack:
  added:
    - "@dnd-kit/core@^6.3.1"
    - "@dnd-kit/sortable@^10.0.0"
    - "@dnd-kit/utilities@^3.2.2"
    - "vitest@^3.2.6"
    - "@vitejs/plugin-react@^4.7.0"
    - "@testing-library/react@^16.3.2"
    - "jsdom@^26.1.0"
  patterns:
    - Test files go in tests/ with vitest.config.ts in same directory
    - Vitest uses jsdom environment with globals and @ path alias

key-files:
  created:
    - tests/vitest.config.ts
    - src/lib/db/migrations/0003_careless_dragon_lord.sql
    - src/lib/db/migrations/meta/0003_snapshot.json
  modified:
    - package.json
    - pnpm-lock.yaml
    - src/lib/db/schema.ts
    - src/lib/db/migrations/meta/_journal.json

key-decisions:
  - "Using pnpm instead of npm for package management (project convention)"
  - "Adding include/exclude patterns to vitest config to scope test discovery to project tests"

patterns-established:
  - "Vitest config in tests/ with jsdom environment and @ path alias"
  - "Test files excluded from .opencode directory"

requirements-completed: [TIME-01, TIME-03, PROG-03]

# Metrics
duration: 15 min
completed: 2026-06-23
---

# Phase 4 Plan 1: Dependency and Schema Infrastructure Summary

**Installed @dnd-kit packages for drag-and-drop, set up Vitest testing infrastructure, and updated the schedule_slots schema with nullable topic_id and generation snapshot fields on study_plans**

## Performance

- **Duration:** 15 min
- **Started:** 2026-06-23T02:48:00Z
- **Completed:** 2026-06-23T03:03:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Installed @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities for drag-and-drop schedule reordering
- Installed Vitest with @vitejs/plugin-react, @testing-library/react, and jsdom for testing
- Created `tests/vitest.config.ts` with jsdom environment, globals, and `@` path alias
- Made `schedule_slots.topic_id` nullable to support buffer and catch-up slots without topics
- Updated type comment to document "buffer" and "catch-up" slot types
- Added generation input snapshot fields to `study_plans` (`lastScheduleGeneratedAt`, `lastScheduleHoursPerWeek`, `lastScheduleStudyDays`, `lastScheduleStartDate`, `lastScheduleDeadline`) for staleness detection (D-13)
- Generated and applied Drizzle migration `0003_careless_dragon_lord`

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Install packages, create vitest config, update schema, generate migration** — `09ec144` (feat(04-01))

**Plan metadata:** Included in same commit (per plan: Task 1 + Task 2 committed together)

## Files Created/Modified

- `package.json` — Added 7 packages (3 dnd-kit, 4 testing)
- `pnpm-lock.yaml` — Lock file updated
- `tests/vitest.config.ts` — Vitest configuration with jsdom, React plugin, `@` alias (17 lines)
- `src/lib/db/schema.ts` — Nullable topicId, buffer/catch-up types, generation snapshot fields
- `src/lib/db/migrations/0003_careless_dragon_lord.sql` — Migration recreating schedule_slots and adding columns
- `src/lib/db/migrations/meta/0003_snapshot.json` — Migration snapshot
- `src/lib/db/migrations/meta/_journal.json` — Journal entry idx 3 added

## Decisions Made

- **pnpm package manager** — Used pnpm rather than npm to match project convention (discovered at runtime). pnpm-lock.yaml already existed.
- **Vitest include/exclude patterns** — Added `include` and `exclude` patterns to scope test discovery to project files only, preventing vitest from picking up unrelated `.opencode/` test files.
- **Migration file name** — Generated as `0003_careless_dragon_lord.sql` rather than the originally expected `0003_gentle_moondragon.sql` (hash-based naming from Drizzle).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Using pnpm instead of npm for package installation**
- **Found during:** Task 1 (Install packages)
- **Issue:** `npm install` failed because the project uses pnpm (pnpm-lock.yaml present, node_modules uses .pnpm structure)
- **Fix:** Used `pnpm add` and `pnpm add -D` instead of `npm install`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** All packages installed, module resolution succeeds
- **Committed in:** 09ec144

**2. [Rule 2 - Missing Critical] Added include/exclude patterns to vitest config**
- **Found during:** Task 2 (Verify vitest config runs)
- **Issue:** Without explicit include/exclude, vitest's default test discovery picked up unrelated `.opencode/` test files, causing 11 test failures in pre-existing GSD tooling tests
- **Fix:** Added `include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]` and `exclude: ["node_modules", "dist", ".next", ".opencode"]`
- **Files modified:** tests/vitest.config.ts
- **Verification:** Vitest reports "No test files found" (expected since no project tests exist yet)
- **Committed in:** 09ec144

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correct execution. pnpm usage matches project convention. Vitest include/exclude prevents false failures from unrelated test files.

## Known Stubs

None — all files created are complete and functional.

## Threat Flags

None — no new security-relevant surface introduced (npm packages from registry, reversible schema migration).

## Issues Encountered

- **Migration file name:** Drizzle generated `0003_careless_dragon_lord.sql` instead of the plan's expected `0003_gentle_moondragon.sql`. This is hash-based naming and functionally equivalent.
- **Migration also adds pre-existing columns:** The generated migration includes ALTER TABLE statements for `hours_per_week`, `study_days`, and `archived_at` on `study_plans` and `archived_at` on `subjects`. These columns already exist in the schema but were missing from the local SQLite database, so Drizzle included them. This is harmless.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- dnd-kit packages installed and importable for drag-and-drop in schedule view
- Vitest configured and ready for unit test creation
- Schema updated with nullable topicId for buffer/catch-up slots
- Migration applied to local dev database
- Ready for next plan (04-02: Schedule component implementation)

---

## Self-Check: PASSED

- [x] `tests/vitest.config.ts` — exists
- [x] `src/lib/db/migrations/0003_careless_dragon_lord.sql` — exists
- [x] `src/lib/db/migrations/meta/0003_snapshot.json` — exists
- [x] Commit `09ec144` — confirmed in git log

*Phase: 04-timetable-engine-schedule-view*
*Completed: 2026-06-23*
