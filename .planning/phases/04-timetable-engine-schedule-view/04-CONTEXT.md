# Phase 4: Timetable Engine & Schedule View - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Auto-generate a daily study schedule from topics, deadline, and available time. Display the schedule in a weekly calendar view and allow manual drag-and-drop rescheduling. Buffer blocks (~30% unscheduled time) and catch-up days prevent rigidity.

Requirements: TIME-01 (auto-generate daily schedule), TIME-03 (manual adjustment), PROG-03 (in-app calendar view).

</domain>

<decisions>
## Implementation Decisions

### Generation Trigger
- **D-01:** Auto-generate schedule immediately after plan creation — no separate button
- **D-02:** Show brief "Generating your study schedule..." spinner, then display result
- **D-03:** After generation, show basic summary: total days scheduled and average topics per day
- **D-04:** If insufficient time before deadline: block generation, show shortfall, suggest options (extend deadline, reduce topics, or increase study hours)

### Schedule Layout
- **D-05:** Weekly calendar grid — 7-column layout (Mon-Sun) with topics stacked vertically in each day
- **D-06:** Each day cell shows topic title, estimated study minutes, and status badge (pending/studied)
- **D-07:** All weeks stacked vertically — continuous scrollable timeline, no week-by-week arrows
- **D-08:** On load, auto-scroll to current week and highlight today's column with accent color

### Manual Rescheduling
- **D-09:** Drag-and-drop to move topics between days (uses long-press for touch devices)
- **D-10:** When dragging to a full day, warn and let user decide (overbook or choose another day)
- **D-11:** Manually moved topics look identical to auto-assigned ones — no visual distinction

### Schedule Regeneration
- **D-12:** When user edits deadline, study hours, or study days — prompt with dialog: "Regenerate schedule? Manual adjustments will be lost." Options: Regenerate / Keep current / Cancel
- **D-13:** If user chooses "Keep current" but inputs changed, show yellow stale-indicator banner: "Schedule may not match your current settings — regenerate to update"
- **D-14:** Buffer blocks (30% unscheduled capacity) are visible as "Buffer" or "Catch-up" labeled days in the calendar
- **D-15:** Catch-up days are specific reserved days: the last 1-2 study days of each week

### OpenCode's Discretion
- Exact drag-and-drop library choice (dnd-kit or similar)
- Calendar grid component implementation details (custom vs shadcn/ui calendar)
- Spinner/loading animation design for generation
- Stale banner styling and placement
- Warning dialog design and exact wording
- Buffer/catch-up label styling in the grid
- Empty schedule state before first generation
- Mobile responsiveness specifics of the weekly grid
- Topic card design within day cells (exact padding, shadows, typography)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — TIME-01, TIME-03, PROG-03 requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria (5 items), dependency on Phase 3

### Prior Context
- `.planning/phases/03-subject-topic-management/03-CONTEXT.md` — Prior decisions: cross-subject plans, hoursPerWeek/studyDays model, estimatedHours per topic, placeholder on plan detail page
- `.planning/phases/02-authentication/02-CONTEXT.md` — Auth patterns, middleware, session handling
- `.planning/phases/01-foundation-data-model/01-CONTEXT.md` — Schema organization, DAL pattern, Turso dev setup

### Existing Codebase
- `src/lib/db/schema.ts` — `schedule_slots` table (planId, topicId, date, type, estimatedMinutes, isCompleted, completedAt), `study_plans` fields (hoursPerWeek, studyDays, startDate, deadline, totalTopics)
- `src/lib/dal/scheduler/distribute.ts` — `generateSchedule()` stub — core engine to implement
- `src/lib/dal/commands/schedule.ts` — `saveSchedule()` and `resetSchedule()` stubs
- `src/lib/dal/queries/calendar.ts` — `getScheduleSlots()` stub — query to implement
- `src/lib/dal/queries/plans.ts` — `getPlanById()` returns PlanWithSubjects with topics
- `src/app/plans/[id]/page.tsx` — Plan detail page with placeholder for schedule
- `src/components/plan-form.tsx` — Plan creation form pattern, redirects after creation

### Research
- `.planning/research/SUMMARY.md` — Research synthesis
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Architecture patterns (DAL pattern, Server Components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui primitives** (Button, Card, Dialog, Input, Badge, Checkbox, Select, Label) — available for building UI
- **DAL pattern** — `lib/dal/queries/` and `lib/dal/commands/` with typed stubs ready for implementation
- **`schedule_slots` table** — schema complete with planId, topicId, date, type, estimatedMinutes, isCompleted fields; compound index on (planId, date)
- **`study_plans` table** — has hoursPerWeek, studyDays, startDate, deadline, totalTopics fields — all needed for generation
- **`plan_topics` join table** — links plans to topics; getPlanById returns subjects with topic counts
- **`date-fns` v4.4.0** — installed but unused; provides eachDay, eachWeekOfInterval, format, addDays, differenceInDays, parseISO, etc.
- **Plan detail page** (`/plans/[id]/page.tsx`) — already has placeholder div: "Schedule generation will appear here in Phase 4"
- **Server Action pattern** — inline `"use server"` functions in page files; Client components call DAL directly
- **Subject color system** — hex color stored on subjects, shown as 12px rounded dots; use for topic color in calendar

### Established Patterns
- **Server Component + Client form** — data fetching in Server Components, forms/actions in Client Components
- **Form action pattern** — `<form action={handleSubmit}>` with `formData.get()`, manual validation, `router.push()` on success, `router.refresh()` to revalidate
- **Session guard** — `auth.api.getSession({ headers: await headers() })` at top of every protected page
- **Card layout** — `rounded-lg border bg-white p-5 shadow-sm` pattern throughout
- **Empty states** — `rounded-lg border-2 border-dashed border-zinc-200 p-12 text-center`
- **Error display** — `rounded-md bg-red-50 p-3 text-sm text-red-600`
- **Layout** — `max-w-3xl` centered, `px-4 py-8`

### Integration Points
- **Plan creation flow** (`/plans/new`) — after creation, currently redirects to `/plans/[id]`; needs schedule generation inserted after creation
- **Plan detail page** (`/plans/[id]/page.tsx`) — schedule view replaces the placeholder div; also renders StudyTimeForm and plan header
- **Nav bar** (`auth-nav.tsx`) — no new nav links needed (plan pages already linked from Phase 3)
- **Schedule DAL** — commands (`saveSchedule`, `resetSchedule`) and query (`getScheduleSlots`) need implementation
- **Scheduler engine** (`distribute.ts`) — core `generateSchedule()` needs full implementation

</code_context>

<specifics>
## Specific Ideas

- Drag-and-drop should feel smooth and native — long-press to start drag on mobile
- Schedule view should make it obvious what to study today (auto-scroll + highlight)
- Buffer/catch-up blocks are visible so the user understands the schedule has flexibility built in
- Never auto-regenerate over manual adjustments without asking
- If generation can't fit all topics, block and ask the user to adjust — don't produce an incomplete schedule silently

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-timetable-engine-schedule-view*
*Context gathered: 2026-06-22*
