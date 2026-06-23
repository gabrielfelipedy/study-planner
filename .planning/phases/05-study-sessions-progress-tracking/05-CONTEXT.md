# Phase 5: Study Sessions & Progress Tracking - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can mark topics as studied and see real-time completion progress in the schedule view. This is the feedback loop — after topics are scheduled (Phase 4), users study and track what they've done. The app records completions and reflects progress in the UI.

Requirements: PROG-01 (mark topics as studied during sessions), PROG-02 (see overall progress percentage).

</domain>

<decisions>
## Implementation Decisions

### Completion flow
- **D-01:** Both inline calendar marking AND a dedicated study session page
- **D-02:** Inline flow is 2-step — click a pending topic card in the calendar to reveal a "Mark studied" button, then click to confirm. Prevents accidental marks.
- **D-03:** Dedicated session page (`/plans/[id]/study`) is a simple today's-topics checklist — shows today's scheduled topics, user marks each as studied. No timer. Optional duration input per topic (not required).
- **D-04:** After marking a topic as studied, show brief positive feedback (subtle toast or checkmark animation). Progress bar updates immediately.

### Session tracking depth
- **D-05:** Just mark completion — no duration tracking, no session logging for v1. The `study_sessions` schema table is defined but not used in Phase 5. Only the `completions` audit table is written. `topics.status` is set to "studied". `schedule_slots.isCompleted` is set to true. `study_plans.completedTopics` is incremented.

### Progress visibility
- **D-06:** Plan detail page — progress bar already renders `{completedTopics}/{totalTopics}` with percentage. Keep as-is.
- **D-07:** Plans list page (`/plans`) — plan cards already show progress percentage. Keep as-is.
- **D-08:** Homepage (`/`) — add a new progress summary section showing today's completion status (topics studied today vs scheduled today). Quick-glance summary.

### Calendar completion UI
- **D-09:** Click a pending topic card in the schedule calendar → the card expands or reveals a "Mark studied" button inline within the card → click to confirm. This distinguishes from drag interaction (drag starts after longer press on desktop, or via dedicated handle).

### OpenCode's Discretion
- Exact toast/animation design for completion feedback
- Hourglass/duration input design on session page (if added)
- Homepage progress summary layout and content
- Calendar inline button positioning and animation
- Empty state on session page (no topics scheduled today)
- Loading and error states for mark action

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — PROG-01, PROG-02 requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria (4 items), dependency on Phase 4

### Prior Context
- `.planning/phases/04-timetable-engine-schedule-view/04-CONTEXT.md` — Schedule view patterns, calendar components, buffer/catch-up approach
- `.planning/phases/03-subject-topic-management/03-CONTEXT.md` — Prior decisions: inline patterns, minimal UI, archive pattern
- `.planning/phases/02-authentication/02-CONTEXT.md` — Auth patterns, middleware, session availability

### Existing Codebase
- `src/lib/db/schema.ts` — `study_sessions`, `completions`, `topics.status` (pending/studied/revised), `schedule_slots.isCompleted`, `study_plans.completedTopics` — all schema tables pre-defined
- `src/lib/dal/queries/progress.ts` — `getCompletionStats()` stub — needs implementation
- `src/lib/dal/commands/progress.ts` — `markTopicStudied()` stub — needs implementation (insert completion, update topics.status, update schedule_slots.isCompleted, increment study_plans.completedTopics)
- `src/app/plans/[id]/page.tsx` — Plan detail page with existing progress bar and schedule rendering
- `src/components/topic-card.tsx` — Topic card with isCompleted styling (opacity-60), "Pending" badge, drag support
- `src/components/schedule-day-cell.tsx` — Day cell that renders topic cards, droppable for drag
- `src/components/schedule-calendar.tsx` — Calendar grid with DndContext, drag handling, week layout
- `src/components/plan-card.tsx` — Plan card on /plans list, already shows progress percentage
- `src/app/page.tsx` — Homepage, needs progress summary section added
- `src/app/plans/[id]/actions.ts` — Reference pattern for Server Actions (moveSlotAction, regenerateScheduleAction)

