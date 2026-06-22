# Project Research Summary

**Project:** Study Planner Web App
**Domain:** Personal study planner with automatic timetable generation and revision scheduling
**Researched:** 2026-06-22
**Confidence:** HIGH

## Executive Summary

This is a **personal study planner web app** — a single-user tool that lets students input their subjects and deadlines, then automatically generates a daily study schedule that distributes topics evenly before the deadline, with built-in revision scheduling at spaced intervals. The market whitespace is clear: every existing competitor (MyStudyLife, Revu, Study-Track) requires manual scheduling. This app's core differentiator is doing it automatically while respecting the user's available time per day.

**Recommended approach:** Next.js 16.2.9 LTS with App Router, Server Components for data fetching, and Server Actions for mutations. Turso (edge-hosted SQLite) via `@libsql/client` for the database, Drizzle ORM for type-safe queries, and Better Auth for authentication. The timetable engine should be a **deterministic pure TypeScript function** with proper constraint modeling (hard vs. soft constraints), not an over-engineered solver like OR-Tools. For revision scheduling, **use `ts-fsrs`** (the Free Spaced Repetition Scheduler) rather than naive fixed-interval date arithmetic — it's a mature TypeScript library with a proper memory model, and the implementation cost is negligible compared to the retention benefit.

**Key risks and mitigation:**
1. **Rigid schedule abandonment:** If the timetable fills 100% of available time, one missed session cascades into abandonment. Mitigation: schedule only 70% of available time, include buffer blocks and catch-up days, and build "regenerate from today" as a first-class feature.
2. **Onboarding overload:** If the user must fill 10+ fields before seeing a schedule, they abandon. Mitigation: minimum viable onboarding — 1 subject + 1 deadline = immediate timetable. Progressive feature disclosure thereafter.
3. **Naive revision scheduling:** Fixed 7d/30d intervals look like spaced repetition but aren't effective. Mitigation: use `ts-fsrs` from day one — it's already a mature library with zero additional complexity cost.
4. **Planning fallacy blindness:** User estimates for study time are 25-50% too optimistic. Mitigation: auto-apply a 25% buffer to all user-provided estimates, and calibrate against actual completion data after 3+ data points.

## Key Findings

### Recommended Stack

The stack is well-established with clear version compatibility. The standout recommendation is **Next.js 16 over 15** (v15 reaches EOL October 2026), and **Better Auth over Auth.js** (Auth.js maintainers now redirect to Better Auth). Drizzle ORM is the correct choice over Prisma for Turso compatibility — Prisma migrations don't work over HTTP. Full details in [STACK.md](./STACK.md).

**Core technologies:**
- **Next.js 16.2.9 LTS**: Full-stack React framework with App Router, Server Components, Server Actions — the current LTS that avoids a migration from v15 within months
- **Turso (via @libsql/client 0.17.4)**: Edge-hosted SQLite — HTTP-based, no cold starts on Vercel serverless, 9GB free tier
- **Drizzle ORM 0.45.2**: Type-safe SQL ORM with native Turso/libSQL support, ~7.4kb gzipped, generates plain SQL migrations
- **Better Auth 1.6.19**: Authentication with native Drizzle/SQLite adapter, cookie-based sessions, built-in email/password — the clear 2026 winner
- **Tailwind CSS v4 + shadcn/ui**: CSS-first config, OKLCH colors, Radix UI primitives — standard for all new Next.js projects
- **date-fns 4.4.0**: Date manipulation for scheduling math (7d/30d windows, deadline calculations), tree-shakeable
- **Recharts 3.x**: SVG-based charts for progress visualization, shadcn/ui chart blocks built on it
- **zod 4.x**: Schema validation for user input and Server Actions

**What NOT to use:** Next.js 15 (EOL Oct 2026), Pages Router (deprecated), Prisma (migrations break with Turso), Auth.js v5 (maintainers recommend Better Auth), Clerk (vendor lock-in), Moment.js (deprecated), JWT for sessions (Better Auth handles it), React Context for global state (Server Components suffice).

### Expected Features

Full feature analysis in [FEATURES.md](./FEATURES.md). The competitive whitespace is clear: **no competitor combines automatic timetable generation + topic-level revision scheduling + available time input**. Every existing tool makes you schedule manually.

