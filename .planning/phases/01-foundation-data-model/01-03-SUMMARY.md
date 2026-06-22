---
phase: 01-foundation-data-model
plan: 03
subsystem: data-access-layer
tags:
  - dal
  - repository-pattern
  - react-cache
  - skeleton
  - typescript

requires:
  - phase: 01-foundation-data-model
    plan: 02
    provides: Drizzle ORM schema tables (study_plans, subjects, topics, schedule_slots, completions, revisions, study_sessions)

provides:
  - 11 DAL skeleton files across 3 subdirectories
  - Typed function signatures for all database operations
  - React.cache() wrapped query pattern for per-request deduplication
  - Scheduler engine stubs with design constraint documentation

affects:
  - 03-subject-topic-management (imports subjects.ts queries + commands)
  - 04-timetable-engine (imports plans/calendar queries, schedule commands, distribute scheduler)
  - 05-study-sessions (imports progress queries + commands)
  - 06-revision-scheduling (imports revisions scheduler)
  - 07-adaptive-rescheduling (imports adapt scheduler)

tech-stack:
  added:
    - React.cache() pattern for DAL query deduplication
  patterns:
    - Repository-lite: all DB access through DAL functions, never direct Drizzle imports
    - Query files use React.cache() wrapper for per-request deduplication
    - Command files throw typed errors ("Not implemented — Phase X")
    - Scheduler files document design constraints from PITFALLS.md

key-files:
  created:
    - src/lib/dal/queries/plans.ts (PlanSummary, PlanDetail, getPlansForUser, getPlanById)
    - src/lib/dal/queries/subjects.ts (SubjectWithTopics, getSubjectsWithTopics, getSubjectById)
    - src/lib/dal/queries/progress.ts (CompletionStats, getCompletionStats, getTodaySchedule)
    - src/lib/dal/queries/calendar.ts (ScheduleSlot, getScheduleSlots)
    - src/lib/dal/commands/plans.ts (CreatePlanInput, PlanResult, createPlan, updatePlan, deletePlan)
    - src/lib/dal/commands/subjects.ts (CreateSubjectInput, CreateTopicInput, create/update/delete subject/topic)
    - src/lib/dal/commands/progress.ts (markTopicStudied, logStudySession)
    - src/lib/dal/commands/schedule.ts (SlotInput, saveSchedule, resetSchedule)
    - src/lib/dal/scheduler/distribute.ts (SchedulerInput, SchedulerOutput, generateSchedule)
    - src/lib/dal/scheduler/revisions.ts (RevisionInput, RevisionRating, scheduleRevision, processReviewRating)
    - src/lib/dal/scheduler/adapt.ts (AdaptInput, adaptSchedule, needsAdaptation)
  modified: []

key-decisions:
  - "DAL layer split into 3 subdirectories: queries/ (reads), commands/ (writes), scheduler/ (timetable engine)"
  - "Query functions wrapped in React.cache() for automatic per-request deduplication"
  - "Command functions throw 'Not implemented — Phase X' errors — callers must handle these stubs"
  - "Scheduler functions designed as async stubs even though the core algorithm will be synchronous — consistent with DAL pattern"
  - "Type exports colocated with functions (PlanSummary, SchedulerInput, etc.) — no separate types/ directory for DAL types"

requirements-completed: []
---

# Phase 01: Foundation — Plan 03 Summary

**Data Access Layer (DAL) directory structure with 11 skeleton files across queries/, commands/, and scheduler/ subdirectories — establishes the architectural boundary that all database access goes through DAL, never direct Drizzle imports.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-22T20:47:46Z
- **Completed:** 2026-06-22T20:49:48Z
- **Tasks:** 3
- **Files created:** 11 (439 insertions)

## Accomplishments

- **DAL query layer (4 files):** `src/lib/dal/queries/` with plans.ts, subjects.ts, progress.ts, calendar.ts. Each file exports `cache()`-wrapped async functions with typed return values (PlanSummary, SubjectWithTopics, CompletionStats, ScheduleSlot). These are the read contracts for all future Server Components and pages.

- **DAL command layer (4 files):** `src/lib/dal/commands/` with plans.ts, subjects.ts, progress.ts, schedule.ts. Each file exports async function stubs with typed input parameters (CreatePlanInput, CreateSubjectInput, SlotInput). These are the write contracts for all future Server Actions. Functions throw "Not implemented — Phase X" errors unless called before their implementation phase.

- **DAL scheduler layer (3 files):** `src/lib/dal/scheduler/` with distribute.ts, revisions.ts, adapt.ts. These contain the core timetable generation engine stubs. Each file documents design constraints from PITFALLS.md (feasibility checks, FSRS, 70% capacity, etc.) ensuring the implementation phase knows the requirements.

