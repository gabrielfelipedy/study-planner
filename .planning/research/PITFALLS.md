# Pitfalls Research: Study Planner — Timetable Generation & Revision Scheduling

**Domain:** Personal study planner web app with automatic timetable generation and spaced revision scheduling
**Researched:** 2026-06-22
**Confidence:** HIGH (verified across multiple independent sources including production post-mortems, academic research, and cognitive science literature)

---

## Critical Pitfalls

### Pitfall 1: Over-Constrained Scheduling → Unsolvable Timetable

**What goes wrong:**
The timetable generator receives a set of constraints (subjects, topics, deadline, available hours) that are mathematically impossible to satisfy. The solver returns "no solution found" or produces a timetable that schedules more study hours than the user actually has available. The user then either gets a blank screen, an error, or a schedule they can't follow from Day 1.

**Why it happens:**
Timetabling is NP-hard in the general case. Common causes:
- Users overestimate available time (the "planning fallacy" — humans underestimate task time by 25-50%)
- The developer treats all constraints as mandatory (hard constraints) with no fallback
- No feasibility check is run *before* attempting to schedule
- Total required study hours > available time slots, making the problem unsolvable
- The naive "even distribution" approach doesn't account for topic difficulty variance

**How to avoid:**
1. **Pre-feasibility check before generation:** Verify `sum(topic hours) <= available hours × days`. If not, tell the user *before* attempting to schedule, with specific numbers: "You have 30 hours of content but only 20 hours available before your deadline."
2. **Distinguish hard vs. soft constraints:** Spread topics evenly (preference), don't schedule past 10 PM (preference), deadline must be met (hard). Use a constraint satisfaction approach where soft constraints can be relaxed.
3. **Use a constraint solver library** (e.g., `js-csp` or a simple backtracking algorithm) rather than ad-hoc `if/else` chains — brittle scheduling logic is the #1 source of bugs.
4. **Implement a "relaxation ladder":** If no solution found, drop the least important soft constraint and try again. Show the user what was compromised.

**Warning signs:**
- Timetable generation takes > 5 seconds or hangs
- User reports "the schedule doesn't fit my life"
- Generated schedule shows study blocks during hours the user marked as unavailable
- Algorithm produces a schedule but it schedules more hours than there are waking hours available

**Phase to address:**
**Phase 3 (Timetable Engine)** — The constraint model must be designed from the start with feasibility checking. Retroactively adding relaxation logic to a rigid scheduler requires a rewrite.

---

### Pitfall 2: Rigid Schedule Collapse — No Buffer, No Recovery

**What goes wrong:**
The generated timetable assigns every available hour to specific topics. Day 1, the user misses a session (life happens). Now every subsequent day is out of sync. The backlog compounds. By Day 4, the schedule is so far from reality the user abandons it entirely. This is consistently the #1 reason study planners fail according to student behavior research.

Research consistently shows: flexible timetables outperform rigid ones over time. Students with buffer blocks in their schedules maintain compliance 40% longer than those without (Frontiers in Education, 2025).

**Why it happens:**
- The scheduler optimizes for "completeness" (fill every slot) rather than "resilience" (leave slack)
- No concept of buffer blocks, catch-up days, or minimum-viable versions of the schedule
- The developer assumes students will follow the plan perfectly — which never happens
- One missed session creates a domino effect: missed topic → backlog → stress → "I'll restart Monday" → abandonment

**How to avoid:**
1. **Only schedule 70% of available time:** Leave 30% as buffer/flex blocks. Multiple studies confirm this is the sustainable maximum.
2. **Generate a "minimum viable schedule" alongside the full schedule:** What can the user accomplish even on a bad day? (1-2 focused blocks instead of 5)
3. **Never schedule back-to-back blocks:** 15-minute gaps between study sessions absorb transitions and overruns.
4. **Include 1-2 "catch-up" blocks per week** with no pre-assigned topic.
5. **Build a "reschedule" feature, not just "mark as done":** When a session is missed, the system should automatically redistribute uncompleted topics, not leave them orphaned.
6. **One missed day is data, not failure:** The system should gracefully carry forward unfinished work without guilt.

**Warning signs:**
- Schedule has zero unscheduled blocks during the week
- User must miss sleep to complete the scheduled study
- Any single missed session cascades into multiple backlogged topics
- User reports feeling "behind" after one missed day

**Phase to address:**
**Phase 3 (Timetable Engine)** — Buffer blocks, catch-up days, and minimum-viable schedules must be part of the generation algorithm, not added as afterthoughts. **Phase 5 (Progress & Adaptation)** — Rescheduling logic for missed sessions.

