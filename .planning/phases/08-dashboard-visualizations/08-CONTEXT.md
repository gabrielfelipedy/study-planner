# Phase 8: Dashboard & Visualizations - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view progress trends and study metrics through visual charts on the homepage. The dashboard shows completion over time, topics by subject distribution, weekly study hours vs planned, and revision adherence rate — all using positive/completion-based framing with no shame indicators.

Requirements: PROG-04 (User can view charts with progress metrics over time).

</domain>

<decisions>
## Implementation Decisions

### Dashboard Location
- **D-01:** Expand the existing homepage — dashboard replaces the logged-in view of `/`. Keep the hero landing for unauthenticated users (current pattern).
- **D-02:** No "Dashboard" nav link in the navigation bar. Homepage IS the dashboard — users land on it after login. Logo/home link serves as the return point.

### Chart Library
- **D-03:** Recharts. Install via npm before implementing. Declarative React charting library with Bar, Line, Pie, etc. composable components.

### Charts & Metrics (v1)

#### Completion Over Time
- **D-04:** Show BOTH cumulative completion line chart AND daily completion bar chart. Dual-chart approach: a cumulative percentage line (0→100%) overlaid or alongside daily bars showing topics completed each day.

#### Topics by Subject
- **D-05:** Horizontal bar chart (not pie/donut). Subject names on Y axis, completion counts on X axis. Easier to compare and read subject names.

#### Weekly Study Hours vs Planned
- **D-06:** Per-selected-plan chart. Bar chart showing planned vs actual study hours per week for a specific plan. Requires a plan to be selected — not shown in aggregate mode.

#### Revision Adherence
- **D-07:** Full chart comparing scheduled vs completed revisions per week. Bar chart with two series per week. Not just a single percentage stat.

### Dashboard Layout & Structure
- **D-08:** KPI summary cards row at top (total topics, completion %, revision adherence %) + charts below in 2-column grid on desktop.
- **D-09:** Cross-plan aggregate view by default, with per-plan drill-down via plan selector dropdown. "All plans" is the default selection.
- **D-10:** Mobile: single column stack, full-width charts.

### Time Range & Filtering
- **D-11:** Default time range: all-time (from first plan creation to today). No date range picker in v1.
- **D-12:** Plan selector dropdown at top of dashboard to filter by plan. "All plans" default.

### Empty & Loading States
- **D-13:** No plans exist — show dashboard layout shell with CTA: "Create your first study plan to see progress charts." Button linking to plan creation. Reuses existing empty-state pattern (`rounded-lg border-2 border-dashed border-border p-12 text-center`).
- **D-14:** Plan has no completions yet — show chart frames/containers with "Complete your first topic to see progress" inside each chart area. Dashboard remains visible and functional.
- **D-15:** No data for a specific chart (e.g., no revisions tracked yet) — show that chart's frame with appropriate "No data yet" message. Other charts remain active.

### OpenCode's Discretion
- Exact Recharts component selection (ResponsiveContainer, CartesianGrid, Tooltip styling, etc.)
- KPI card styling and exact metrics shown
- Plan selector dropdown design and placement
- Chart color palette (should be consistent with existing subject color system)
- Empty state illustration or icon choice
- Chart tooltip design
- Loading skeleton for initial data fetch
- Responsive breakpoints for grid layout
- How to handle the currently existing today-progress mini-card on the homepage (integrate into dashboard or keep as separate section)

</decisions>

<specifics>
## Specific Ideas

- "No shame indicators" — positive-only framing consistent with Phase 5/6/7 philosophy. No "overdue" or "missed" labels anywhere in the dashboard.
- Dashboard should be immediately useful when landing after login — shows today's status and broader progress at a glance.
- Homepage is the natural dashboard location since it already shows today's progress mini-card.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — PROG-04 requirement with REQ-ID
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria (5 items), dependency on Phase 5 and Phase 6

### Prior Context
- `.planning/phases/05-study-sessions-progress-tracking/05-CONTEXT.md` — Phase 5 decisions: completion flow, progress tracking, homepage progress section (D-08)
- `.planning/phases/06-revision-scheduling/06-CONTEXT.md` — Phase 6 decisions: revision slot creation, FSRS integration, revision type values ("revision-7d", "revision-30d")
- `.planning/phases/07-adaptive-rescheduling/07-CONTEXT.md` — Phase 7 decisions: progress comparison, behind-schedule indicators, positive-framing