### Research
- `.planning/research/SUMMARY.md` — Research synthesis
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Architecture patterns (DAL pattern, Server Components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **topic-card.tsx** — Already handles `isCompleted` styling (opacity-60) and shows "Pending" badge (line 69). Needs an additional interaction mode: click-to-reveal-action + confirm. The card already uses `useSortable` for drag — ensure click interaction doesn't conflict with drag activation (desktop: 5px distance threshold, mobile: 300ms delay).
- **schedule-day-cell.tsx** — Renders `TopicCard` components inside a `SortableContext`. May need to pass click handlers or selection state down.
- **schedule-calendar.tsx** — Full DndContext with drag overlay. Topics per day rendered via SortableContext in day cells. Existing scaffold for adding completion actions.
- **plan-card.tsx** (`src/components/plan-card.tsx:9-10`) — Already computes and displays `{completedTopics}/{totalTopics}` + `{progress}%`. No changes needed for v1.
- **Plan detail page** (`src/app/plans/[id]/page.tsx:70-90`) — Progress bar already renders. Shows `{completedTopics} / {totalTopics}` text and percentage with a styled progress bar (`h-2 w-full rounded-full bg-muted` + `bg-primary transition-all`). Denormalized fields from `study_plans` table.
- **DAL stubs** — `markTopicStudied` (commands/progress.ts:7-13) already outlines the TODO steps. `getCompletionStats` (queries/progress.ts:19-22) returns stub data. Both ready for implementation.
- **Server Action pattern** — `src/app/plans/[id]/actions.ts` has `moveSlotAction` as reference for server-action-then-refresh pattern.
- **Existing stub for completion** — `scheduleSlots` uses `isCompleted` boolean + `completedAt` timestamp. `topics` uses `status` text field with "pending" as default, "studied" and "revised" as valid transitions.

### Established Patterns
- **Server Component + Client form** — Plan detail page is a Server Component that fetches data, passes to Client components for interactivity. The mark-complete action will follow the same pattern.
- **Server Action pattern** — `"use server"` functions in `actions.ts` files, called from Client components, followed by `router.refresh()`.
- **Session guard** — `auth.api.getSession({ headers: await headers() })` at top of every protected page.
- **DAL pattern** — Queries in `lib/dal/queries/` use `React.cache()`. Commands in `lib/dal/commands/` are regular async functions. The mark and completion logic fits naturally in `commands/progress.ts` and `queries/progress.ts`.
- **Progress bar styling** — `h-2 w-full rounded-full bg-muted` outer + `bg-primary transition-all` inner bar with dynamic width.
- **Layout** — `mx-auto max-w-5xl px-4 py-8` on plan detail.
- **Empty state** — `rounded-lg border-2 border-dashed border-border p-12 text-center` pattern.

### Integration Points
- **Plan detail page** (`/plans/[id]/page.tsx`) — Schedule calendar already renders with slots including `isCompleted`. Adding inline "Mark studied" requires modifying `topic-card.tsx` or wrapping it with action context in `schedule-day-cell.tsx`.
- **Homepage** (`src/app/page.tsx`) — Currently shows a public landing page or redirects. After Phase 2 auth, logged-in users see links. Needs a progress summary section added.
- **DAL commands/progress.ts** — `markTopicStudied` needs: INSERT into completions, UPDATE topics.status = "studied", UPDATE schedule_slots.isCompleted = true + completedAt, UPDATE study_plans.completedTopics = completedTopics + 1. All in a transaction.
- **DAL queries/progress.ts** — `getCompletionStats` needs to query plan-level stats (denormalized in study_plans) and optionally today's stats (schedule_slots for today with isCompleted).
- **Server Actions** — New actions needed: `markTopicStudiedAction(planId, topicId)` for inline, and potentially a batch mark for the session page.
- **New route** — `/plans/[id]/study` page for the dedicated session checklist view.

### Potential Schema Notes
- No schema changes needed — `study_sessions`, `completions`, `topics.status`, `schedule_slots.isCompleted`, `study_plans.completedTopics` all pre-defined and ready.
- `study_sessions` table is defined but will not be used in this phase — existing schema only.

</code_context>

<specifics>
## Specific Ideas

- "Both inline calendar marking + dedicated session page" — users can quickly mark from the calendar or use the focused session page for structured study
- Inline marking should feel safe — two-step prevents accidentally marking topics unstudied (there's no undo beyond manual unmark)
- Session page is simple checklist, not a timer — avoids feature creep into Pomodoro territory (deferred to v2 TIMR-01)
- Homepage summary: show today's scheduled vs completed for a quick daily check-in
- Positive-only framing — no "overdue" or "missed" labels (consistent with Phase 8 positive-metrics requirement)

</specifics>

<deferred>
## Deferred Ideas

- Session duration tracking (study_sessions table) — belongs in a future phase or v2 if duration analytics become desired
- Pomodoro / focus timer integration (TIMR-01) — v2 requirement, separate from this phase
- Un-mark topic as studied — not implemented for v1 to keep the flow simple and intentional; user would need to re-study to mark again
- Study session notes / journaling — could enrich the session page but adds complexity beyond v1

</deferred>

---

*Phase: 05-study-sessions-progress-tracking*
*Context gathered: 2026-06-23*