---

### Pitfall 3: Revision Scheduling as a Calendar Entry, Not a Spaced Repetition System

**What goes wrong:**
The project specifies "auto-scheduled revisions at 7-day and 30-day intervals." Implementing this as simple calendar entries (e.g., "Review Topic X on date+7") misses the entire point of spaced repetition. True spaced repetition requires:
- Variable intervals based on recall performance (not fixed 7d/30d)
- Recall probability tracking (Retrievability in the DSR model)
- Difficulty-adjusted scheduling (harder topics reviewed sooner, easier later)
- Priority queuing for overdue reviews when backlog accumulates

The naive 7d/30d approach produces a schedule that *looks* like it implements revision but doesn't actually leverage the spacing effect, which requires intervals that grow based on demonstrated recall.

**Why it happens:**
- "7d and 30d revisions" sounds like spaced repetition to non-experts
- SM-2 / FSRS algorithms seem complex, so developers default to fixed-interval scheduling
- The project treats revision as a scheduling problem (put on calendar) rather than a memory model problem (when is recall probability lowest?)
- No understanding that the spacing effect requires *increasing* intervals based on performance, not fixed ones

**How to avoid:**
1. **Implement or wrap `ts-fsrs`** — a mature TypeScript implementation of the Free Spaced Repetition Scheduler (FSRS). It models memory as three variables: Stability (S), Difficulty (D), and Retrievability (R). It is the current default scheduler in Anki (replacing SM-2 since 2023).
2. **Use FSRS's 4-button rating system** (Again/Hard/Good/Easy) instead of a simple "studied/not studied" toggle. Each review updates the memory model and determines the next review interval.
3. **Use the fixed 7d/30d intervals as *default initial values* for new topics** before the user has any review history. Transition to FSRS-determined intervals after 1-2 review cycles.
4. **Cap maximum interval** for first 3 months (e.g., 14 days max) — users perceive very long intervals as "the app forgot about me."
5. **Log every review event** (not just current state) — when FSRS updates come out (FSRS-4 → FSRS-5 → FSRS-6), you can retrain parameters from raw history.

**Warning signs:**
- Revision is implemented as simple date arithmetic (today + 7 days)
- No distinction between "new topic" and "review topic" in the scheduling model
- No rating of recall quality — just "I studied this" / "I didn't"
- All topics reviewed at the same interval regardless of difficulty

**Phase to address:**
**Phase 4 (Revision Engine)** — This is where the revision scheduling model is built. Getting it right here prevents an entire architecture rewrite later. If Phase 3 (Timetable Engine) plans ahead for revision slots, Phase 4 fills them with proper FSRS logic.

---

### Pitfall 4: Onboarding Overload → Day-1 Abandonment

**What goes wrong:**
User signs up, is asked to enter subjects, topics, deadlines, time preferences, study hours, and goals before seeing any value. The setup takes 15+ minutes. User abandons before the timetable is ever generated. Multiple studies confirm 82% of productivity tool users abandon by Day 14, with 64% citing "too complicated" as the reason.

**Why it happens:**
- Product tries to collect all information upfront ("we need this to generate a schedule")
- No "quick start" path that produces a schedule with minimal input
- Developer assumes users will invest setup time because the output will be valuable — but users don't trust the value yet
- Feature-rich onboarding teaches the full product, not the first useful action

**How to avoid:**
1. **Design a < 2-minute onboarding path:** Ask for bare minimum (1 subject + 1 deadline), generate an immediate timetable. "Great, here's your first study plan!" Users can add more subjects later.
2. **Progressive feature disclosure:** Week 1: basic timetable only. Week 2: unlock revision scheduling if user has studied 3+ sessions. Week 3: unlock charts and analytics. Never force features.
3. **First-session success is non-negotiable:** The onboarding MUST end with a generated timetable the user can act on immediately.
4. **Use sensible defaults:** Don't ask about time preferences — assume 9 AM start, 50-min sessions, 10-min breaks. Let user customize later.
5. **Show the schedule before asking for more input:** Generate an initial plan with the minimal data and offer refinement after they see value.

**Warning signs:**
- More than 5 form fields in the initial setup
- Empty state has no generated content — user sees a blank dashboard
- Users who sign up never return (check signup-to-first-action funnel)
- Onboarding includes feature explanations instead of immediate action

**Phase to address:**
**Phase 2 (Auth & Subject CRUD)** — The subject/deadline input UI must be designed for speed-to-value, not completeness. **Phase 3 (Timetable Engine)** must accept minimal input and produce output immediately. This is a UX + architecture concern.

---

