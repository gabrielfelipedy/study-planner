---
phase: 04-timetable-engine-schedule-view
plan: 02
subsystem: timetable-engine
tags: [scheduler, distribute, algorithm, dal, drizzle, date-fns, vitest]

# Dependency graph
requires:
  - phase: 01-foundation-data-model
    provides: DB schema with schedule_slots, study_plans, plan_topics tables
  - phase: 03-subject-topic-management
    provides: plan detail page, getPlanById query, subject/topic CRUD
provides:
  - generateSchedule() core timetable algorithm with feasibility checks, buffer capacity, catch-up days
  - saveSchedule() and resetSchedule() DAL commands for schedule persistence
  - getScheduleSlots() query returning slots with topic/subject data via LEFT JOIN
  - getTopicsForPlan() query returning topics with estimated hours for scheduler input
  - Unit test suite (6 tests) covering TIME-01 behaviors
affects:
  - 04-timetable-engine-schedule-view (Plan 03) — Server Action integration, calendar UI

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Deterministic pure-TS scheduling algorithm with no external solver dependency
    - DELETE-then-INSERT pattern for schedule regeneration (D-14)
    - LEFT JOIN for nullable topic references in display queries
    - date-fns for all date arithmetic (eachDayOfInterval, differenceInDays, format, getDay, parseISO)

key-files:
  created:
    - src/lib/dal/scheduler/distribute.ts — core generateSchedule() algorithm
    - tests/lib/dal/scheduler/distribute.test.ts — 6 TIME-01 unit tests
  modified:
    - src/lib/dal/commands/schedule.ts — saveSchedule/resetSchedule + SlotInput type
    - src/lib/dal/queries/calendar.ts — getScheduleSlots with LEFT JOIN + ScheduleSlot type
    - src/lib/dal/queries/plans.ts — added getTopicsForPlan() and TopicForScheduler type

key-decisions:
  - "Scheduler uses 25% planning fallacy buffer + 70% capacity ratio + 1 catch-up day per week"
  - "Catch-up days are tracked in a separate catchUpDates[] array rather than inline buffer slots"
  - "getScheduleSlots uses LEFT JOIN (not INNER JOIN) to include buffer/catch-up slots with null topicId"
  - "saveSchedule uses delete-then-insert (no transaction) per T-04-03 acceptance"
  - "Timezone-safe date handling via date-fns parseISO/getDay instead of raw Date.getDay()"

patterns-established:
  - "DAL command pattern: import db + schema + drizzle-orm helpers, export typed functions"
  - "DAL query pattern: cache() wrapper from React, db.select().from().leftJoin().where().orderBy().all()"
  - "Scheduler error handling: return feasibility failure rather than throwing exceptions"

requirements-completed: [TIME-01]

# Metrics
duration: 14 min
completed: 2026-06-23
---

# Phase 4 Plan 02: Scheduler Engine & DAL Summary

**Deterministic timetable generation algorithm with feasibility checks, round-robin topic distribution, and full DAL persistence layer for schedule operations**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-23T00:03:00Z
- **Completed:** 2026-06-23T00:17:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Implemented `generateSchedule()` core algorithm with 25% planning fallacy buffer, 70% capacity ratio, catch-up day allocation, and MAX_MINUTES_PER_DAY (240) daily cap
- Replaced stub `hoursPerDay` field with `hoursPerWeek` + `studyDays[]` in SchedulerInput per the correct data model
- Added `getTopicsForPlan()` query enabling scheduler to fetch topics with estimated hours
- Implemented `saveSchedule()` with delete-then-insert pattern and `resetSchedule()` for schedule persistence
- Implemented `getScheduleSlots()` with LEFT JOIN for calendar display (handles null topicId for buffer/catch-up slots)
- Created 6 unit tests covering feasibility detection, even distribution, 70% buffer compliance, catch-up day labeling, daily max enforcement, and timezone-safe date assertions
- All types follow nullable topicId pattern (`string | null`) for buffer/catch-up slots

## Task Commits

Each task was committed atomically:

1. **Task 1: implement generateSchedule() in distribute.ts** - `35df5a8` (feat)
2. **Task 2: implement DAL commands and queries for schedule** - `cac221c` (feat)

## Files Created/Modified

