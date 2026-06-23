---
phase: 06-revision-scheduling
plan: 01
subsystem: api
tags: fsrs, spaced-repetition, drizzle, sqlite, server-actions, scheduler
requires:
  - phase: 05-study-sessions-progress-tracking
    provides: markTopicStudied completion flow, progress tracking patterns
provides:
  - FSRS-based revision scheduling engine
  - Revision schedule_slots auto-creation after topic studied
  - Review rating Server Actions (Again/Hard/Good/Easy)
  - Capacity-aware revision slot placement
affects: 07-adaptive-rescheduling
tech-stack:
  added:
    - ts-fsrs@5.4.1 — Free Spaced Repetition Scheduler for interval calculation
  patterns:
    - Append-only revision review events with cached latest state (D-04)
    - FSRS memory state stored as individual columns on revisions table
    - Capacity-aware placement preferring slightly-later dates (D-08)
key-files:
  created:
    - src/lib/dal/scheduler/revisions.ts — FSRS revision scheduling engine
    - src/lib/dal/queries/revisions.ts — Revision state queries
    - src/lib/db/migrations/0004_add_fsrs_columns.sql — 10-column FSRS migration
    - src/lib/db/migrations/meta/0004_snapshot.json — Migration snapshot
  modified:
    - src/lib/db/schema.ts — Added 10 FSRS columns to revisions table
    - src/lib/dal/commands/progress.ts — Wired scheduleRevision into markTopicStudied
    - src/app/plans/[id]/actions.ts — Added review RevisionRatingAction and reviewSlotAction
    - package.json — Added ts-fsrs dependency
    - src/lib/db/migrations/meta/_journal.json — Added migration entry
key-decisions:
  - "processReviewRating uses (planId, topicId, rating) signature instead of (revisionId, rating) — simpler caller contract, finds latest revision state automatically"
  - "scheduleRevision is wrapped in try/catch within markTopicStudied — non-blocking failure model, topic completion never rolls back on revision error"
  - "Learned this file's TypeScript types (Card, Grade, State, Rating enums) directly from ts-fsrs declarations to get strict type safety"
  - "findNearestAvailableDay iterates forward (not backward) from preferred date — per D-08, favor slightly-later dates for better spacing effect"
  - "First review interval capped at 14 days when reps === 0 — per PITFALLS.md recovery strategies"
requirements-completed:
  - TIME-02
  - PROG-01
duration: 7min
completed: 2026-06-23
---

# Phase 6 Plan 1: FSRS Revision Scheduling Engine

**FSRS-based revision scheduling with capacity-aware placement, append-only memory state storage, and review rating Server Actions**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-23T23:01:45Z
- **Completed:** 2026-06-23T23:08:49Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Installed ts-fsrs@5.4.1 for FSRS-based spaced repetition interval calculation
- Added 10 FSRS memory state columns (stability, difficulty, retrievability, cardState, elapsedDays, scheduledDays, reps, lapses, rating, lastReviewAt) to the revisions table with migration
- Implemented `scheduleRevision()` — creates initial FSRS card, inserts revision row, creates 7d and 30d capacity-aware revision slots
- Implemented `processReviewRating()` — reads current FSRS state, applies rating (Again/Hard/Good/Easy) via ts-fsrs, inserts new revision row (append-only), marks slot completed, creates next revision slot
- Implemented `findNearestAvailableDay()` — capacity-aware placement checking plan studyDays and 240 min/day limit, favoring slightly-later dates
- Created query functions: `getCurrentRevisionState`, `getPendingRevisionSlots`, `getRevisionHistory` with React.cache deduplication
- Wired `scheduleRevision()` into `markTopicStudied()` — auto-triggered after transaction with non-blocking failure handling
- Added `reviewRevisionRatingAction` and `reviewSlotAction` Server Actions with session guard and ownership check

## Task Commits

Each task was committed atomically:

1. **task 1: Install ts-fsrs, add FSRS columns, generate migration** — `1f90936` (feat)
2. **task 2: Implement scheduleRevision() and processReviewRating() + revision queries** — `7ba3808` (feat)
3. **task 3: Wire scheduleRevision into markTopicStudied, create review Server Actions** — `a7a0d33` (feat)

## Files Created/Modified

