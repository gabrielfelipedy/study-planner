# Roadmap: Study Planner

## Overview

A personal web app that automatically creates study timetables based on deadlines. The journey moves from foundation (stack, auth, data model) through the core differentiator (timetable generation engine) to the feedback loop (tracking progress, revision scheduling, adaptive rescheduling) and finally to visualization (dashboard and charts). Each phase delivers a coherent, verifiable capability.

## Phases

- [x] **Phase 1: Foundation & Data Model** - Project scaffold, Turso DB, Drizzle schema, DAL pattern, CI/CD
- [ ] **Phase 2: Authentication** - Sign up, login/logout, password reset, protected routes
- [ ] **Phase 3: Subject & Topic Management** - Creat/edit subjects, topics, deadlines, available time input
- [ ] **Phase 4: Timetable Engine & Schedule View** - Auto-generate daily schedule, manual adjustment, in-app schedule view
- [ ] **Phase 5: Study Sessions & Progress Tracking** - Mark topics as studied, track completion %, session logging
- [x] **Phase 6: Revision Scheduling** - Auto-schedule revisions via FSRS after topics are studied
- [ ] **Phase 7: Adaptive Rescheduling** - Regenerate schedule from today based on actual vs planned progress
- [ ] **Phase 8: Dashboard & Visualizations** - Charts (completion trends, study hours), positive-only metrics

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: Running Next.js project with Turso database connected, all schema tables created, and data access layer structure established
**Depends on**: Nothing (first phase)
**Requirements**: (none — infrastructure)
**Success Criteria** (what must be TRUE):
  1. Developer can run `npm run dev` and see the app skeleton in browser
  2. Turso database is connected and Drizzle migrations run successfully
  3. All 9 schema tables (users, subjects, topics, study_plans, plan_topics, schedule_slots, study_sessions, completions, revisions) exist in the database
  4. DAL directory structure (`lib/dal/queries/`, `lib/dal/commands/`, `lib/dal/scheduler/`) exists with skeleton exports
  5. CI/CD pipeline (lint, type-check) passes on push via GitHub Actions
**Plans**: 4 plans (2 waves)

Plans:
- [x] 01-01-PLAN.md — Project scaffold (Next.js 16, dependencies, Drizzle config, env templates)
- [x] 01-02-PLAN.md — Database schema & client (all 9 tables, local SQLite dev connection)
- [x] 01-03-PLAN.md — Data Access Layer skeleton (11 files across queries, commands, scheduler)
- [x] 01-04-PLAN.md — GitHub repository & CI/CD (git init, Actions workflow, push)

### Phase 2: Authentication ✓
**Goal**: Users can securely access their accounts with email/password
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
    1. User can create an account with email and password on a signup page
    2. User can log in and stay logged in across browser sessions (persistent session)
    3. User can log out from any authenticated page
    4. User can reset forgotten password via email link
    5. Unauthenticated users are redirected to login when visiting protected routes
**Plans**: 1 plan (1 wave)
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Better Auth integration, auth pages, middleware, nav

### Phase 3: Subject & Topic Management
**Goal**: Users can organize their study material and define scheduling constraints
**Depends on**: Phase 2
**Requirements**: SUBJ-01, SUBJ-02, SUBJ-03
**Success Criteria** (what must be TRUE):
  1. User can create subjects (e.g., "Math", "Physics") and edit/delete them
  2. User can add topics under subjects with optional metadata (difficulty, estimated hours)
  3. User can set a deadline for completing a set of topics within a subject
  4. User can input their available daily or weekly study time
  5. User can see a list of their subjects and topics on a management page
**Plans**: 3 plans (2 waves)
**UI hint**: yes

Plans:
- [ ] 03-01-PLAN.md — Subject management: schema (archivedAt), DAL, card grid list, create/edit pages, archive dialog
- [ ] 03-02-PLAN.md — Topic management: DAL (bulk create, reorder, batch delete), subject detail page with inline list, bulk add, inline edit, drag-drop, select mode
- [ ] 03-03-PLAN.md — Study plan management: schema (hoursPerWeek, studyDays, archived), plan DAL, nav link, plan pages, study time input

### Phase 4: Timetable Engine & Schedule View ✓
**Goal**: App generates a usable daily study schedule from topics, deadline, and available time
**Depends on**: Phase 3
**Requirements**: TIME-01, TIME-03, PROG-03
**Success Criteria** (what must be TRUE):
  1. User provides subjects/topics and a deadline, and the app generates a daily schedule immediately
  2. Schedule distributes topics evenly across available days, respecting user's available study time
  3. User can see their scheduled topics in a daily/weekly schedule view (in-app calendar)
  4. User can manually reschedule or drag topics to different days
  5. Schedule includes buffer blocks (~30% unscheduled time) and catch-up days to prevent rigidity