**Must have (table stakes) — P1 for v1:**
- User account with email/password auth — data must persist
- Subject/topic CRUD — core data model
- Study plan creation (pick subject, set deadline, select topics)
- **Automatic timetable generation** — THE differentiator, must work correctly
- Automatic revision scheduling (7d/30d intervals after completion)
- Available time input (user defines hours per day)
- Mark topic as studied — core feedback loop
- Calendar view (weekly default) — see daily schedule
- Progress tracking (% complete)
- Basic study session logging

**Should have (competitive) — P2 for v1.x:**
- Focus/Pomodoro timer — auto-log study time
- Charts (completion over time, study hours vs planned)
- Streak tracking — gamify consistency
- **Adaptive rescheduling** — replan remaining topics if user falls behind
- Browser notifications — retention
- iCal export — compromise in lieu of full calendar sync

**Defer (v2+):**
- Multiple concurrent study plans
- Subject-level analytics
- File import (CSV)
- Dark mode / themes
- Native mobile app

**Anti-features (deliberately NOT building):** Flashcards (entire product category), file import (support nightmare), Google Calendar sync (huge integration surface), multi-user/study groups (triples scope), AI quiz generation (reliability problems), full note-taking (competes with Notion/Obsidian).

### Architecture Approach

Full architecture in [ARCHITECTURE.md](./ARCHITECTURE.md). The architecture follows a clean layered pattern optimized for Next.js App Router + Turso.

**Major components:**
1. **Server Components (RSC)** — All data fetching via direct DAL calls. Page shells render server-side and pass data as props to interactive islands. No client-side data fetching for study planner data (subjects, topics, schedule — none of it is real-time).
2. **Server Actions (Thin Orchestrator Pattern)** — Each action does exactly 5 things: authenticate, validate with Zod, call a DAL command, revalidate cache, return typed result or redirect. Business logic lives in DAL commands, not in actions.
3. **Data Access Layer (lib/dal/)** — All database access centralized in `queries/` (reads) and `commands/` (writes). Pages and actions never import Drizzle directly. The `scheduler/` sub-module houses the timetable generation engine. This layer uses `React.cache()` for per-request deduplication.
4. **Scheduler Engine (lib/dal/scheduler/)** — Pure TypeScript, deterministic, sub-millisecond execution for personal-scale data. No external solver dependencies (OR-Tools is overkill for 20 topics). Input: topics + deadline + hoursPerDay. Output: daily schedule slots with study + revision entries.
5. **Auth Layer (lib/auth/)** — Better Auth with LibSQL adapter. Middleware checks session cookie on protected routes. Server Actions call `requireAuth()` at the top.
6. **Database Schema** — 9 tables: `users`, `subjects`, `topics`, `study_plans`, `plan_topics` (join), `schedule_slots` (generated timetable), `study_sessions`, `completions`, `revisions`. Denormalized `completedTopics` on `study_plans` for fast dashboard reads.

**Key patterns to follow:**
- DAL as the single boundary for all database access (anti-pattern: scattered DB queries in pages)
- Thin Server Actions (anti-pattern: putting business logic in actions)
- Server Components for reads, Client Components only for interactivity (anti-pattern: client-side fetching with loading spinners)
- Persist generated schedule in DB (anti-pattern: computing on every page load or storing in memory)

### Critical Pitfalls

Top 5 pitfalls from [PITFALLS.md](./PITFALLS.md) that must be designed against:

1. **Rigid Schedule Collapse (Critical):** Scheduling 100% of available time with no buffer. One missed session cascades into abandonment. **Prevention:** Only schedule 70% of available time, include 1-2 catch-up blocks per week, never schedule back-to-back blocks, build "regenerate from today" from day one. Buffer blocks and catch-up days must be in the generation algorithm from the start (Phase 3).

2. **Naive Revision Scheduling (Critical):** Implementing 7d/30d intervals as simple date arithmetic rather than a proper spaced repetition model. Users get fixed intervals regardless of difficulty or recall performance. **Prevention:** Use `ts-fsrs` (mature TypeScript FSRS implementation) from day one. Implement a 4-button rating system (Again/Hard/Good/Easy) instead of binary "studied/not studied." Fixed 7d/30d is only acceptable as default initial values before review history exists.