- `src/lib/dal/scheduler/distribute.ts` — Core timetable generation algorithm with feasibility check, round-robin distribution, and catch-up day allocation
- `tests/lib/dal/scheduler/distribute.test.ts` — 6 unit tests covering all TIME-01 behaviors
- `src/lib/dal/commands/schedule.ts` — `saveSchedule()` (delete-then-insert) and `resetSchedule()` for schedule persistence
- `src/lib/dal/queries/calendar.ts` — `getScheduleSlots()` with LEFT JOIN returning slots enriched with topic title, subject name, and subject color
- `src/lib/dal/queries/plans.ts` — Added `getTopicsForPlan()` returning topics with estimated hours for scheduler input

## Decisions Made

- **Catch-up days as separate array:** catch-up dates are returned in a `catchUpDates: string[]` field rather than as inline slots in the slots array. The caller can create buffer/catch-up markers as needed. This keeps study slots separate.
- **LEFT JOIN for calendar queries:** Since buffer/catch-up slots have `topicId: null`, LEFT JOIN is essential to include them in display queries. INNER JOIN would silently exclude them.
- **Timezone-safe testing:** Using `date-fns` `parseISO` + `getDay` instead of `new Date(dateStr).getDay()` to avoid timezone-dependent test failures in environments with negative UTC offsets.
- **Planning fallacy buffer applied per-topic:** Each topic's estimated minutes are computed as `Math.round(topic.estimatedHours * 60 * 1.25)`, clamping to the remaining daily capacity.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted baseInput topic hours in test file to match algorithm constraints**
- **Found during:** Task 1 (test creation)
- **Issue:** The plan's original baseInput had topics totaling 6.5h raw (8.125h after 25% buffer), which exceeds the 7h usable capacity (10h/week × 1 week × 0.7). This would make the baseInput infeasible, causing tests expecting feasible output to fail.
- **Fix:** Reduced topic hours to 1h, 1.5h, 2h (4.5h total, 5.625h adjusted), which fits within the 7h usable capacity while preserving test semantics.
- **Files modified:** `tests/lib/dal/scheduler/distribute.test.ts`
- **Verification:** All 6 tests pass
- **Committed in:** `35df5a8` (Task 1 commit)

**2. [Rule 1 - Bug] Fixed timezone-dependent date assertion in test**
- **Found during:** Task 1 (test execution)
- **Issue:** `new Date("2026-01-09").getDay()` returns local timezone day. In UTC-negative timezones, midnight UTC on Friday is Thursday evening, causing `getDay()` to return 4 instead of 5.
- **Fix:** Replaced with `getDay(parseISO(dateStr))` from date-fns, which interprets date strings as local time.
- **Files modified:** `tests/lib/dal/scheduler/distribute.test.ts`
- **Verification:** Catch-up date test now passes in all timezones
- **Committed in:** `35df5a8` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed type mismatch in getScheduleSlots return mapping**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Drizzle returns `type: string` and `isCompleted: boolean | null` from DB, which don't satisfy the strict `ScheduleSlot` union type or non-nullable `boolean`.
- **Fix:** Replaced spread operator with explicit field mapping including `type` cast and null defaults.
- **Files modified:** `src/lib/dal/queries/calendar.ts`
- **Verification:** `npx tsc --noEmit --project tsconfig.json` passes with zero errors on our files
- **Committed in:** `cac221c` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- **Planning fallacy buffer + 70% capacity ratio creates tight bounds:** The 25% buffer on top of 70% capacity means only about 56% of raw `hoursPerWeek` is actually usable for distribution. Test data must account for this compound effect. The baseInput hours were reduced to keep tests realistic.

## Threat Surface

No new security-relevant surface introduced — all DAL functions are called from server-side code (Server Actions or other server components) with existing session guards.

## Next Phase Readiness

- Scheduler algorithm complete with all TIME-01 behaviors (feasibility, distribution, buffer, catch-up, daily cap)
- DAL persistence layer ready for Server Action integration
- Ready for Plan 03: Server Action orchestration, schedule calendar UI component, and drag-and-drop rescheduling

## Self-Check: PASSED

- ✅ `src/lib/dal/scheduler/distribute.ts` — exists
- ✅ `tests/lib/dal/scheduler/distribute.test.ts` — exists
- ✅ `src/lib/dal/commands/schedule.ts` — exists
- ✅ `src/lib/dal/queries/calendar.ts` — exists
- ✅ `src/lib/dal/queries/plans.ts` — exists
- ✅ `35df5a8` — Task 1 commit verified
- ✅ `cac221c` — Task 2 commit verified

---

*Phase: 04-timetable-engine-schedule-view*
*Completed: 2026-06-23*
