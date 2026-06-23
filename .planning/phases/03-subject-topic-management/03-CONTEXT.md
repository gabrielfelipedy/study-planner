# Phase 3: Subject & Topic Management - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users create subjects (e.g., "Math", "Physics") and topics within them, define cross-subject study plans with deadlines, and input available weekly study time. The timetable generation (distributing topics across days) is Phase 4 — this phase is about organizing study material and defining scheduling constraints.

Requirements: SUBJ-01 (create subjects + organize topics), SUBJ-02 (set deadline for topics), SUBJ-03 (input available study time).

</domain>

<decisions>
## Implementation Decisions

### Subject Management UI
- **D-01:** Card grid layout at `/subjects` — responsive grid with cards showing name, color dot, topic count, difficulty, progress
- **D-02:** Dedicated creation page at `/subjects/new` (reuses form component for edit at `/subjects/[id]/edit`)
- **D-03:** Predefined color palette (6-8 colors) selectable during subject creation
- **D-04:** Difficulty field hidden in v1 UI (schema stores `null` — available for future use)
- **D-05:** Soft delete / archive pattern for subjects (not hard delete)

### Topic Management within Subjects
- **D-06:** Topics displayed inline on the subject detail page (`/subjects/[id]`) — not a separate page
- **D-07:** Bulk add textarea for initial topic creation (paste multiple topic names, created in one go)
- **D-08:** Drag-and-drop reordering using the existing `sortOrder` column in schema
- **D-09:** Estimated hours input hidden initially — defer to Phase 4 when it's relevant for timetable generation
- **D-10:** Inline edit for topic name (click to rename, click away to save)
- **D-11:** Select mode with batch delete for topics (check multiple, delete selected)

### Study Plan Creation
- **D-12:** Cross-subject plans — a single plan includes topics from multiple subjects (not per-subject)
- **D-13:** Dedicated plan creation page at `/plans/new` with a single form (no multi-step wizard)
- **D-14:** Required fields: title (user-input), deadline date picker, start date (defaults to today)
- **D-15:** Subject selection via checkboxes — all topics under selected subjects are automatically included
- **D-16:** After creation, user is redirected to the plan detail page (`/plans/[id]`)

### Study Time Input (SUBJ-03)
- **D-17:** Available study time lives on the plan detail page (`/plans/[id]`), not a separate settings page
- **D-18:** Input is hours per week + which days of the week user studies (not just hours per day)
- **D-19:** Per-plan setting (not global default)

### Plan List & Navigation
- **D-20:** Dedicated `/plans` page listing all plans with title, deadline, progress
- **D-21:** Add "Plans" link to the existing top nav bar (alongside the current email + logout)

### Plan Detail Page Layout
- **D-22:** Plan detail page shows: plan title, deadline, start date, list of included subjects (with topic count), study time input (hours/week + day selection), action buttons (edit, archive)
- **D-23:** Study time input fields are inline in the plan header/settings area (not a separate section)

### Plan Editing & Deletion
- **D-24:** Plans are editable after creation — edit form on `/plans/[id]/edit`, fields and subject selection can all change
- **D-25:** Archive pattern for plans (consistent with subjects — soft delete), not hard delete
- **D-26:** Subjects can be added/removed from a plan after creation via the edit form

### OpenCode's Discretion
- Exact color palette values (6-8 colors)
- Card layout specifics (shadow, spacing, typography)
- Drag-and-drop library choice for topic reordering
- Form validation details and error messages
- Loading and empty states (no subjects, no topics, no plans)
- Exact nav component changes for "Plans" link
- Plan detail page layout specifics and component structure
- Delete/archive confirmation dialog content and styling
- Topic select mode UX details (how to enter/exit select mode)
- Bulk add textarea UX (separator detection, feedback on count)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — SUBJ-01, SUBJ-02, SUBJ-03 requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria (5 items), dependency on Phase 2