3. **Over-Constrained Scheduling (Critical):** Treating all user preferences as hard constraints, producing an unsolvable problem or a schedule that exceeds waking hours. **Prevention:** Run a pre-feasibility check before generation (`sum(topic hours) <= available hours × days`). Distinguish hard constraints (deadline, max hours) from soft constraints (preferred time of day, days of week). Implement a "relaxation ladder" — drop soft constraints in order until a solution is found.

4. **Onboarding Overload (Critical):** Requiring 10+ fields before generating a timetable. Users abandon at 82% rate by Day 14. **Prevention:** Design a < 2-minute onboarding path — ask for 1 subject + 1 deadline, generate immediately. Use sensible defaults (9 AM start, 50-min sessions). Progressive feature disclosure: unlock revision scheduling after 3+ sessions, charts after 2+ weeks.

5. **Planning Fallacy Blindness (Critical):** Using user-provided time estimates as ground truth. Research consistently shows humans underestimate task duration by 25-50%. **Prevention:** Auto-apply a 25% buffer to all user-provided estimates. Track actual vs. estimated time per topic/subject and calibrate after 3+ data points. Don't require time estimates at all — use topic count + deadline as the primary scheduling input.

## Implications for Roadmap

Based on combined research across all four files, I recommend **6 phases** with strict sequential dependencies:

### Phase 1: Project Setup & Data Model
**Rationale:** Foundation for everything downstream. Stack, database schema, and project structure must be right before any feature work. This phase avoids the "scattered DB queries" and "no event log" anti-patterns by setting up the DAL and audit log schema from the start.
**Delivers:** Running Next.js project, Turso connection, Drizzle schema for all 9 tables, DAL skeleton, project structure with `lib/dal/` boundary, CI/CD pipeline.
**Addresses:** Infrastructure for all features in FEATURES.md
**Avoids:** Pitfall #8 (shame-based design) — data model stores completed events positively, never "missed"/"overdue" counts
**Uses:** Next.js 16.2.9, TypeScript 5.x, Turso + @libsql/client, Drizzle ORM, Tailwind CSS v4, shadcn/ui
**Research flag:** **Standard patterns — skip research-phase.** Well-documented Next.js + Turso + Drizzle setup with official starters and guides.

### Phase 2: Auth & Subject Management
**Rationale:** Auth is required for data persistence. Subject/topic CRUD is the prerequisite for timetable generation. This phase must also establish the **progressive disclosure** pattern — the UI must be designed for speed-to-value, not completeness.
**Delivers:** Signup/login/logout flow with Better Auth, protected routes via middleware, subject CRUD, topic CRUD with metadata (difficulty rating, study type), user preferences (default hours, energy windows).
**Addresses:** Feature set: User Account, Subject/Topic Management
**Avoids:** Pitfall #4 (onboarding overload) — subject input must be minimal (name + deadline only), metadata collected progressively. Pitfall #6 (energy ignorance) — subject metadata fields for difficulty and study type are included in the schema.
**Uses:** Better Auth 1.6.19 with Drizzle/SQLite adapter, zod 4.x for validation
**Research flag:** **Standard patterns — skip research-phase.** Better Auth + Drizzle integration is well-documented with official adapter guide.

### Phase 3: Timetable Engine (THE CORE)
**Rationale:** This is the primary differentiator and the hardest technical work. It depends on Phase 2 (subjects/topics and user preferences exist). The engine must be designed with constraint modeling, feasibility checking, buffer allocation, and catch-up slots from the start — these cannot be retrofitted.
**Delivers:** Deterministic pure TS scheduler that takes topics + deadline + hoursPerDay → daily schedule slots. Pre-feasibility check with user-facing explanation. 70% capacity scheduling rule. Buffer blocks and catch-up days. Constraint hierarchy (hard: deadline, max hours; soft: preferred times, topic ordering). Weekly schedule display.
**Addresses:** Feature set: Study Plan creation, Automatic Timetable Generation, Available Time Input, Calendar View (weekly)
**Avoids:** Pitfall #1 (over-constrained scheduling) — feasibility check + constraint relaxation. Pitfall #2 (rigid schedule collapse) — buffer blocks + catch-up slots. Pitfall #5 (planning fallacy) — auto-buffer on estimates. Pitfall #6 (energy ignorance) — peak window scheduling. Pitfall #9 (hard/soft constraint confusion) — explicit constraint hierarchy.
**Uses:** date-fns for date math, pure TypeScript (no external solver)
**Research flag:** **Needs deeper research during planning.** Specifically: (1) How to model hard vs. soft constraints in a simple TypeScript engine — the constraint hierarchy needs design, not just code. (2) Feasibility check messaging — what UX to show when schedule is impossible. Consider dedicating a `/gsd-research-phase` to constraint modeling approaches.