**Plans**: 4 plans (3 waves)
**UI hint**: yes

Plans:
- [ ] 04-01-PLAN.md — Infrastructure & schema: install dnd-kit, vitest config, DB migration
- [ ] 04-02-PLAN.md — Scheduler engine & DAL: distribute.ts algorithm, schedule commands/queries
- [ ] 04-03-PLAN.md — Calendar UI components: topic-card, day-cell, calendar grid, dialogs
- [ ] 04-04-PLAN.md — Server Actions & page integration: generate/move actions, plan detail page

### Phase 5: Study Sessions & Progress Tracking
**Goal**: Users can log study activity and see their completion progress
**Depends on**: Phase 4
**Requirements**: PROG-01, PROG-02
**Success Criteria** (what must be TRUE):
  1. User can start a study session and mark topics as studied
  2. User can see overall progress percentage (topics completed vs planned) on the schedule view
  3. Progress percentage updates immediately after marking topics
  4. User can see which topics are completed, in progress, or pending in the schedule
**Plans**: 3 plans (2 waves)
**UI hint**: yes

Plans:
- [ ] 05-01-PLAN.md — DAL & Server Actions: markTopicStudied command, progress queries, markTopicStudiedAction
- [ ] 05-02-PLAN.md — Calendar inline marking: topic-card 2-step completion, toast feedback, calendar wiring
- [ ] 05-03-PLAN.md — Session page & homepage: /plans/[id]/study checklist page, homepage today's summary

### Phase 6: Revision Scheduling
**Goal**: App auto-schedules revision sessions at spaced intervals after topics are studied
**Depends on**: Phase 5
**Requirements**: TIME-02
**Success Criteria** (what must be TRUE):
   1. After marking a topic as studied, revision slots appear on the schedule at appropriate intervals
   2. User can see revision slots visually distinguished from new study slots in the schedule view
   3. Revision intervals use spaced repetition (FSRS) — intervals adapt based on review rating (Again/Hard/Good/Easy)
**Plans**: 2 plans (2 waves)
**UI hint**: yes

Plans:
- [x] 06-01-PLAN.md — FSRS Engine & Integration: schema columns, ts-fsrs install, scheduleRevision/processReviewRating DAL, wire into markTopicStudied, Server Actions
- [x] 06-02-PLAN.md — Revision UI: calendar slot styling (purple/indigo), revision-rating component (Again/Hard/Good/Easy)

### Phase 7: Adaptive Rescheduling
**Goal**: Schedule adapts to the user's actual progress to stay achievable
**Depends on**: Phase 5, Phase 4
**Requirements**: PROG-05
**Success Criteria** (what must be TRUE):
  1. User can trigger "regenerate from today" to replan remaining topics based on actual progress vs planned
  2. Behind-schedule topics are redistributed across remaining days before the deadline
  3. Completed topics remain marked; only pending and missed topics are rescheduled
  4. User retains manual adjustments made to the schedule after regeneration (previously set slots are preserved)
**Plans**: 2 plans (2 waves)
**UI hint**: yes

Plans:
- [x] 07-01-PLAN.md — Adapt engine & schema: isManual migration, adaptSchedule(), moveSlotAction setManual, regenerateScheduleAction rewrite
- [x] 07-02-PLAN.md — Backlog display & behind-schedule UI: regenerate button, backlog indicator, amber calendar styling, dialog update

### Phase 8: Dashboard & Visualizations
**Goal**: Users can see progress trends and study metrics through visual charts
**Depends on**: Phase 5, Phase 6
**Requirements**: PROG-04
**Success Criteria** (what must be TRUE):
  1. User can view a dashboard page with charts showing completion over time
  2. User can see topics completed by subject (pie/bar chart)
  3. User can see weekly study hours vs planned hours chart
  4. User can see revision adherence rate (scheduled vs completed revisions)
  5. All metrics use positive/completion-based framing (no "overdue" or "missed" shame indicators)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 4/4 | ✓ Complete | 2026-06-22 |
| 2. Authentication | 1/1 | ✓ Complete | 2026-06-22 |
| 3. Subject & Topic Management | 3/3 | ✓ Complete | 2026-06-23 |
| 4. Timetable Engine & Schedule View | 4/4 | ✓ Complete | 2026-06-23 |
| 5. Study Sessions & Progress Tracking | 3/3 | ✓ Complete | 2026-06-23 |
| 6. Revision Scheduling | 2/2 | ✓ Complete | 2026-06-23 |
| 7. Adaptive Rescheduling | 2/2 | ✓ Complete | 2026-06-23 |
| 8. Dashboard & Visualizations | 0/0 | Not started | - |

---

*Created: 2026-06-22*
*Granularity: fine (8 phases)*