### Prior Context
- `.planning/phases/01-foundation-data-model/01-CONTEXT.md` — Prior decisions (pnpm, schema org, Turso dev setup)
- `.planning/phases/02-authentication/02-CONTEXT.md` — Auth patterns, middleware, nav approach

### Existing Codebase
- `src/lib/db/schema.ts` — Existing `subjects`, `topics`, `study_plans`, `plan_topics` tables with fields and types
- `src/lib/dal/queries/subjects.ts` — DAL read stubs for subjects and topics (return empty arrays)
- `src/lib/dal/commands/subjects.ts` — DAL write stubs for CRUD (all throw "Not implemented")
- `src/lib/dal/queries/plans.ts` — DAL read stubs for study plans
- `src/lib/dal/commands/plans.ts` — DAL write stubs for plans
- `src/app/page.tsx` — Homepage (links to `/subjects` when logged in)
- `src/app/layout.tsx` — Root layout with `<AuthNav />`
- `src/components/auth-nav.tsx` — Top nav pattern: email + logout
- `src/app/(auth)/sign-up/sign-up-form.tsx` — Reference pattern: form using Server Action + shadcn/ui components

### Research
- `.planning/research/SUMMARY.md` — Research synthesis
- `.planning/research/STACK.md` — Technology stack with versions
- `.planning/research/ARCHITECTURE.md` — Architecture patterns (DAL pattern, Server Components)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components** (Button, Input, Label, Card) — Install more per-need (Dialog, Checkbox, Select, Badge for this phase)
- **Better Auth session** (`auth.api.getSession`) — Session already available in Server Components from Phase 2
- **DAL pattern** — `lib/dal/queries/` and `lib/dal/commands/` with typed stubs ready for implementation
- **Subject schema** (`subjects` table) — Fields: id, userId, name, color, difficulty, timestamps — ready to use
- **Topic schema** (`topics` table) — Fields: id, subjectId, title, estimatedHours, status, sortOrder, timestamps — ready to use
- **Study plan schema** (`study_plans` table) — Fields: id, userId, title, deadline, startDate, hoursPerDay, totalTopics, completedTopics — ready to use
- **Plan topics join table** (`plan_topics`) — Links plans to topics for cross-subject plans

### Established Patterns
- **Server Component + Client form** — Auth forms use `"use client"` forms with formData and `useRouter`. Follow same pattern for subject/plan forms.
- **Next.js App Router** with route groups — `(auth)` group exists for auth pages. Add `(app)` or `(protected)` group for authenticated pages if needed.
- **DAL pattern** — Queries use `React.cache()` for per-request dedup. Commands are regular async functions.
- **Tailwind CSS v4** — Already configured. Reference auth-nav for nav styling conventions.
- **Middleware protection** — All routes except public ones are protected. Add new routes under this protection.

### Integration Points
- **Root nav** (`src/components/auth-nav.tsx`) — Add "Plans" link alongside existing elements
- **Homepage** (`src/app/page.tsx`) — Already links to `/subjects` — add `/plans` link if desired
- **Auth redirect** — Sign-up redirects to `/subjects` — update if `/plans` becomes the primary landing
- **Schema** — `topics.status` is "pending" by default. `study_plans.hoursPerDay` is a single float — may need schema evolution or mapping for hours/week + days model (planner handles this)

### Potential Schema Evolution Notes
- D-18 (hours per week + days) may require schema changes — `hoursPerDay` is a single float. Consider: adding `study_days` (JSON array or comma-separated day numbers) to `study_plans`, or adding a dedicated `study_availability` table. Planner should determine best approach.

</code_context>

<specifics>
## Specific Ideas

- Subject cards should feel clean and scannable — color dot helps visual recognition at a glance
- Plan creation should feel quick — single form, not a multi-step process
- Hours per week + days-of-week model is more realistic than just "hours per day" — people don't study 7 days a week
- Archive pattern preferred over hard delete for safety — user can always restore or permanently delete later
- Bulk add textarea is preferred for topic entry — typing "Algebra\nCalculus\nGeometry" is faster than individual form submissions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-subject-topic-management*
*Context gathered: 2026-06-22*