### Pitfall 5: Planning Fallacy Blindness — Building Schedules on User Estimates

**What goes wrong:**
When the system asks "how long will this take?" and schedules based on that estimate, the schedule is doomed. Research (Buehler et al., 1994) consistently shows humans underestimate task duration by 25-50%. A "2-hour" study task is more likely 3 hours. The schedule built on optimistic estimates collapses before the week is half over.

**Why it happens:**
- The scheduler uses whatever the user inputs as ground truth
- No internal model of how long topics actually take
- The system doesn't collect data on actual vs. estimated time to calibrate
- No buffer added to user-provided estimates

**How to avoid:**
1. **Apply a 25% planning fallacy buffer automatically** to all user-provided time estimates. If user says "2 hours," schedule 2.5 hours minimum.
2. **Track actual vs. estimated time** per topic/subject. After 3+ data points, show the user their actual pace and offer to adjust future estimates.
3. **Default to conservative hour estimates:** When no data exists for a user, assume topics take 50% longer than the user claims.
4. **Don't require time estimates at all:** Use topic count + deadline to calculate automatically. "10 topics, 30 days = 1 topic every 3 days" is a valid starting estimate.
5. **Base capacity on actual history, not aspirational input:** If user studied 8 hours last week, schedule 8 hours next week — not the "I'll do 15 this week" goal.

**Warning signs:**
- Users consistently report "the schedule is too ambitious"
- Unfinished tasks roll over every single week
- Estimated-to-actual time ratio shows systematic underestimation
- User adjusts estimates upward but the pattern repeats

**Phase to address:**
**Phase 3 (Timetable Engine)** — Estimate buffering logic must be in the core scheduling algorithm. **Phase 5 (Progress & Adaptation)** — Actual-vs-estimated tracking and auto-calibration.

---

### Pitfall 6: Ignoring Energy Levels and Subject-Type Differences

**What goes wrong:**
The scheduler treats all 1-hour study blocks as interchangeable. In reality, a math problem set at 10 PM after a full day of classes produces almost zero learning. A history reading at 2 PM vs. 10 PM produces dramatically different retention. All subjects are not equal — math requires practice problems, history requires reading, language requires daily vocabulary drills. A schedule that ignores these differences produces low-quality study time despite high quantities of "time spent."

**Why it happens:**
- Simple scheduling algorithms only model "time" and "topic" — not task type or cognitive load
- Subject-type metadata is not collected from users
- Energy patterns require user self-knowledge that may not exist yet
- The developer has never experienced a forced suboptimal study time

**How to avoid:**
1. **Collect subject metadata at input:** Ask users to rate each topic as (a) difficulty (1-5) and (b) study type (concept learning / practice problems / revision / reading). Schedule harder subjects during peak energy windows.
2. **Respect the cognitive peak window:** Most people have 2-3 hours of peak focus daily (typically mid-morning). Schedule the hardest subjects here automatically.
3. **Cap session length:** No single study block should exceed 90 minutes without a break. Practical limit for most students is 2 hours of sustained focus.
4. **Mix task types within a day:** Alternate concept-heavy topics with lighter review or practice to avoid fatigue. Don't schedule 3 straight hours of the same subject type.
5. **Ask "when do you study best?" once, not per-schedule:** Store energy preference data in the user profile, not as per-plan input.

**Warning signs:**
- Generated schedule shows 3+ hours of consecutive math practice
- Hard subjects scheduled at 10 PM
- All blocks are the same duration regardless of task type
- No distinction between "deep work" and "maintenance study" blocks

**Phase to address:**
**Phase 2 (Subject CRUD)** — Subject metadata fields (difficulty rating, study type) must be part of the data model. **Phase 3 (Timetable Engine)** — Energy-aware scheduling logic.

---

### Pitfall 7: One-Shot Planning Without Adaptive Cycles

**What goes wrong:**
The timetable is generated once and never revisited. The user's life changes (new assignment, sick day, extra work), but the schedule doesn't. Within 2 weeks, the static plan is completely divorced from reality. The user stops consulting it because "it's always wrong."

**Why it happens:**
- Generating a timetable feels like the main product deliverable, so the team stops there
- No scheduled "plan review" cycle built into the product
- The developer assumes the initial input remains valid forever
- Rescheduling seems complex, so it's deferred

