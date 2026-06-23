# Phase 4: Timetable Engine & Schedule View - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion record.

**Date:** 2026-06-22
**Phase:** 04-timetable-engine-schedule-view
**Mode:** discuss (default, interactive)

## Areas Discussed

### 1. Generation Trigger
| # | Question | Selected Option | Notes |
|---|----------|----------------|-------|
| 1 | When should the schedule be generated? | Auto-generate after creating plan | No extra step needed |
| 2 | Show generation progress? | Show "Generating..." spinner briefly | Reassuring without being slow |
| 3 | What info in generation summary? | Basic: total days, avg topics/day | Simple, scannable |
| 4 | What if not enough time? | Block generation — must fix first | Show shortfall, suggest options |

### 2. Schedule Layout
| # | Question | Selected Option | Notes |
|---|----------|----------------|-------|
| 1 | How to display schedule? | Weekly calendar grid | 7-column grid, Mon-Sun |
| 2 | What info in each day cell? | Detailed: title + time + status badge | Richer, more informative |
| 3 | Week navigation? | Scrollable timeline — weeks stacked | Continuous vertical scroll |
| 4 | Today highlighting? | Scroll to today on load, accent color | Find current position easily |

### 3. Manual Rescheduling
| # | Question | Selected Option | Notes |
|---|----------|----------------|-------|
| 1 | How to move topics? | Drag-and-drop between days | Intuitive, visual interaction |
| 2 | Mobile behavior? | Touch-friendly long-press drag | Same component, all devices |
| 3 | Full day behavior? | Warn and let user decide | User has control |
| 4 | Visual distinction for manual moves? | No — all topics look same | Simpler, less noise |

### 4. Schedule Regeneration
| # | Question | Selected Option | Notes |
|---|----------|----------------|-------|
| 1 | What happens when plan inputs change? | Prompt with Regenerate/Keep/Cancel | User stays in control |
| 2 | Stale indicator when keep current? | Yes — yellow banner | Inform without being pushy |
| 3 | Buffer blocks visible? | Yes — shown as "Buffer" / "Catch-up" | Transparent about flexibility |
| 4 | Catch-up day pattern? | Specific reserved days (last 1-2 per week) | Predictable rhythm |

## OpenCode's Discretion
Areas left for planning/implementation discretion:
- Drag-and-drop library choice
- Calendar grid component implementation
- Spinner/loading animation style
- Stale banner styling
- Warning dialog design
- Buffer/catch-up label styling
- Empty schedule state
- Mobile responsiveness specifics

## Deferred Ideas
None — discussion stayed within phase scope.
