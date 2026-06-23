# Phase 6: Revision Scheduling - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

App auto-schedules revision sessions at spaced intervals after topics are studied. After marking a topic as studied, revision slots appear on the schedule at FSRS-determined intervals. Revision slots are visually distinct from study slots in the calendar view. The 4-button rating system (Again/Hard/Good/Easy) lets users rate recall quality, and intervals adapt based on ratings.

Requirements: TIME-02 (auto-schedule revision slots after topic studied).

</domain>

<decisions>
## Implementation Decisions

### FSRS Memory State Storage
- **D-01:** Store FSRS card memory state (Stability, Difficulty, Retrievability) as individual columns on the existing `revisions` table — not as a JSON blob or separate table
- **D-02:** One FSRS card per topic per plan (not globally per topic). A topic in one plan has its own memory state independent of any other plan it may belong to
- **D-03:** Use ts-fsrs population defaults for initial parameter seeding — no custom tuning for v1
- **D-04:** Append-only review events with cached latest state. Each review is recorded as a new revision row. The most recent entry for a topic+plan carries the current S/D/R state. Enables replaying from event log if FSRS algorithm updates

### Revision Timing & Slot Creation
- **D-05:** Revision slots are created immediately after marking a topic as studied — `markTopicStudied` triggers `scheduleRevision()` in the same flow (not batched or deferred)
- **D-06:** Revision slots are persisted as `schedule_slots` entries with `type = 'revision-7d'` or `'revision-30d'` — they render in the calendar through the existing schedule_slots pipeline
- **D-07:** When a revision slot lands on a day already at capacity, respect daily capacity limits (max 240 min per day from distribute.ts) — find the nearest available study day rather than overbooking

### Revision Slot Placement
- **D-08:** When the FSRS-optimal day is at capacity, place the revision on the nearest available study day AFTER the preferred date (favor slightly later over slightly earlier for better spacing effect)

### Visual Distinction
- **D-09:** Revision slots shown with a different background color (purple/indigo) from study slots — no separate icon, badge, or compact layout needed for v1. The existing `type` field on `schedule_slots` drives the CSS class

### OpenCode's Discretion
- Review rating UI interaction — how Again/Hard/Good/Easy buttons are presented (inline card expansion, modal, popover)
- Revision limits — how many revisions per topic before "mastered" (if any cap at all)
- Exact color value for revision slot background
- Calendar component implementation details for type-based styling and color switching
- Loading, error, and empty states for revision actions
- How to handle the "revised" topic status transition (existing `topics.status = "revised"` in schema)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — TIME-02 requirement with REQ-ID
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria (3 items), dependency on Phase 5

### Prior Context
- `.planning/phases/05-study-sessions-progress-tracking/05-CONTEXT.md` — Phase 5 decisions: completion flow, markTopicStudied action, progress tracking patterns
- `.planning/phases/04-timetable-engine-schedule-view/04-CONTEXT.md` — Schedule view patterns, calendar components, capacity limits (240 min/day), buffer/catch-up approach
- `.planning/phases/03-subject-topic-management/03-CONTEXT.md` — Prior decisions: cross-subject plans, study time model

### Research & Pitfalls
- `.planning/research/PITFALLS.md` §Pitfall 3 (Naive Revision Scheduling) — Must use FSRS, not fixed arithmetic. §Pitfall 8 (Shame-based design) — No "overdue" indicators. §Technical Debt table — Store raw review events. §Recovery Strategies — Cap first interval at 14 days
- `.planning/research/SUMMARY.md` — FSRS recommended over fixed 7d/30d, 4-button rating, review event logging, parameter seeding strategy

### Existing Codebase
- `src/lib/db/schema.ts` — `revisions` table (id, planId, topicId, originalStudyDate, scheduledDate, interval, isCompleted, completedAt). `schedule_slots.type` includes "revision-7d" and "revision-30d" values. `topics.status` includes "revised"
- `src/lib/dal/scheduler/revisions.ts` — `scheduleRevision()` and `processReviewRating()` stubs with `RevisionRating` type ("again" | "hard" | "good" | "easy"), design constraints from PITFALLS.md
- `src/lib/dal/commands/progress.ts` — `markTopicStudied()` — revision slot creation hooks into this flow
- `src/lib/dal/scheduler/distribute.ts` — Capacity constants: `MAX_MINUTES_PER_DAY = 240`, `CAPACITY_RATIO = 0.7`
- `src/components/schedule-calendar.tsx` — Calendar grid with DndContext, renders schedule_slots
- `src/components/schedule-day-cell.tsx` — Day cell rendering topic cards
- `src/components/topic-card.tsx` — Topic card component, handles `isCompleted` styling
- `src/components/schedule-with-dialogs.tsx` — Calendar with dialogs (has revision-related references)