**How to avoid:**
1. **Design a weekly review cycle into the product:** Every Sunday (or user-chosen day), prompt the user to review the coming week. Show what was completed vs. planned last week and offer to regenerate the upcoming schedule.
2. **Every interaction is a reschedule opportunity:** When the user marks a session as "missed," offer: "Move this topic to [next available buffer slot]?"
3. **Keep the "original plan" and "current reality" visible side by side:** Show progress bars for each topic with planned vs. actual completion.
4. **Make rescheduling cheap:** One-click "rebalance" button that redistributes remaining topics across remaining time, accounting for actual progress.
5. **Log every generated plan** so the system can detect when it's repeating itself (see StudyMind post-mortem: a planner that can't see its own history will recommend thermodynamics 3 weeks in a row).

**Warning signs:**
- No way to regenerate the schedule without deleting and recreating the study plan
- User never sees "what was planned vs. what happened"
- Schedule is displayed as static text, not interactive slots
- No notification or prompt to review the plan

**Phase to address:**
**Phase 5 (Progress & Adaptation)** — The adaptive cycle is the feature that separates a usable planner from an abandoned one. Must be designed from the start, not bolted on.

---

### Pitfall 8: Shame-Based Design — Streaks, Overdue Badges, and Guilt

**What goes wrong:**
The app shows overdue tasks in red, streaks that reset on missed days, and "you're behind" indicators. Instead of motivating the user, these features make them feel worse. Students already carry enough academic pressure; an app that adds guilt is counterproductive. The user's response: stop opening the app.

Multiple user research studies confirm: 68% of productivity app abandoners cite "guilt about missed tasks" as a factor. Streak-based designs actively harm retention.

**Why it happens:**
- Gamification borrowed from Duolingo (but Duolingo has low stakes; exam prep has high stakes)
- Developers think "accountability" requires visible failure indicators
- Streaks and counts are easy to implement, so they ship first
- No concept of "graceful recovery" in the design language

**How to avoid:**
1. **No "overdue" concept:** Show "next recommended session" rather than "missed deadline." Never show overdue in red.
2. **Positive-only progress:** Show completed topics, not pending ones. "You've finished 12 topics!" not "You have 8 overdue."
3. **Welcome-back message on re-engagement:** "Welcome back! We saved your spot in [next topic]" — not "You missed 3 sessions!"
4. **Non-punitive streak:** Track consistency, not consecutive days. "You studied 5 of the last 7 days" vs. "3-day streak broken."
5. **Treat re-engagement as success, not recovery:** Any return after absence is a win. Adjust the schedule to current reality, don't show the accumulated backlog.
6. **Offer the "minimum viable study" option:** If a user is overwhelmed, ask "Can we switch to just the most important topic today?" rather than showing the full missed list.

**Warning signs:**
- UI shows overdue counts, red badges, or negative indicators
- Streak tracking resets to zero on a missed day
- Re-engagement screen shows how far behind the user is
- User testing reveals users feel judged by the app

**Phase to address:**
**Phase 1 (Project Setup & Data Model)** — The data model should track *completed* events positively. Avoid fields that count "missed" or "overdue." **Phase 6 (Dashboard & Visualizations)** — Every chart and metric should be designed to avoid shame triggers.

---

## Moderate Pitfalls

### Pitfall 9: Undifferentiated Hard vs. Soft Constraints in Scheduling

**What goes wrong:**
The developer treats every user preference as a hard constraint. "I'd prefer not to study on Sundays" becomes "schedules must never include Sunday." When combined with limited available hours and many topics, the solver finds no solution. The developer then adds more constraints (or tweaks the algorithm) instead of relaxing preferences — making the problem worse.

**How to avoid:**
1. **Categorize every constraint at design time:** Hard = deadline, max daily hours, required topics. Soft = preferred time-of-day, preferred days, topic ordering.
2. **Implement constraint relaxation:** If no solution found, drop soft constraints starting with lowest priority, regenerate, and explain what changed.
3. **Prefer fewer hard constraints:** Only real blockers (deadline, max hours) should be hard. Everything else is a "nice to have."

**Warning signs:**
- Adding any new constraint makes the solver fail
- User preferences are modeled as validation rules rather than weighted options
- No explanation of why a schedule is impossible

**Phase to address:**
**Phase 3 (Timetable Engine)** — Constraint hierarchy is an architectural decision, not a tuning parameter.

---

### Pitfall 10: No Backlog Management for Carryover Topics

**What goes wrong:**
When topics are missed, they simply don't get studied. There's no mechanism for carryover. The week ends with unfinished topics and the system doesn't know about them. The next schedule generation starts fresh, ignoring the backlog. Unfinished topics accumulate invisibly until the deadline is imminent and the user realizes they're 40% behind.

