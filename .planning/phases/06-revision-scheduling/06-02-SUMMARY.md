---
phase: 06-revision-scheduling
plan: 02
subsystem: ui
tags: revision-slots, calendar, rating-ui, fsrs, inline-review
requires:
  - phase: 06-revision-scheduling
    provides: FSRS revision scheduling engine (scheduleRevision, processReviewRating, reviewSlotAction)
  - phase: 05-study-sessions-progress-tracking
    provides: TopicCard inline marking interaction, calendar slot rendering pipeline
provides:
  - Calendar rendering of revision slots with purple/indigo visual distinction from study slots
  - 4-button review rating UI (Again/Hard/Good/Easy) for inline revision interaction
  - Non-draggable revision slot rendering (outside SortableContext)
affects: 07-adaptive-rescheduling
tech-stack:
  added: []
  patterns:
    - Revision slots rendered as TopicCard components outside SortableContext (not draggable)
    - Revision rating buttons use severity-matching colors (red/orange/green/blue)
    - Dynamic import of reviewSlotAction Server Action from client component
    - Disabled useSortable for non-draggable revision slots via `disabled: isRevision`
key-files:
  created:
    - src/components/revision-rating.tsx — 4-button review rating inline component
  modified:
    - src/components/topic-card.tsx — Added type field, purple styling, Review badge, RevisionRating wiring
    - src/components/schedule-day-cell.tsx — Revision slot filtering and rendering outside SortableContext
key-decisions:
  - "Revision slots use purple/indigo background color as the sole visual distinction from study slots (per D-09, no separate icon needed)"
  - "useSortable disabled option used to prevent revision slots from being draggable — cleanest approach without restructuring the component"
  - "RevisionRating uses dynamic import of reviewSlotAction to avoid circular dependencies with the actions file"
  - "Rating buttons use severity-matching colors (red=forgot, orange=difficult, green=correct, blue=instant) for intuitive visual feedback"
requirements-completed:
  - TIME-02
duration: 2min
completed: 2026-06-23
---

# Phase 6 Plan 2: Calendar Revision Slot UI & Review Rating Interaction

**Calendar rendering of revision slots with purple/indigo visual styling, non-draggable layout, and inline 4-button review rating (Again/Hard/Good/Easy) with loading/error/success feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-23T23:11:29Z
- **Completed:** 2026-06-23T23:13:51Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added optional `type` field to `TopicCardSlot` for revision slot identification
- Added purple/indigo background and border styling (`bg-indigo-50`, `border-indigo-300`) for revision-type topic cards
- Added "Review" badge with indigo styling for pending revision slots (vs "Pending" for study slots)
- Disabled drag behavior for revision slots via `useSortable({ disabled: isRevision })` — they are not draggable
- Updated `schedule-day-cell.tsx` to filter revision slots and render them as `TopicCard` components outside the `SortableContext`
- Created `RevisionRating` component with 4 severity-matching buttons: Again (red), Hard (orange), Good (green), Easy (blue)
- Each rating button has `aria-label` with description for accessibility
- Wired `RevisionRating` into `TopicCard` for revision-type slots — clicking reveals rating UI instead of "Mark studied" button
- Loading state disables all buttons during review processing
- Success/error feedback delivered via toast callbacks

## Task Commits

Each task was committed atomically:

1. **Task 1: Add type field, render revision slots with purple styling** — `0b5d5f3` (feat)
2. **Task 2: Create review rating component and wire into TopicCard** — `a371e41` (feat)

## Files Created/Modified

- `src/components/revision-rating.tsx` — Created: 4-button review rating component (Again/Hard/Good/Easy) with loading state, dynamic import of reviewSlotAction, and severity-matching colors
- `src/components/topic-card.tsx` — Modified: Added optional `type` field to TopicCardSlot, purple/indigo styling for revision cards, indigo "Review" badge, RevisionRating wiring for revision slot interaction
- `src/components/schedule-day-cell.tsx` — Modified: Added revisionSlots filter and TopicCard rendering outside SortableContext (not draggable)