### Phase 4: Revision Engine (FSRS Integration)
**Rationale:** Requires Phase 3 (schedule slots exist for revisions to attach to) and Phase 2 (topics exist). Revision scheduling is the second differentiator and must use proper spaced repetition, not naive date arithmetic.
**Delivers:** Integration with `ts-fsrs` for Free Spaced Repetition Scheduling. 4-button rating system (Again/Hard/Good/Easy). Memory state (stability, difficulty, retrievability) stored per topic. Review event audit log. Revision slots generated on schedule based on FSRS-determined intervals.
**Addresses:** Feature set: Automatic Revision Scheduling (7d/30d)
**Avoids:** Pitfall #3 (naive revision scheduling) — using FSRS instead of fixed arithmetic. Technical debt: storing raw review events for future algorithm retraining.
**Uses:** ts-fsrs (npm), review event logging in completions/revisions tables
**Research flag:** **Needs deeper research during planning.** `ts-fsrs` integration with Drizzle + Turso needs verification. Specifically: (1) How to store FSRS memory state (S/D/R parameters) efficiently in SQLite/Turso. (2) The FSRS parameter seeding strategy for new users. (3) Whether to use the default FSRS parameters or calibrate. Consider a `/gsd-research-phase` focused on FSRS integration patterns and schema design for review events.

### Phase 5: Progress & Adaptation
**Rationale:** Requires Phase 3 (schedule to measure progress against) and Phase 4 (revision tracking). This phase completes the core feedback loop: study → mark done → schedule adjusts.
**Delivers:** Mark topic as studied (updates schedule_slots + completions). Progress tracking (% complete per plan/subject/overall). Adaptive rescheduling ("regenerate from today" button). Backlog management (missed topics carried forward, not silently dropped). Actual vs. estimated time tracking with auto-calibration. Weekly review prompt.
**Addresses:** Feature set: Mark Topic as Studied, Progress Tracking, Adaptive Rescheduling, Study Session Logging
**Avoids:** Pitfall #7 (one-shot planning) — adaptive rescheduling is a first-class feature, not an afterthought. Pitfall #10 (no backlog management) — missed topics are explicitly tracked and triaged.
**Uses:** DAL commands for progress mutations, scheduler for rescheduling logic
**Research flag:** **Standard patterns — skip research-phase.** The progress tracking and rescheduling patterns are well-understood. The key decisions (denormalized counters, rebalance algorithm) are documented in ARCHITECTURE.md.

### Phase 6: Dashboard & Visualizations
**Rationale:** Requires Phase 5 (enough data for charts to be meaningful). This phase is about presentation and motivation, not core functionality.
**Delivers:** Dashboard page with progress charts (completion over time, topics by subject, weekly study hours vs planned, revision adherence). Streak tracking (consistency-based, not streak-reset). Positive-only progress indicators (no overdue counts, no red badges). Welcome-back flow for returning users. Polish: responsive mobile calendar, interactive schedule slots.
**Addresses:** Feature set: Progress Visualization (charts), Streak Tracking
**Avoids:** Pitfall #8 (shame-based design) — all metrics are positive/completion-based, no "overdue" or "missed" indicators. UX pitfalls from PITFALLS.md (empty state CTA, next-topic recommendation after marking done, draggable slots).
**Uses:** Recharts 3.x, shadcn/ui chart blocks, lucide-react icons
**Research flag:** **Standard patterns — skip research-phase.** Recharts + shadcn/ui chart blocks are well-documented. The design challenge (shame-free UX) is a product decision, not a research question.