### Research
- `.planning/research/SUMMARY.md` — Research synthesis
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Architecture patterns (DAL pattern, Server Components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **revisions.ts** (`src/lib/dal/scheduler/revisions.ts:14-41`) — `scheduleRevision()` and `processReviewRating()` stubs already define the `RevisionRating` type and document design constraints. Implementation files into these stubs
- **revisions table** (`src/lib/db/schema.ts:146-166`) — Full schema with planId, topicId, originalStudyDate, scheduledDate, interval, isCompleted. Needs S/D/R columns added per D-01
- **schedule_slots table** (`src/lib/db/schema.ts:94-113`) — Already has `type` field with "revision-7d" and "revision-30d" values. `isCompleted` and `completedAt` for tracking revision completion
- **distribute.ts** (`src/lib/dal/scheduler/distribute.ts:47-50`) — Capacity constants (`MAX_MINUTES_PER_DAY = 240`, `CAPACITY_RATIO = 0.7`) that revision placement must respect
- **progress.ts** (`src/lib/dal/commands/progress.ts:5-41`) — `markTopicStudied()` runs in a transaction. Phase 6 hooks `scheduleRevision()` into this flow after the completion INSERT
- **schedule-calendar.tsx, schedule-day-cell.tsx, topic-card.tsx** — Existing calendar rendering pipeline. schedule_slots render through these components. Adding type-based color switching is straightforward
- **completions table** (`src/lib/db/schema.ts:130-143`) — Audit log for completions. New revision review events should also be logged here or in revisions table for audit trail

### Established Patterns
- **DAL pattern** — Queries in `lib/dal/queries/`, commands in `lib/dal/commands/`, scheduler logic in `lib/dal/scheduler/`. revisions.ts is already in `scheduler/` — keep FSRS logic there
- **Server Action pattern** — `"use server"` actions in `actions.ts` files, called from Client components, followed by `router.refresh()`. `markTopicStudiedAction` is the integration point
- **Transaction pattern** — `markTopicStudied` uses `db.transaction`. Revision creation should join the same transaction for atomicity
- **Session guard** — `auth.api.getSession({ headers: await headers() })` at top of every protected page
- **Schedule_slots rendering** — Calendar queries schedule_slots by planId, renders through DayCell → TopicCard. Revision slots flow through the same pipeline

### Integration Points
- **`markTopicStudied` in progress.ts** — After completing the existing transaction (INSERT completions, UPDATE topics, UPDATE schedule_slots, UPDATE study_plans), call `scheduleRevision()` to create revision slots. This adds Phase 6 to the Phase 5 completion flow
- **Schedule calendar** (`schedule-calendar.tsx`) — Currently renders all schedule_slots. Add type-based color switching for revision types
- **Topic card** (`topic-card.tsx`) — May need interaction mode for review rating (Again/Hard/Good/Easy). The existing click-to-reveal-action pattern from Phase 5 (D-09) could be extended for revision rating
- **Plan detail page** (`/plans/[id]/page.tsx`) — Schedule calendar is rendered here. Revision slots appear automatically once scheduleRevision creates them
- **DAL stubs** — `revisions.ts` in `scheduler/` needs full implementation. `scheduleRevision()` creates schedule_slots entries. `processReviewRating()` updates FSRS state and creates next revision
- **Schema migration** — Add S/D/R columns to `revisions` table (stability: real, difficulty: real, retrievability: real)

</code_context>

<specifics>
## Specific Ideas

- "Use proper FSRS, not fixed 7d/30d arithmetic" — from PITFALLS.md, locked decision carried forward from research
- 4-button rating (Again/Hard/Good/Easy) — from PITFALLS.md, type already defined in revisions.ts
- Cap first-review interval at 14 days — from PITFALLS.md recovery strategies
- Store raw review events for future algorithm retraining — from PITFALLS.md technical debt table
- Revision color should be purple/indigo — distinct from study cards without being alarming
- Favor slightly-late over slightly-early for revision placement to maintain spacing effect

</specifics>

<deferred>
## Deferred Ideas

- Review rating UI interaction details — OpenCode discretion for implementation (inline expansion vs modal vs popover)
- Revision limits / "mastered" threshold — whether to cap revisions after N successful reviews. OpenCode discretion — if not implemented, FSRS naturally extends intervals for well-known topics
- Session duration tracking for revision sessions — consistent with Phase 5's deferred session tracking

</deferred>

---

*Phase: 06-revision-scheduling*
*Context gathered: 2026-06-23*