## Decisions Made

- **Disabled useSortable for revision slots:** Using the `disabled: isRevision` option on `useSortable` rather than restructuring the component. Cleanest approach — revision slots are not draggable while study slots keep full DnD behavior
- **Dynamic import for reviewSlotAction:** `RevisionRating` dynamically imports `reviewSlotAction` from the actions file to avoid circular dependency issues (the actions file imports from the data layer, the component is in the UI layer)
- **Severity-matching button colors:** Red (Again — forgot), Orange (Hard — difficult), Green (Good — correct), Blue (Easy — instant) for intuitive visual association with recall quality

## Deviations from Plan

None — plan executed exactly as written.

### Acceptance Criteria Verification

**Task 1:**
- ✅ `TopicCardSlot` in `topic-card.tsx` includes optional `type` field
- ✅ `TopicCard` applies `bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800` class for revision-type slots
- ✅ `TopicCard` shows "Review" badge (with indigo styling) for pending revision slots
- ✅ `schedule-day-cell.tsx` filters `revisionSlots` from slots array
- ✅ `schedule-day-cell.tsx` renders revision slots as `TopicCard` components outside the SortableContext (not draggable)
- ✅ `npx tsc --noEmit` passes with zero errors

**Task 2:**
- ✅ `src/components/revision-rating.tsx` exports `RevisionRating` component
- ✅ Component shows 4 buttons with labels: Again (red), Hard (orange), Good (green), Easy (blue)
- ✅ Each button has an `aria-label` with its description
- ✅ Clicking a rating button calls `reviewSlotAction` with the correct slotId/planId/rating
- ✅ `src/components/topic-card.tsx` renders `RevisionRating` for revision-type slots and "Mark studied" button for study-type slots
- ✅ Loading state disables all buttons while review is processing
- ✅ `npx tsc --noEmit` passes with zero errors

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass (0 errors) |
| Revision slots use purple/indigo background | ✅ Code verified (bg-indigo-50, border-indigo-300) |
| Revision slots show "Review" badge | ✅ Code verified (ternary: isRevision ? "Review" : "Pending") |
| Revision slots outside SortableContext | ✅ Code verified (revisionSlots.map after SortableContext) |
| Revision slots not draggable | ✅ Code verified (useSortable disabled: isRevision) |
| Click revision slot shows 4 rating buttons | ✅ Code verified (RevisionRating rendered in showMarkButton for isRevision) |
| Rating calls reviewSlotAction with correct params | ✅ Code verified (dynamic import + handleRating callback) |
| Loading state disables buttons | ✅ Code verified (isRating state disables all buttons) |
| Error state shows toast message | ✅ Code verified (onError calls onShowToast with error message) |

## Known Stubs

None — all implementations are fully wired with real data sources.

## Threat Flags

None — threat model mitigations (session guard, ownership check, append-only audit trail) are all implemented in Plan 01 (the Server Action layer). This plan only adds client-side UI components.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 6 revision scheduling is complete — both Plan 01 (FSRS engine) and Plan 02 (calendar UI + review rating) are done
- Ready for Phase 7: Adaptive Rescheduling
- Revision slots are visually distinct, rateable, and fully integrated into the calendar view

## Self-Check: PASSED

- ✅ Created file `src/components/revision-rating.tsx` exists
- ✅ Commit `0b5d5f3` exists in history
- ✅ Commit `a371e41` exists in history
- ✅ `type` field in `TopicCardSlot` includes revision types
- ✅ Purple/indigo background classes (`bg-indigo-50`, `border-indigo-300`) applied
- ✅ `cursor-pointer` used for revision slots (not `cursor-grab`)
- ✅ "Review" badge text for pending revision slots
- ✅ `revisionSlots` filter present in `schedule-day-cell.tsx`
- ✅ `RevisionRating` imported and used in `topic-card.tsx`
- ✅ `reviewSlotAction` imported dynamically in `revision-rating.tsx`

---

*Phase: 06-revision-scheduling*
*Completed: 2026-06-23*