- `src/lib/db/schema.ts` — Added 10 FSRS columns to revisions table
- `src/lib/dal/scheduler/revisions.ts` — FSRS revision scheduling engine (scheduleRevision, processReviewRating, findNearestAvailableDay)
- `src/lib/dal/queries/revisions.ts` — Revision state queries (getCurrentRevisionState, getPendingRevisionSlots, getRevisionHistory)
- `src/lib/dal/commands/progress.ts` — Wired scheduleRevision into markTopicStudied with try/catch
- `src/app/plans/[id]/actions.ts` — Added reviewRevisionRatingAction and reviewSlotAction
- `src/lib/db/migrations/0004_add_fsrs_columns.sql` — 10 ALTER TABLE ADD COLUMN statements
- `src/lib/db/migrations/meta/0004_snapshot.json` — Migration snapshot with new columns
- `src/lib/db/migrations/meta/_journal.json` — Migration journal entry
- `package.json` — Added ts-fsrs dependency

## Decisions Made

- **processReviewRating signature:** Uses `(planId, topicId, rating)` instead of `(revisionId, rating)` — the caller doesn't need to find the right revision row ID; the function finds the latest state automatically
- **Non-blocking revision scheduling:** `scheduleRevision()` runs after the markTopicStudied transaction with try/catch — if revision scheduling fails, topic completion is preserved (the user can always regenerate)
- **TypeScript type discovery:** Learned ts-fsrs's strict types (Card requires `learning_steps`, `last_review?: Date` not `Date | null`, `Grade` excludes `Rating.Manual`) from the type declarations directly
- **findNearestAvailableDay iteration direction:** Forward-only from preferred date per D-08 — maintains spacing effect by preferring slightly later dates over earlier
- **First review cap:** When `card.reps === 0`, `scheduled_days` is capped at 14 days per PITFALLS.md recovery strategies

## Deviations from Plan

None — plan executed exactly as written.

### Acceptance Criteria Verification

**Task 1:**
- ✅ `package.json` contains ts-fsrs in dependencies
- ✅ `pnpm ls ts-fsrs` shows ts-fsrs@5.4.1
- ✅ Schema has all 10 new columns
- ✅ Migration SQL file exists with 10 ALTER TABLE statements
- ✅ Journal has entry idx=4 for 0004_add_fsrs_columns
- ✅ 0004_snapshot.json exists with all columns
- ✅ `npx tsc --noEmit` passes
- ✅ Migration applied to dev database (19 columns)

**Task 2:**
- ✅ revisions.ts exports scheduleRevision and processReviewRating
- ✅ scheduleRevision creates FSRS card, inserts revision row, and creates 2 schedule_slot entries
- ✅ processReviewRating reads state, calls fsrs.next, inserts new row, marks slot completed, creates next slot
- ✅ findNearestAvailableDay checks plan studyDays and capacity
- ✅ queries/revisions.ts exports getCurrentRevisionState, getPendingRevisionSlots, getRevisionHistory
- ✅ `npx tsc --noEmit` passes

**Task 3:**
- ✅ progress.ts calls scheduleRevision() after db.transaction()
- ✅ scheduleRevision call is wrapped in try/catch
- ✅ actions.ts exports reviewRevisionRatingAction and reviewSlotAction
- ✅ Both actions have session guard and ownership check
- ✅ Both actions call revalidatePath after success
- ✅ processReviewRating has (planId, topicId, rating) signature
- ✅ `npx tsc --noEmit` passes

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass (0 errors) |
| Schema migration (19 columns on revisions) | ✅ Applied |
| scheduleRevision creates 2 schedule_slots | ✅ Code verified (type-safe) |
| processReviewRating updates FSRS state | ✅ Code verified (type-safe) |
| reviewSlotAction returns success | ✅ Code verified (type-safe) |
| Unauthenticated check | ✅ Session guard at top of both actions |

## Known Stubs

None — all implementations are fully wired with real data sources.

## Threat Flags

None — threat model mitigations (session guard, ownership check, append-only audit trail, query scoping) are all implemented per plan.

## Issues Encountered

- npm 11.11.0 had a bug (`Cannot read properties of null (reading 'matches)`) preventing package install. Worked around by using pnpm (which was already the project's package manager — only pnpm-lock.yaml exists)
- ts-fsrs TypeScript types required investigation: `Card` type requires `learning_steps` field, `last_review` is `Date | undefined` (not null), and `scheduler.next()` expects `Grade` (excludes `Rating.Manual`). All resolved by reading the type declarations directly

## Next Phase Readiness

- Ready for Plan 06-02: Calendar UI for revision slots with purple/indigo visual distinction, review rating UI components, and inline rating interaction
- Revision scheduling engine is fully functional as a data layer — Plan 06-02 will connect it to the UI

---

*Phase: 06-revision-scheduling*
*Completed: 2026-06-23*