### Phase Ordering Rationale

- **Dependency-driven ordering:** The sequence follows the feature dependency graph from FEATURES.md. Auth → Subjects/Topics → Timetable → Revision → Progress → Charts. Each phase builds on the data structures of the previous one.
- **Risk-first scheduling:** Phase 3 (Timetable Engine) is the highest-risk, highest-value work and comes early (Phase 3 of 6). If the timetable algorithm doesn't work, the app has no value proposition. It follows the two setup phases because it needs subjects, topics, and user preferences as inputs.
- **Quality before breadth:** Phase 3 and 4 each ship exactly one core feature to production quality. Per Pitfall #12 (feature bloat), no parallel feature work until the prior phase is validated. The timetable must be genuinely useful before Phase 5 begins.
- **Onboarding-first thinking:** Phase 2's subject/deadline UI must be designed for speed-to-value. The entire architecture assumes a user can go from signup to seeing a schedule within 2 minutes with ≤ 3 inputs. This requires coordination between Phase 2 (minimal forms) and Phase 3 (accept minimal input, produce immediate output).
- **FSRS from day one:** Phase 4 uses `ts-fsrs` rather than naive date arithmetic. Per the technical debt analysis in PITFALLS.md, fixed-interval revision is never acceptable — there's no implementation cost savings to justify the degradation when `ts-fsrs` is readily available.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Timetable Engine):** Constraint hierarchy design. How to model hard vs. soft constraints in a simple TypeScript engine without over-engineering. Feasibility check UX messaging. This is a design research question, not a technology research question.
- **Phase 4 (Revision Engine):** FSRS integration pattern with Drizzle + Turso. Schema design for review events and memory state storage. Parameter seeding strategy. This is primarily a technology verification question — `ts-fsrs` is well-documented but the Drizzle+Turso integration path needs confirmation.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Next.js + Turso + Drizzle + Tailwind v4 + shadcn/ui — all have official starters and guides
- **Phase 2:** Better Auth + Drizzle — official adapter guide, well-trodden path
- **Phase 5:** Progress tracking, adaptive rescheduling — well-understood patterns, decisions are documented in ARCHITECTURE.md
- **Phase 6:** Recharts + shadcn/ui charts — well-documented, standard implementation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All technologies verified against official docs, npm pages, and version compatibility matrices. Next.js 16 LTS confirmed via release blog and npm. Better Auth superiority over Auth.js confirmed via maintainer redirect. Drizzle + Turso native compatibility confirmed via official docs. |
| Features | **HIGH** | Feature landscape verified against 8+ competitor products (MyStudyLife, Revu, Anki, Study-Track, YPT, Study Bunny, Shovel) and multiple 2026 roundup articles. Feature dependencies mapped and verified against real usage patterns. Anti-features validated by post-mortems and user research. |
| Architecture | **HIGH** | Patterns verified against Next.js 16 official docs, Turso integration guides, and production reference codebases (0xstack, MakerKit, Study Sync). DAL pattern confirmed by Drizzle docs and community production patterns. Schema design cross-referenced against two real study planner codebases. |
| Pitfalls | **HIGH** | Risk sources span academic research (Buehler et al. 1994 planning fallacy, Frontiers in Education 2025 buffer study), production post-mortems (Biddit, PMTechLessons, Matt Layman), student behavior research (82% Day-14 abandonment), and spaced repetition literature (FSRS documentation, Anki issue trackers). Multiple independent sources confirm each critical pitfall. |

**Overall confidence:** HIGH

### Gaps to Address

1. **Constraint modeling approach for Phase 3:** The research recommends deterministic even-distribution with constraint relaxation (not OR-Tools), but the specific constraint hierarchy design needs prototyping. The feasibility check UX — what exactly we tell the user when the schedule is impossible — is a product design question that needs validation during planning.

2. **FSRS parameter seeding for new users (Phase 4):** The research identifies that `ts-fsrs` defaults are optimized for general populations, not individual learning patterns. The specific strategy for gradually weighting toward user history vs. population defaults needs design during Phase 4 planning. FSRS needs ~50 reviews per user before stabilizing — what do we show until then?