### Existing Codebase
- `src/app/page.tsx` — Homepage to be expanded into dashboard. Already has today's progress section for authenticated users
- `src/lib/dal/queries/progress.ts` — `getCompletionStats()`, `getTodaySchedule()` — existing queries to extend for dashboard data
- `src/lib/dal/queries/plans.ts` — `getPlansForUser()`, `getPlanById()` — plan data for filter/aggregation
- `src/lib/dal/queries/revisions.ts` — `getPendingRevisionSlots()`, `getRevisionHistory()` — revision data for adherence chart
- `src/lib/db/schema.ts` — `completions` table (audit log for completion trends), `scheduleSlots` (type for revision/study distinction, isCompleted for adherence), `studyPlans` (denormalized counts), `revisions` (FSRS state)
- `src/components/completion-toast.tsx` — Reusable toast for positive feedback
- `src/components/auth-nav.tsx` — Nav bar (no Dashboard link per D-02)
- `src/lib/dal/commands/progress.ts` — `markTopicStudied()` — records completions in audit table

### Research
- `.planning/research/SUMMARY.md` — Research synthesis
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Architecture patterns (DAL pattern, Server Components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Homepage (`src/app/page.tsx`)** — Already renders today's progress mini-card for authenticated users (lines 33-86). This section will be expanded or integrated into the dashboard layout.
- **`getCompletionStats()` (`src/lib/dal/queries/progress.ts:25-44`)** — Returns plan-level completion stats from denormalized study_plans fields. Extend for chart data: daily completions from the `completions` audit table, cumulative series.
- **`getTodaySchedule()` (`src/lib/dal/queries/progress.ts:46-85`)** — Returns today's study slots with completion status. Can be repurposed or extended for dashboard today-summary section.
- **`completions` table (`src/lib/db/schema.ts:130-143`)** — Audit log with userId, planId, topicId, date, createdAt. Primary data source for completion-over-time charts.
- **`scheduleSlots` table (`src/lib/db/schema.ts:94-113`)** — Contains type ("study", "revision-7d", "revision-30d"), isCompleted, date, estimatedMinutes. Source for revision adherence and study hours charts.
- **`plan-card.tsx`** — Shows progress bar with completed/total. Progress display pattern reusable for KPI cards.
- **Progress bar pattern** — `h-2 w-full rounded-full bg-muted` outer + `bg-primary transition-all` inner bar. Reusable for KPI cards.
- **Empty state pattern** — `rounded-lg border-2 border-dashed border-border p-12 text-center`. Reuse for no-data states (D-13, D-14).
- **Card pattern** — `rounded-lg border bg-card p-5 shadow-sm`. Reuse for chart containers and KPI cards.

### Established Patterns
- **Server Component data fetching + Client Component interactivity** — Page is a Server Component that fetches data; charts render as `"use client"` components receiving data as props.
- **Session guard** — `auth.api.getSession({ headers: await headers() })` at top of every protected page.
- **Layout** — `mx-auto max-w-5xl px-4 py-8` on main pages.
- **Subject color system** — hex color stored on subjects, shown as rounded dots. Available for subject-based charts.
- **DAL pattern** — Queries in `lib/dal/queries/`, commands in `lib/dal/commands/`. New dashboard queries belong in `lib/dal/queries/progress.ts` or a new `lib/dal/queries/dashboard.ts`.

### Integration Points
- **Homepage (`src/app/page.tsx`)** — Needs significant expansion. Current authenticated view (today's progress card) will be embedded within or replaced by the full dashboard layout.
- **Nav bar (`src/components/auth-nav.tsx`)** — No changes needed per D-02 (no Dashboard link). The homepage is the implicit dashboard.
- **New chart queries** — Need new DAL functions for: completion-over-time series (daily completions + cumulative), topics-by-subject distribution, weekly study hours vs planned, revision adherence comparison. Extend `progress.ts` or create `dashboard.ts`.
- **Recharts install** — `npm install recharts` before any chart component implementation.
- **New Client components** — Dashboard chart components: `completion-over-time-chart.tsx`, `subject-distribution-chart.tsx`, `study-hours-chart.tsx`, `revision-adherence-chart.tsx`. Each receives data as props and renders Recharts.
- **Plan selector component** — Dropdown at top of dashboard. Fetches user's plans, filters chart data via Server Component parameter or client-side filter.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-dashboard-visualizations*
*Context gathered: 2026-06-23*
