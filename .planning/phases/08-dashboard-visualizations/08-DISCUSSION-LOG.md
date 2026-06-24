# Phase 8: Dashboard & Visualizations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 08-dashboard-visualizations
**Areas discussed:** Dashboard location, Chart library choice, Charts & metrics in v1, Dashboard layout & structure, Time range & filtering, Empty & loading states

---

## Dashboard Location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /dashboard route | New top-level page accessible from nav | |
| **Expand the homepage** | Replace current landing with dashboard. Already shows today's progress. | ✓ |
| Per-plan dashboard tab | Dashboard lives inside each plan detail page | |

**User's choice:** Expand the homepage
**Notes:** Keep hero landing for unauthenticated users. No "Dashboard" nav link — homepage IS the dashboard.

---

## Chart Library Choice

| Option | Description | Selected |
|--------|-------------|----------|
| **Recharts** | Most popular React charting library. Already in stack spec. | ✓ |
| Custom SVG/CSS only | No external dependency, simpler but limited | |
| nivo | Rich D3-based library, heavier dependency | |

**User's choice:** Recharts (Recommended)
**Notes:** Needs npm install. Declarative composable components.

---

## Charts & Metrics in v1

| Option | Description | Selected |
|--------|-------------|----------|
| **All 4 from roadmap** | Completion over time, topics by subject, weekly study hours vs planned, revision adherence | ✓ |
| 2 core charts only | Completion over time + topics by subject only | |
| 3 charts — drop study hours | Skip study hours chart | |

**User's choice:** All 4 from roadmap (Recommended)

**Completion over time format:**

| Option | Description | Selected |
|--------|-------------|----------|
| Cumulative only | Line chart 0→100% | |
| Daily only | Bar chart per day | |
| **Both** | Cumulative line + daily bars | ✓ |

**User's choice:** Both

**Topics by subject format:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Horizontal bar chart** | Subject names on Y, completion counts on X | ✓ |
| Pie/donut chart | Classic distribution visualization | |

**User's choice:** Horizontal bar chart (Recommended)

**Study hours scope:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Per selected plan** | Planned vs actual per week for specific plan | ✓ |
| Aggregate all plans | Combined across all plans | |

**User's choice:** Per selected plan (Recommended)

**Revision adherence format:**

| Option | Description | Selected |
|--------|-------------|----------|
| Simple percentage + trend | Single stat with sparkline | |
| **Full chart** | Scheduled vs completed revisions per week | ✓ |

**User's choice:** Full chart (Recommended)

---

## Dashboard Layout & Structure

| Option | Description | Selected |
|--------|-------------|----------|
| **KPI cards row + charts below** | Summary stats at top, 2-column chart grid below | ✓ |
| Single-column scroll | All charts full-width, stacked | |
| Grid of equal chart cards | 2x2 grid, no KPI row | |

**User's choice:** KPI cards row + charts below (Recommended)

**Aggregation scope:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Cross-plan + per-plan drill-down** | Aggregate by default, filter by plan selector | ✓ |
| Per-plan only | User picks a plan first | |

**User's choice:** Cross-plan aggregate view + per-plan drill-down (Recommended)

---

## Time Range & Filtering

| Option | Description | Selected |
|--------|-------------|----------|
| **All-time** | Plan creation to today | ✓ |
| Current month | Last 30 days | |
| Last 7 days | Weekly view | |

**User's choice:** All-time (Recommended)

**Plan selector:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Yes — dropdown filter** | Filter by plan, "All plans" default | ✓ |
| No — always all plans | Simpler, no filter UI | |

**User's choice:** Yes — dropdown to filter by plan (Recommended)

---

## Empty & Loading States

**No plans:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Dashboard + CTA** | Show shell with "Create your first plan" message + button | ✓ |
| Redirect to /plans/new | Send to plan creation directly | |

**User's choice:** Dashboard with CTA to create first plan (Recommended)

**No completions yet:**

| Option | Description | Selected |
|--------|-------------|----------|
| **Charts with placeholders** | Chart frames with "no data yet" messages | ✓ |
| Progress bar at 0% only | Hide other charts | |

**User's choice:** Charts with 'no data yet' placeholders (Recommended)

---

## OpenCode's Discretion

- Exact Recharts component selection (ResponsiveContainer, CartesianGrid, Tooltip styling)
- KPI card styling and exact metrics shown
- Plan selector dropdown design and placement
- Chart color palette
- Empty state illustration or icon choice
- Chart tooltip design
- Loading skeleton for initial data fetch
- Responsive breakpoints for grid layout
- Integration of existing today-progress mini-card into dashboard

## Deferred Ideas

None — discussion stayed within phase scope.