- **Architecture boundary established:** All files import from `"react"` (for `cache()`) only — no direct Drizzle imports. This enforces the pattern that downstream code imports from `@/lib/dal/*` instead of `@/lib/db/*`.

- **`pnpm build` passes** with zero TypeScript errors — empty arrays and `throw new Error()` are valid TypeScript at this stage.

## Task Commits

Each task was committed atomically:

1. **Task 1: DAL query layer skeleton files** — `1da988b` (feat)
2. **Task 2: DAL command layer skeleton files** — `b6801e7` (feat)
3. **Task 3: DAL scheduler layer skeleton files** — `72ecd4d` (feat)

## Files Created

### Queries (read operations)

| File | Exports | Type |
|------|---------|------|
| `src/lib/dal/queries/plans.ts` | `getPlansForUser`, `getPlanById` | `PlanSummary`, `PlanDetail` |
| `src/lib/dal/queries/subjects.ts` | `getSubjectsWithTopics`, `getSubjectById` | `SubjectWithTopics` |
| `src/lib/dal/queries/progress.ts` | `getCompletionStats`, `getTodaySchedule` | `CompletionStats` |
| `src/lib/dal/queries/calendar.ts` | `getScheduleSlots` | `ScheduleSlot` |

### Commands (write operations)

| File | Exports | Type |
|------|---------|------|
| `src/lib/dal/commands/plans.ts` | `createPlan`, `updatePlan`, `deletePlan` | `CreatePlanInput`, `PlanResult` |
| `src/lib/dal/commands/subjects.ts` | `createSubject`, `updateSubject`, `deleteSubject`, `createTopic`, `updateTopic`, `deleteTopic` | `CreateSubjectInput`, `CreateTopicInput` |
| `src/lib/dal/commands/progress.ts` | `markTopicStudied`, `logStudySession` | — |
| `src/lib/dal/commands/schedule.ts` | `saveSchedule`, `resetSchedule` | `SlotInput` |

### Scheduler (timetable engine)

| File | Exports | Type |
|------|---------|------|
| `src/lib/dal/scheduler/distribute.ts` | `generateSchedule` | `SchedulerInput`, `SchedulerOutput` |
| `src/lib/dal/scheduler/revisions.ts` | `scheduleRevision`, `processReviewRating` | `RevisionInput`, `RevisionRating` |
| `src/lib/dal/scheduler/adapt.ts` | `adaptSchedule`, `needsAdaptation` | `AdaptInput` |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks completed without issues. Build passes with zero TypeScript errors.

## User Setup Required

None — no external service configuration required at this stage.

## Next Phase Readiness

- **DAL query layer** ready for Phase 3 (Subject & Topic Management) — `getSubjectsWithTopics`, `getSubjectById` stubs available at `@/lib/dal/queries/subjects`
- **DAL command layer** ready for Phase 3 — `createSubject`, `createTopic` stubs available at `@/lib/dal/commands/subjects`
- **DAL query layer** ready for Phase 4 (Timetable Engine) — `getPlansForUser`, `getPlanById`, `getScheduleSlots` stubs available
- **DAL command layer** ready for Phase 4 — `createPlan`, `updatePlan`, `deletePlan`, `saveSchedule`, `resetSchedule` stubs available
- **DAL scheduler** ready for Phase 4 — `generateSchedule` stub with constraint documentation
- **DAL scheduler** ready for Phase 6 (Revision Scheduling) — `scheduleRevision`, `processReviewRating` stubs with FSRS type system
- **DAL scheduler** ready for Phase 7 (Adaptive Rescheduling) — `adaptSchedule`, `needsAdaptation` stubs
- Note: All functions throw "Not implemented" errors until their implementing phase. Do NOT call DAL functions from a phase that hasn't implemented them yet. Each phase will replace the stubs with real Drizzle queries.

---

*Phase: 01-foundation-data-model*
*Completed: 2026-06-22*

## Self-Check: PASSED

All verification criteria met:
- **11 files total:** `ls src/lib/dal/*/*.ts | wc -l` = 11 ✓
- **4 query files:** queries/plans.ts, subjects.ts, progress.ts, calendar.ts ✓
- **4 command files:** commands/plans.ts, subjects.ts, progress.ts, schedule.ts ✓
- **3 scheduler files:** scheduler/distribute.ts, revisions.ts, adapt.ts ✓
- **Each file exports typed async function:** Counts range 1-6 per file, all >0 ✓
- **Build passes:** `pnpm build` exits 0 with "Compiled successfully" ✓
