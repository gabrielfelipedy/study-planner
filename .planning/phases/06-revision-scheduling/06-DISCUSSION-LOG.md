# Phase 6: Revision Scheduling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-06-23
**Phase:** 06-revision-scheduling
**Mode:** discuss (interactive, default)
**Areas discussed:** FSRS memory state storage, revision timing & slot creation, revision slot placement, visual distinction

## Discussion Summary

### FSRS Memory State Storage

**Q1 — Storage approach:**
- Options: Add columns to revisions table | Store as JSON blob | Separate card_memory table
- Selected: **Add columns to revisions table** (stability, difficulty, retrievability as real columns)
- Rationale: Simple schema, single-table queries, keeps memory state with each revision entry

**Q2 — Card identity:**
- Options: One card per topic per plan | One card per topic globally
- Selected: **One card per topic per plan**
- Rationale: Matches existing data model, simple 1:1 mapping

**Q3 — Initial parameter seeding:**
- Options: FSRS population defaults | Custom seeded defaults
- Selected: **FSRS population defaults**
- Rationale: Standard approach used by Anki, no custom tuning needed for v1

**Q4 — State update strategy:**
- Options: Incremental in-place update | Append-only + cache latest
- Selected: **Append-only + cache latest**
- Rationale: Enables replaying from event log if FSRS algorithm updates in the future

### Revision Timing & Slot Creation

**Q1 — When to create slots:**
- Options: Immediately after marking studied | On next schedule view/refresh
- Selected: **Immediately after marking studied**
- Rationale: Revision slots appear instantly, tighter integration with Phase 5 flow

**Q2 — Slot persistence:**
- Options: Persist as schedule_slots | Render from revisions table only
- Selected: **Persist as schedule_slots** (type='revision-7d' or 'revision-30d')
- Rationale: Reuses existing calendar rendering pipeline, already has type values defined in schema

**Q3 — Day capacity handling:**
- Options: Add as extra slot | Replace study slot for same topic | Respect daily capacity limits
- Selected: **Respect daily capacity limits**
- Rationale: Respects user's time constraints, consistent with distribute.ts approach

### Revision Slot Placement

**Q1 — Placement fallback when optimal day is at capacity:**
- Options: Nearest available before | Nearest available after | Merge into buffer/catch-up
- Selected: **Nearest available study day AFTER preferred date**
- Rationale: Better spacing effect — slightly later is better than slightly earlier

### Visual Distinction

**Q1 — How to distinguish revision slots:**
- Options: Different background color | Distinct icon + label | Compact revision badge
- Selected: **Different background color** (purple/indigo)
- Rationale: Simple CSS class switch on the type field, matches schema's type discrimination

## Decisions Not Discussed (OpenCode Discretion)
- Review rating UI interaction design (Again/Hard/Good/Easy button presentation)
- Revision limits / mastered threshold
- Exact color values for revision styling
- Loading, error, empty states

## Deferred Ideas
- Review rating UI details — OpenCode discretion
- Revision limits — OpenCode discretion (or not implemented — FSRS naturally extends intervals)
