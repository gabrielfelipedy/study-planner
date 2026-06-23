# Phase 5: Study Sessions & Progress Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 05-study-sessions-progress-tracking
**Areas discussed:** Completion flow, Session tracking depth, Progress visibility, Calendar completion UI

---

## Completion Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Click topic card in calendar | Inline action on topic cards in schedule view | |
| Dedicated study session page | A separate /plans/[id]/study page with today's topics | |
| Both — inline + session page | Quick mark from calendar + session page for focused work | ✓ |

**User's choice:** Both — inline + session page

Follow-up questions:

| Question | Option | Selected |
|----------|--------|----------|
| How should inline marking work? | Click to reveal action (2-step) | ✓ |
| | Click to toggle immediately | |
| | Right-click / long-press menu | |
| What should the session page show? | Today's topics checklist | ✓ |
| | Timer + topic list | |
| | Pomodoro-style | |
| What happens after marking? | Calm update — just refresh | |
| | Brief positive feedback | ✓ |
| | Auto-advance to next topic | |

**User's choice:** Click card to reveal Mark studied button (2-step), session page is a simple today's-checklist (no timer), show positive toast/animation after marking.

---

## Session Tracking Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Just mark completion | No duration tracking, no session logging | ✓ |
| Optional duration on completion | Optionally input duration when marking | |
| Always log session with duration | Session page always prompts for duration | |

**User's choice:** Just mark completion. study_sessions table not used in v1.

---

## Progress Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Plan detail page only | Keep progress where it is | |
| Plans list + detail | Also show on plan cards | |
| Also on nav / homepage | Summary on homepage too | |

**User's choice:** All three levels — plan detail (already exists ✓), plan cards (already exists ✓), homepage (new addition: today's completion summary).

---

## Calendar Completion UI

| Option | Description | Selected |
|--------|-------------|----------|
| Click card → button inside card | Card reveals Mark studied button internally | ✓ |
| Hover over card → button appears | Hover reveals button | |
| Click card → popover/dialog | Popover near the card | |

**User's choice:** Click card → Mark studied button appears inside the card. Click to confirm.

---

## OpenCode's Discretion

- Toast/animation design for completion feedback
- Homepage progress summary layout and content
- Calendar inline button positioning and animation
- Empty state on session page (no topics scheduled today)
- Loading and error states for mark action

## Deferred Ideas

- Session duration tracking (study_sessions table) — future phase or v2
- Pomodoro / focus timer (TIMR-01) — v2 requirement
- Un-mark topic as studied — not implemented for v1
- Study session notes / journaling — could enrich session page