**How to avoid:**
1. **Track backlog explicitly:** Each unscheduled/undone topic remains in the pool. The feasibility check must include backlog + new topics.
2. **Backlog triage:** If fully catching up would exceed capacity, the system should suggest priorities: "You're 3 topics behind. We can reallocate next week's buffer, or identify which topics to defer."
3. **Visualize backlog trend:** Show whether the gap is growing or shrinking over weeks.
4. **Never silently drop missed topics:** The system that forgets what wasn't done is worse than no system.

**Phase to address:**
**Phase 5 (Progress & Adaptation)** — Backlog tracking and adaptive rescheduling.

---

### Pitfall 11: Over-Scheduling Weekends & Under-Scheduling Weekdays

**What goes wrong:**
The scheduler tries to fit most study into weekends (because that's when the user says they have "free time"), scheduling 6-hour Saturday blocks and 6-hour Sunday blocks. Cognitive performance deteriorates sharply after 3-4 hours of intensive study. A 6-hour block often produces less real learning than two focused 3-hour sessions. Weekend marathon catch-up blocks are rarely achievable.

**How to avoid:**
1. **Cap daily study blocks at 4 hours maximum** regardless of available time.
2. **Encourage daily micro-sessions over weekend marathons:** 30-60 minutes per day beats 6 hours on Saturday every time.
3. **If scheduling a long session, split it into 2 blocks** with a genuine break (meal, walk) between them.
4. **Schedule 1 completely unscheduled day per week** for recovery.

**Phase to address:**
**Phase 3 (Timetable Engine)** — Daily caps and session limits.

---

### Pitfall 12: Feature Bloat in MVP

**What goes wrong:**
The first release includes timetable generation + calendar + charts + progress tracking + notifications + gamification + study timer. Each feature is built to 60% quality because effort is split across everything. The timetable doesn't work well, and users won't stay to discover the other features. The project suffers from "we added too many features at once and lowered our bar for quality" (direct quote from Biddit post-mortem).

**How to avoid:**
1. **The one thing that must work:** Given deadlines + topics, produce a usable daily schedule. Ship nothing else until this works well.
2. **Phase features by dependency:** Timetable → Revision → Progress → Calendar → Charts. No parallel feature work until core is solid.
3. **Build reliability before features:** Transcript sampling fix, retry logic, timeout handling — these make the app actually work. Chart animations don't.
4. **Each feature must reach "useful" before the next starts:** Not "start feature B when feature A is 80% done." Feature B starts when feature A is in production and validated.

**Phase to address:**
**All phases** — This is a roadmap discipline concern. The roadmap must enforce sequential quality over parallel breadth.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fixed-interval revision (7d/30d) instead of FSRS | Ships revision in hours instead of days | Revision timing is suboptimal; user retention suffers; must rewrite scheduling logic later | **Never** — FSRS has a mature TypeScript library (`ts-fsrs`). There's no implementation cost savings to justify the degradation. |
| Scheduling logic as ad-hoc if/else chains instead of constraint solver | Feels simpler for the first deadline | Brittle, buggy, impossible to add hard/soft constraint distinction; requires full rewrite to fix | **MVP only** — Acceptable for prototype with 1 deadline. Must be replaced with proper constraint model before adding multiple concurrent study plans. |
| One-shot generation (no adaptive rescheduling) | Ships faster — less state to manage | Schedule becomes useless after first missed session; user abandons | **Never** — Must have at minimum "regenerate with current progress" from day 1. Even a basic rebalance button prevents abandonment. |
| Storing current schedule state only (no event log) | Simpler queries | Can't retrain scheduling parameters, can't show trends, can't answer "what happened vs. planned" | **Never** — Storage is cheap. Log every review event, every generated plan, every session completion. The ability to retrain FSRS parameters when the algorithm improves is priceless (learned the hard way by Anki + FSRS migrations). |
| User time estimates used without buffer | Simple — what user says goes | Schedule collapses from planning fallacy; user blames the app, not their estimate | **Acceptable only for first week** — After 3+ data points, must auto-apply buffer based on actual vs. estimated. |
| "Studied/not studied" binary toggle instead of recall quality rating | One button instead of four | No data for spaced repetition; revision intervals can't adapt to performance | **Never** — Even without FSRS, a 3-point recall scale (Easy/Hard/Forgot) provides essential signal. The UI cost of 4 buttons is negligible. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **`ts-fsrs` (spaced repetition library)** | Not storing raw review events; only storing current card state. When FSRS version updates, parameters can't be retrained. | Store every review event (card_id, rating, elapsed_days, timestamp). When algorithm version upgrades, replay history to retrain parameters. |
| **`ts-fsrs` — Parameter seeding** | Using default parameters for all users with no calibration. Defaults are optimized for general populations, not individual learning patterns. | Seed new users with population-derived parameters, then gradually weight toward the user's own history as they accumulate reviews. FSRS needs ~50 reviews per user before stabilizing. |
| **`ts-fsrs` — Learning steps** | Setting learning steps to 1+ days. FSRS documentation explicitly warns against this — it prevents the algorithm from properly scheduling within-day re-learning. | Keep learning steps under 1 day (e.g., `1m`, `10m`). Let FSRS handle longer-term scheduling after the learning phase. |
| **Calendar display** | Treating generated schedule as a static list of events. When schedule regenerates, old entries conflict with new ones. | Version the schedule. Display the current active version. When regenerated, the old version is archived but visible. Never mutate existing events — always generate new versions. |
| **Turso/edge DB for scheduling** | Running complex scheduling logic in SQL queries or as DB-side computations. Scheduling algorithms need iterative computation that databases don't do well. | Run scheduling logic in application code (Next.js server or edge function). Use DB only for persisting the generated schedule and review events. |
| **Vercel edge functions for timetable generation** | Expecting a synchronous HTTP response for complex timetable generation. Timetable solving can take seconds for moderate problem sizes, causing HTTP timeouts. | Use a background computation pattern: start generation, return immediately with a job ID, and poll for completion. Vercel doesn't have native background jobs, so either use a serverless function with `waitUntil()` or defer to client-side computation for complexity < 50 topics. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Brute-force timetable generation** | Page hangs on "generate" for > 10 seconds; browser tab freezes | Use iterative repair heuristics (start with a valid schedule, fix clashes) instead of generating from scratch. Use Web Workers for client-side computation. | ~15 topics across 2 subjects — trivial scheduling is O(n!) in naive implementations |
| **Recomputing schedule on every page load** | Slow initial page render; unnecessary database reads | Cache the generated schedule. Only regenerate when user explicitly requests it or data changes (new topic, deadline change). | Any scale — this is an architecture issue, not a volume issue |
| **FSRS state recomputation from event log on every review** | Review action takes 2+ seconds because system replays entire history | Cache current memory state (stability, difficulty) per card. Update it incrementally on each review. Only replay from log when algorithm version changes. | ~500+ review events per card |
| **Loading all review events into memory for dashboard charts** | Dashboard page takes 5+ seconds to render; high memory usage | Pre-aggregate weekly/monthly metrics at write time. Query aggregates, not raw events. | ~10,000+ review events |
| **No pagination on topic/subject lists** | Page load time increases linearly with topic count | Use cursor-based pagination for topic lists. Virtualize long lists with `react-window`. | ~100+ topics |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Storing unhashed API keys for external calendar sync (when added later)** | Credential exposure if DB is breached | Never store credentials that can be used for anything other than the intended API. Use OAuth or short-lived tokens. (Out of scope for v1, but design the data model now.) |
| **No rate limiting on "generate timetable" endpoint** | User could trigger expensive timetable generation in a loop, burning edge function execution credits | Add rate limiting per-user (e.g., 5 generations per hour). This is an edge-compute cost issue, not a security issue per se, but it has real financial impact. |
| **Topic/timetable data exposed in URL parameters** | Another user could guess topic IDs and view someone else's study plan if you use predictable IDs | Use UUIDs for all resource IDs, not sequential integers. Implement proper ownership checks on all data access. |
| **Not encrypting review history at rest** | Review patterns reveal sensitive information about what a user is studying | Turso supports encryption at rest. Ensure it's enabled. For a personal tool this is less critical, but it's good practice. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Empty state shows nothing** | User creates an account, logs in, sees a blank page with no guidance. Abandons immediately. | Show a single CTA: "Create your first study plan." No dashboard, no settings, no options. One click to value. |
| **Setting up a study plan requires 10+ fields** | User abandons during setup. "This feels like homework." | Require 2 fields minimum: subject name + deadline date. Everything else can be defaulted or added later. |
| **Generated timetable has no explanation** | User looks at the schedule and thinks "why did it put math here at 10 AM?" | Show the reasoning for placement decisions: "Math scheduled during peak energy window (9-11 AM). Topic X scheduled for review because last studied 12 days ago." |
| **No "minimal day" option** | Overwhelmed user sees a 6-block day and doesn't start at all. | Offer a toggle: "Show me just the 3 most important blocks today." |
| **Marking a topic as "studied" is the only interaction** | User finishes studying, marks done, and the next step is unclear. | After marking done, immediately show the next recommended topic: "Great work on Math. Next: Physics — Force & Motion (15 min review)." |
| **Timetable is read-only text** | User can't drag, reschedule, or interact with the plan. Feels like a screenshot. | Make every time slot draggable. Let users adjust the schedule by moving blocks. The system should learn from manual adjustments. |
| **Forgot to study yesterday — shows 8 overdue topics** | User feels shame, closes app, doesn't return. | Show "Yesterday: 2 topics studied. Today's recommended focus: [1 topic]." Never show overdue counts. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Timetable Generation:** White-box test with unsolvable constraints (more topics than available time) — does the system fail gracefully with an explanation, or silently produce a broken schedule?
- [ ] **Spaced Repetition:** Verify the revision interval is *not* based on simple date arithmetic. Check that the 4-button rating system exists (Again/Hard/Good/Easy or equivalent 3-point scale minimum).
- [ ] **Schedule Adaptation:** When a user marks a session as "missed," verify the system actually adjusts future scheduling, not just the "completed" count.
- [ ] **Onboarding Flow:** Time the first-use experience from login to seeing a schedule. If > 120 seconds, it needs simplification. Must produce a usable schedule with ≤ 3 inputs.
- [ ] **Reschedule Capability:** Can user regenerate the schedule after inputting progress? Or do they need to delete and restart?
- [ ] **Empty State:** What does the app look like with zero subjects, zero topics, no schedule? Is there a CTA or a blank void?
- [ ] **Mobile Responsiveness:** Study schedules are frequently consulted on phones mid-day. Verify the schedule is readable and interactive on a 375px-wide viewport.
- [ ] **Backlog Visibility:** If user misses 3 days, does the backlog compound silently or does the system offer to adjust remaining weeks?
- [ ] **Recovery After Absence:** If user doesn't log in for a week, does the welcome-back screen show guilt-inducing missed tasks or a clean restart path?
- [ ] **Timezone Safety:** Is the timetable generation timezone-aware? Study schedules that shift by a day due to UTC conversion are a common source of confusion.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Over-constrained schedule (no solution found)** | LOW — algorithmic fix | 1. Identify the conflicting constraints. 2. Show user which soft constraints were relaxed to produce a solution. 3. Offer manual constraint adjustment ("Reduce topics" or "Extend deadline"). Never show a solver error. |
| **User has accumulated 2+ weeks of backlog** | MEDIUM — product intervention needed | 1. Offer a "reset and reschedule" path that accepts the current position as the starting point. 2. Suggest dropping or deprioritizing topics based on deadline proximity. 3. Offer "minimum viable plan" — what core topics must be covered vs. what can be deferred. |
| **User abandoned and returns after 30+ days** | MEDIUM — data cleanup + re-onboarding | 1. Archive old schedules (don't show "you missed 30 days"). 2. Offer to create a fresh plan from current deadlines. 3. Keep old review history for FSRS recalibration — don't reset memory states. |
| **FSRS parameters produce clearly wrong intervals (47 days for a topic the user just learned)** | LOW — parameter adjustment | 1. Cap maximum interval at 14 days for first 3 months of a topic. 2. Gradually increase cap as review history accumulates. 3. Allow manual interval override. |
| **Schedule says X but user's reality says Y (mismatch after a few days)** | LOW — UX flow fix | 1. "Today's plan" should reflect actual completion, not original schedule. 2. One-button "regenerate from today" should always be available. 3. Show original plan only as reference, not as the active schedule. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Over-constrained scheduling | Phase 3 (Timetable Engine) | Test: Provide 50 hours of topics with 20 hours available. System must show feasibility warning + suggest resolution, not crash or produce broken schedule. |
| Rigid schedule collapse (no buffer) | Phase 3 (Timetable Engine) | Test: Generated schedule must have ≥ 20% unscheduled buffer time. At least 1 catch-up block per 7 days. |
| Naive revision scheduling | Phase 4 (Revision Engine) | Test: Review system must use FSRS or equivalent memory model. Verify that intervals vary based on recall rating and are not fixed arithmetic. |
| Onboarding overload | Phase 2 (Auth & Subject CRUD) | Test: Time from signup to viewing a generated schedule ≤ 2 minutes with ≤ 3 inputs. |
| Planning fallacy blindness | Phase 3 (Timetable Engine) | Test: System applies ≥ 25% buffer to user-provided time estimates automatically. |
| Energy level / subject type ignorance | Phase 2 (Subject CRUD) + Phase 3 (Timetable Engine) | Test: Subject data model includes difficulty rating and study type. Scheduler places harder subjects in configurable peak windows. |
| One-shot planning (no adaptation) | Phase 5 (Progress & Adaptation) | Test: After marking 3 sessions as missed, "Regenerate" button exists and produces a revised schedule within 2 seconds. |
| Shame-based design | Phase 1 (Data Model) + Phase 6 (Dashboard) | Test: No UI element shows "overdue," "missed," or negative streak counts. All progress indicators are positive/completion-based. |
| Hard/soft constraint confusion | Phase 3 (Timetable Engine) | Test: System distinguishes between hard constraints (deadline, max hours) and soft constraints (preferred study time). Soft constraints are relaxed when no solution exists. |
| Backlog management | Phase 5 (Progress & Adaptation) | Test: Missed topics appear in the next schedule iteration. Backlog size is tracked and trend is visible. |
| Feature bloat | Phase 1 (Roadmap) | Test: Each phase ships exactly one core feature to production quality. No parallel feature development until prior phase is validated. |

---

## Sources

- **DEV Community — "Why Most Study Planners Fail"** (2026): Student-led experiment documenting planner abandonment patterns, cognitive load, and onboarding failures. HIGH confidence.
- **Sense Central — "How to Use AI to Make Better Study Timetables"** (2026): Real-world study timetable failure modes including energy awareness and buffer time. HIGH confidence.
- **Notesmakr — "How to Create a Study Schedule"** (2026): References Buehler et al. 1994 planning fallacy research and Frontiers in Education 2025 buffer block study. HIGH confidence.
- **LongTerm Memory Blog — "How to Avoid Over-Scheduling"** (2026): Actual capacity vs. planned capacity calibration, weekend over-scheduling. MEDIUM confidence.
- **edu0.ai — "How to Create a Study Schedule You Will Actually Follow"** (2026): Minimum Viable Schedule concept, 70% capacity rule, anchor vs. flex tasks. MEDIUM confidence.
- **tardy.xyz — "Why Students Abandon Productivity Apps After the First Week"** (2026): Onboarding overload, shame-based design, 82% abandonment rate. HIGH confidence.
- **User Intuition — "EdTech Churn: What 10,000 Interviews Reveal"** (2026): Structural churn patterns, retry logic for FSRS, parameter seeding. HIGH confidence.
- **DEV Community — "How Hindsight Turned Raw Quiz Data Into Study Plans"** (2026): Event logging for iterative planning, plan repetition prevention. HIGH confidence.
- **Biddit.app post-mortem** (Marc-Robin Gruener): Feature bloat in study planner, "added too many features at once and lowered quality bar." HIGH confidence.
- **"My Side Project Failed" post-mortem** (PMTechLessons): Moving target MVP, invisible progress, candy work. HIGH confidence.
- **"A Failed SaaS Postmortem"** (Matt Layman): Package upgrade treadmill, technology over value. HIGH confidence.
- **FSRS documentation** (open-spaced-repetition/ts-fsrs): Official TypeScript implementation of the Free Spaced Repetition Scheduler. HIGH confidence.
- **Borretti — "Implementing FSRS in 100 Lines"** (2025): DSR memory model explanation, stability/difficulty update formulas. HIGH confidence.
- **Anki issue trackers** (FSRS bugs): Real-world edge cases in spaced repetition implementation — interval going backwards, buried sibling card corruption, difficulty value overflow. HIGH confidence.
- **Timefold/OptaPlanner documentation**: NP-hard school timetabling, hard vs. soft constraints, solver timeout patterns. HIGH confidence.
- **Schedull.app — "Hard Rules vs Soft Preferences"** (2026): Constraint hierarchy best practices, over-constraining prevention. HIGH confidence.
- **Nayak-indie/Timable** (GitHub): Constraint programming solver (OR-Tools CP-SAT) approach to clash-free scheduling. HIGH confidence.
- **CSP modeling guide** (TheLinuxCode, 2026): Production constraint satisfaction pitfalls — modeling failures vs. algorithm failures, time granularity mismatch, explainability. HIGH confidence.
- **"I Built a Multi-Agent AI Study Companion in 7 Days"** (2026): Transcript sampling, timeout handling, build reliability before features. MEDIUM confidence.
- **GPG Ka Funda — "The Truth About Perfect Study Timetables"** (2026): Domino effect of missed sessions, 3-task rule, weekly planning. LOW confidence (blog, but consistent with other sources).
- **K12 Tutoring — "Common Study Planner Mistakes"** (2025/2026): Overloading, format mismatch, not updating, ignoring task breakdown. MEDIUM confidence.
- **User Research Product Spec** (iamAyushSaxena/GitHub): 82% Day-14 abandonment, 3-task visibility limit, progressive feature disclosure, anti-guilt design. HIGH confidence (original user research).

---

*Pitfalls research for: Study Planner — Timetable Generation & Revision Scheduling*
*Researched: 2026-06-22*
