# Phase 3: Subject & Topic Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 03-subject-topic-management
**Areas discussed:** Subject management UI, Topic management within subjects, Study plan creation flow, Available time input, Plan list & navigation, Plan detail page layout, Plan editing & deletion, Topic editing

---

## Subject Management UI

| Option | Description | Selected |
|--------|-------------|----------|
| Simple list with CRUD actions | Vertically stacked list, name + color + difficulty per row | |
| Card grid with CRUD | Responsive card grid, name + color + difficulty + topic count | ✓ |
| Dialog/modal form for creation | Dialog opens on same page | |
| Dedicated page for creation | /subjects/new form page | ✓ |
| Yes, color picker | Predefined palette, 6-8 colors | ✓ |
| No, skip colors | Text-only subjects | |
| None for now (difficulty) | Hidden in v1 UI | ✓ |
| Easy/Medium/Hard on creation | Show difficulty selector | |
| Navigate to /subjects/[id]/edit | Dedicated edit page | ✓ |
| Inline dialog on list page | Dialog on same page | |
| Name, color dot, topic count | Clean and minimal | |
| Name + details (difficulty, progress) | More detailed cards | ✓ |
| Confirmation dialog with cascade warning | Hard delete with confirmation | |
| Soft delete / archive | Archive pattern | ✓ |
| Yes, shared form component | Same form for create + edit | ✓ |
| Separate pages | Different pages for create and edit | |

**User's choice:** Card grid, dedicated creation page, color picker, difficulty hidden, dedicated edit page, detailed cards, archive pattern, shared form component.

**Notes:** Color helps visual recognition at a glance. Difficulty deferred because it's more relevant to timetable engine (Phase 4).

---

## Topic Management within Subjects

| Option | Description | Selected |
|--------|-------------|----------|
| On subject detail page | /subjects/[id] shows subject + topic list | ✓ |
| Separate topics page | Cleaner separation, more navigation | |
| Inline add form | Input always visible | |
| Dialog form | Click → dialog with fields | |
| Bulk add textarea | Paste multiple topic names at once | ✓ |
| Drag and drop | Grab handles, reorder | ✓ |
| Manual sortOrder input | Up/down arrow buttons | |
| Optional field on topic creation | Show hours input | |
| Hide it initially | Defer hours to Phase 4 | ✓ |

**User's choice:** Topics on subject detail page, bulk add textarea, drag-and-drop reordering, hide estimated hours.

**Notes:** Bulk add is preferred for initial setup when entering many topics. Drag-and-drop matches the existing sortOrder schema field.

---

## Study Plan Creation Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Per-subject plans | Each subject has own deadline | |
| Cross-subject plans | One plan includes topics from multiple subjects | ✓ |
| From the subject page | Create plan button on subject detail | |
| Dedicated /plans/new page | Standalone plan creation page | ✓ |
| Title, deadline, start date | Minimal plan fields | ✓ |
| Title, deadline, start date, hoursPerDay | Includes study time | |
| Single form page | All fields on one page | ✓ |
| Multi-step wizard | Step-by-step guided flow | |
| Select by subject | Checkboxes for subjects, all topics included | ✓ |
| Select individual topics | Per-topic picker | |
| Auto-generated title | Concatenated subject names | |
| Required user input | User must enter a title | ✓ |
| Redirect to plan detail page | /plans/[id] | ✓ |
| Redirect to subject list | Back to /subjects | |

**User's choice:** Cross-subject plans, dedicated /plans/new page, title + deadline + start date only, single form, select by subject, required title input, redirect to plan detail page.

**Notes:** User wants study time input separate from plan creation (handled as a separate area below).

---

## Available Time Input

| Option | Description | Selected |
|--------|-------------|----------|
| On the plan detail page | /plans/[id] has time settings | ✓ |
| Standalone settings page | /settings page | |
| Hours per day | Simple daily input | |
| Hours per week + which days | More realistic study pattern | ✓ |
| Per-plan setting | Each plan has its own time | ✓ |
| Global default, overridable | Default + per-plan override | |

**User's choice:** On plan detail page, hours per week + days, per-plan setting.

**Notes:** Hours per week + days-of-week is more realistic — people have variable availability. Schema currently has hoursPerDay (single float) — may need evolution for hours/week + day selection.

---

## Plan List & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, /plans page | Dedicated page listing all plans | ✓ |
| Show plans on /subjects page | Section on subjects page | |
| Add 'Plans' link to nav | Simple addition to AuthNav | ✓ |
| Create sidebar/app shell | Proper sidebar navigation | |

**User's choice:** /plans page with "Plans" link in top nav.

**Notes:** Keep the simple top nav pattern from Phase 2. Sidebar can be evaluated in a later phase if nav gets more complex.

---

## Plan Detail Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Overview: subjects, deadline, time, actions | Clean overview with settings | ✓ |
| Same + schedule preview placeholder | Teasers Phase 4 timetable | |
| Distinct 'Study Availability' section | Separate section on page | |
| Inline in plan header/settings | Compact, part of settings | ✓ |

**User's choice:** Clean overview with subjects, deadline, study time, actions. Study time inline in settings area.

---

## Plan Editing & Deletion

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, edit inline on plan page | Edit button opens edit form | ✓ |
| No editing — recreate | Delete and start over | |
| Hard delete with confirmation | Permanently deleted | |
| Archive pattern | Soft delete, consistent with subjects | ✓ |
| Yes, subjects changeable | Edit form can add/remove subjects | ✓ |
| No, subjects locked | Fixed at creation | |

**User's choice:** Editable plans, archive pattern, subjects changeable after creation.

---

## Topic Editing

| Option | Description | Selected |
|--------|-------------|----------|
| Inline edit (click to rename) | Click name → input field | ✓ |
| Dialog/panel | Structured edit dialog | |
| Delete icon on hover | Icon appears on row hover | |
| Select mode with batch delete | Check multiple, delete selected | ✓ |

**User's choice:** Inline rename, batch delete via selection mode.

---

## OpenCode's Discretion

- Exact color palette values (6-8 colors)
- Card layout specifics (shadow, spacing, typography)
- Drag-and-drop library choice for topic reordering
- Form validation details and error messages
- Loading and empty states
- Exact nav component changes for "Plans" link
- Plan detail page layout specifics
- Delete/archive confirmation dialog design
- Topic select mode UX details

## Deferred Ideas

None — discussion stayed within phase scope.