3. **Buffer percentage calibration (Phase 3):** Research recommends 70% scheduling (30% buffer). This is well-supported by literature but may need adjustment based on actual usage patterns. Plan to make this configurable internally (not user-facing) so it can be tuned.

4. **Mobile-first calendar interaction (Phase 3/6):** The research identifies that students check schedules on phones, but the specific calendar interaction model (draggable slots on mobile? tap-to-reschedule?) isn't resolved in the architecture. Needs UX prototyping during Phase 6 planning.

5. **No production load testing on Turso:** For a single-user personal tool, Turso's 9GB free tier is more than sufficient. The research doesn't include specific Turso edge-case testing (e.g., cold start latency on first Vercel request after idle). This is low-risk but worth a note.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16) — LTS confirmation, React 19.2 support
- [Next.js npm](https://www.npmjs.com/package/next) — v16.2.9 latest
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/tutorials/drizzle-with-turso) — Native libSQL support
- [Better Auth Docs](https://better-auth.com/docs/integrations/drizzle) — SQLite adapter confirmed
- [Turso + Next.js Official Guide](https://docs.turso.tech/sdk/ts/guides/nextjs) — Integration patterns
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) — Tailwind v4 support
- [FSRS Documentation](https://github.com/open-spaced-repetition/ts-fsrs) — TypeScript FSRS implementation
- [fsrs-rs documentation](https://github.com/open-spaced-repetition/fsrs-rs/) — Rust implementation with algorithm details
- [FSRS - A Modern Anki Schedule](https://www.youtube.com/watch?v=EJk3Rpl5UQ4) — How FSRS works (5-min tutorial)
- [Competitor feature analysis](https://my.studyly.app/en) — MyStudyLife, Revu, YPT, Study Bunny, Anki, Shovel — 8 products analyzed

### Secondary (MEDIUM confidence)
- [Building Production-Grade Next.js — Design Patterns (Kaveesh Karunarathna)](https://medium.com/@kaveeshbc/building-production-grade-next-js-part-2-design-patterns-data-af76543beb4c) — DAL pattern
- [Structuring Your Data Access Layer in Next.js (MD Samrose)](https://medium.com/@samrose.mohammed/structuring-your-data-access-layer-in-next-js-patterns-that-actually-scale-2e4c07491866) — DAL verification
- [0xstack CQRS Architecture](https://github.com/0xMilord/0xstack) — Production pattern reference
- [MakerKit Next.js + Drizzle Server Actions Guide](https://makerkit.dev/docs/nextjs-drizzle/development-guide/server-actions) — Thin action pattern
- [Study Sync Architecture](https://www.mintlify.com/AffanHossainRakib/study-sync/architecture/overview) — Study planner reference
- [DEV Community — "Why Most Study Planners Fail" (2026)](https://dev.to) — Planner abandonment patterns
- [User Intuition — "EdTech Churn: What 10,000 Interviews Reveal" (2026)](https://www.userintuition.com/) — Onboarding and shame-based design
- [Biddit.app post-mortem (Marc-Robin Gruener)](https://biddit.app) — Feature bloat in study planner
- [Better Auth vs Auth.js comparison](https://www.wisp.blog/blog/authjs-vs-betterauth-for-nextjs-a-comprehensive-comparison) — Confirms Better Auth superiority
- [Frontiers in Education 2025](https://www.frontiersin.org/journals/education) — Buffer block study (70% capacity rule)
- [Buehler, Griffin, & Ross 1994](https://doi.org/10.1037/0022-3514.67.3.366) — Planning fallacy research

### Tertiary (LOW confidence)
- [GPG Ka Funda — "The Truth About Perfect Study Timetables" (2026)](https://gpgkafunda.com/) — Blog post consistent with research findings but single source
- [AI Study Planner Database Schema (Harshal-Bsys27)](https://github.com/Harshal-Bsys27/ai-study-planner) — Schema reference, unverified production usage
- [Plan4U Study Planner (sahil007-ai)](https://github.com/sahil007-ai/raisoni) — Schema reference, unverified production usage

---

*Research completed: 2026-06-22*
*Ready for roadmap: yes*
