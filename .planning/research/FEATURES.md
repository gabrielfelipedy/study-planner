# Feature Research

**Domain:** Personal study planner with automatic timetable generation and revision scheduling
**Researched:** 2026-06-22
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User account with email/password auth | Data must persist across sessions. Every competitor (MyStudyLife, Revu, YPT) requires accounts. Without auth, user loses all plans. | MEDIUM | Next.js Auth.js or Lucia. Single-user personal tool but auth required for data safety. |
| Subject/topic management (CRUD) | Core data model — user must organize what they study under subjects with topics. MyStudyLife, Anki, Revu all have this at minimum. | LOW | Basic form inputs. Subjects group topics. Topics have name, optional description. |
| Deadline / exam date setting | Without a target date, there's no schedule to generate. This is the primary input trigger for the timetable algorithm. | LOW | Single date picker per study plan. |
| Calendar view of scheduled items | Users need to see "what am I studying today?" at a glance. MyStudyLife, Revu, Study-Track all have weekly/daily calendar as primary view. | MEDIUM | Needs weekly view as default, with ability to see day and month. React calendar libraries exist (cal.com, react-big-calendar). |
| Mark topics as studied / complete | Core feedback loop — user completes a session, marks progress, app tracks what's done. Required for progress % calculation. | LOW | Toggle/checkbox per topic. Store timestamp of completion. |
| Progress tracking (% complete) | Users need to know "how am I doing?" — topics completed vs planned. Every study app has some form of progress indicator. | MEDIUM | Derived data: completed_topics / total_topics. Needs summary query. |
| Notifications / reminders | Users forget to study. Revu, MyStudyLife, YPT all send push/email reminders for scheduled sessions. Without this, users abandon plans. | MEDIUM | Browser push notifications via Service Workers. Email reminders via Resend (simple with Next.js). |
| Study session logging (what I studied + when) | Users want to see history of what they actually did. YPT and Study Bunny center on time tracking per subject. | LOW | Timestamped log entries tied to topic + user. Simple INSERT on session end. |
| Data persists between sessions | If data resets on refresh, the app is unusable. Turso DB handles this, but the UX expectation is table stakes. | LOW | Turso handles this inherently. |
| Responsive web interface | Students use phones and laptops interchangeably. MyStudyLife, Study-Track all render well on mobile. | MEDIUM | Tailwind responsive design. Focus on mobile-first since students check on phones. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Automatic timetable generation** (topics → evenly distributed schedule before deadline) | **Core value prop.** No other app in this space does this well. MyStudyLife requires manual scheduling. Shovel does this for classes (not study topics). User input topics + deadline, app outputs "study Topic A on Mon, Topic B on Tue." | HIGH | Algorithm: divide topics by days until deadline, distribute evenly, account for revisions. This is the hardest technical work and the primary differentiator. Must work correctly first time. |
| **Automatic revision scheduling** (7d and 30d intervals after completion) | No manual spaced repetition setup. After marking "studied," revision appears automatically on +7 and +30 days. Revu does this but requires flashcard-like interaction. This app does it at the topic level without flashcards. | MEDIUM | Calculate recurrence dates on completion. Insert revision sessions into schedule. Simple interval logic but must handle edge cases (completing late, multiple revisions colliding). |
| **Available time input** (user defines hours per day) | Schedules generated are realistic. Most apps assume unlimited availability. Letting users say "I can study 2 hours on weekdays, 1 hour on weekends" makes the plan actually followable. | MEDIUM | Store weekly availability slots. Algorithm respects these when distributing topics. Need to weight topic count vs available time. |
| **Adaptive rescheduling** (if user falls behind, replan remaining topics) | Life happens. If user skips 3 days, the schedule should compress remaining topics before the deadline rather than showing an impossible plan. | HIGH | On next login or manual "replan" action, re-run timetable algorithm on remaining uncompleted topics with remaining days. Must not reset completed topics. Complex edge cases. |
| **Progress visualization with charts** | Charts > numbers for motivation. Study-Track and YPT use color depth, streak calendars, weekly comparison charts. Seeing a visual of progress is motivating. | MEDIUM | Need a chart library (recharts, nivo, chart.js). Show: completion over time, topics by subject, weekly study hours vs planned, revision adherence. |
| **Focus / Pomodoro timer integrated with study session** | MyStudyLife, Study Bunny, YPT all have built-in timers that automatically log study time. "Start studying" → timer runs → "Stop" → session logged. Removes friction of separate time tracking. | MEDIUM | Pomodoro timer UI (25min work / 5min break). On completion, auto-create study session log for current topic. Use browser Notification API for break alerts. |
| **Streak tracking** | Forest, Study Bunny, YPT all gamify consistency. "7-day streak" is a powerful engagement driver. | LOW | Track consecutive days with at least one study session logged. Simple date-math query. |
| **Single-page simplicity** | Most study planners (MyStudyLife, Notion templates) are complex with many screens. A minimal, focused app — input topics, see calendar, mark done — reduces abandonment. | MEDIUM | Deliberate design choice: limit navigation to 3-4 views. No feature creep. This is a competitive advantage against bloated competitors. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Flashcard creation / spaced repetition quiz system | "All study apps have flashcards." Users equate studying with flashcards because of Anki/Quizlet dominance. | Flashcards are a massive feature — card creation, review algorithms, media support. Entire apps (Anki, 15+ years) exist for this. Adding flashcards dilutes focus from scheduling. Competes in a different category. | Auto-schedule topic-level revisions (7d/30d) instead. User reviews their own notes — app just tells them when. |
| File import (PDF, CSV, DOCX) | "I already have my notes/syllabus, I want to import." Reduces manual data entry friction. | File parsing is a support nightmare. Each format has edge cases. PDF parsing is unreliable. Every import failure creates a negative experience for a feature that's not core. | Manual input only for v1. Simple copy-paste from syllabus works fine. File import after validation if users demand it. |
| External calendar sync (Google Calendar, Apple Calendar, Outlook) | "I want my study plan in my main calendar." Users don't want another calendar app. | OAuth for each provider, webhook/subscription maintenance, dealing with provider API changes. Huge integration surface for a personal tool. | In-app calendar for v1. iCal export (single .ics file download) is a medium-effort compromise that works with any calendar app. |
| Multi-user / study groups / shared plans | "Let me study with friends." Social features increase engagement. | Multi-user adds: real-time sync, permissions, conflict resolution, moderation. This is a personal study tool — opening to groups triples scope. | Keep single-user. Add basic sharing (read-only plan link) after validation if users request it. |
| AI-powered question generation / quiz creation | "AI makes studying faster." Trendy 2026 feature. | Building reliable quiz generation is a full product (GPT wrapper + validation). Users expect quality questions that match their material — generic AI questions are often wrong or useless. | Static topic-level revision reminders. The app tells you WHEN to review; your own notes/materials are the content. |
| Full note-taking / document storage | "I want to keep my notes and study plan together." | Then use Notion. Turning a scheduler into a notes app creates infinite scope. Notes require rich text editors, file storage, search, organization. Competing with Notion/Obsidian/OneNote is losing. | The app is a scheduler + tracker. Notes stay in the user's tool of choice. Link out if needed. |
| Over-customization (custom themes, layouts, advanced scheduling rules) | Users want the app to look/feel like their preferences. | Each option adds UI surface area, testing burden, and bugs. MyStudyLife's complexity is a common complaint. | Limit to light/dark mode and maybe 2-3 color accents. Focus on the schedule being correct, not infinitely customizable. |

## Feature Dependencies

```
User Account
    └──requires──> Auth System (email/password, session management)

Subject/Topic Management
    └──requires──> User Account (data ownership)

Study Plan (deadline + subject selection)
    └──requires──> Subject/Topic Management (what to study)

Automatic Timetable Generation
    └──requires──> Study Plan (deadline + topics)
    └──requires──> Available Time Input (user's weekly hours)
                        └──requires──> User Account (store preferences)

Calendar View
    └──requires──> Automatic Timetable Generation (schedule to display)

Mark Topic as Studied
    └──requires──> Automatic Timetable Generation (topics exist in schedule)

Revision Scheduling (7d/30d)
    └──requires──> Mark Topic as Studied (completion timestamp)

Progress Tracking
    └──requires──> Mark Topic as Studied (completion data)

Adaptive Rescheduling
    └──requires──> Automatic Timetable Generation (re-run algorithm)
    └──requires──> Mark Topic as Studied (know what's complete)

Focus Timer / Session Logging
    └──requires──> Subject/Topic Management (associate log with topic)

Streak Tracking
    └──requires──> Study Session Logging (session timestamps)

Progress Visualization (charts)
    └──requires──> Progress Tracking (data to render)

Notifications / Reminders
    └──requires──> Automatic Timetable Generation (what to remind about)
    └──requires──> Revision Scheduling (revision review reminders)

iCal Export ──enhances──> Calendar View
```

### Dependency Notes

- **Automatic Timetable Generation requires available time input:** Without knowing the user's available hours, the algorithm can't produce a realistic schedule. Even a default assumption (e.g., "2 hours every day") needs to exist as a configurable value.
- **Adaptive Rescheduling requires Mark Topic as Studied:** The rescheduler must know which topics are completed to recalculate only the remaining ones. It must never re-schedule already-completed topics.
- **Progress Visualization depends on Progress Tracking:** They share backend queries but charts are a separate UI concern. Progress tracking (numbers/percentages) can ship without charts.
- **Notifications enhance but don't block:** The app is usable without notifications — user visits the calendar to see what's scheduled. Notifications improve retention but aren't required for core function.

## MVP Definition

### Launch With (v1)

Core value: "Input topics + deadline → usable daily schedule."

- [x] **User Account (email/password auth)** — Required for data persistence
- [x] **Subject & Topic Management (CRUD)** — Core data model
- [x] **Study Plan creation** — Choose subject, set deadline, select topics
- [x] **Automatic Timetable Generation** — Evenly distribute topics before deadline (THE differentiator — must work)
- [x] **Automatic Revision Scheduling** — 7d and 30d after marking topic studied
- [x] **Available Time Input** — User sets daily/weekly study hours
- [x] **Mark Topic as Studied** — Core feedback mechanism
- [x] **Calendar View (weekly)** — See daily schedule at a glance
- [x] **Progress Tracking (% complete)** — topics done vs planned
- [x] **Basic Session Logging** — Record when you studied what (auto-logged by timer)

### Add After Validation (v1.x)

Features to add once core is working and users are using the app.

- [ ] **Focus/Pomodoro Timer** — Trigger: users want built-in time tracking instead of manual logging (most requested feature in reviews of competitor apps)
- [ ] **Simple Charts (completion over time)** — Trigger: users have enough data for charts to be meaningful (need 2+ weeks of usage)
- [ ] **Streak Tracking** — Trigger: daily active users drop off; streaks improve retention
- [ ] **Adaptive Rescheduling** — Trigger: users report the schedule is impossible because they fell behind
- [ ] **Browser Notifications** — Trigger: users forget to check the app daily
- [ ] **iCal Export** — Trigger: "can I put this in my main calendar?" requests grow loud

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multiple concurrent study plans** — Defer because v1 is one-deadline-at-a-time. Users need to validate the core scheduling before managing multiple exams.
- [ ] **Subject-level analytics** — Defer because it requires significant data accumulation before being useful.
- [ ] **File import (CSV)** — Defer because manual input is sufficient for initial validation. If users have enough topics that manual entry hurts, add it.
- [ ] **Dark mode / theme options** — Defer because it doesn't affect core functionality. Add when polish phase begins.
- [ ] **Mobile app (native)** — Defer because responsive web serves the initial audience. Build native only if web mobile usage dominates.
- [ ] **iCal Export** — Defer to after validation. v1 has in-app calendar.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Automatic Timetable Generation | HIGH | HIGH | P1 |
| Subject/Topic Management | HIGH | LOW | P1 |
| Study Plan (deadline + topics) | HIGH | LOW | P1 |
| Mark Topic as Studied | HIGH | LOW | P1 |
| Revision Scheduling (7d/30d) | HIGH | MEDIUM | P1 |
| Calendar View | HIGH | MEDIUM | P1 |
| User Account (auth) | HIGH | MEDIUM | P1 |
| Available Time Input | HIGH | MEDIUM | P1 |
| Progress Tracking (%) | MEDIUM | MEDIUM | P1 |
| Session Logging | MEDIUM | LOW | P1 |
| Pomodoro/Focus Timer | MEDIUM | MEDIUM | P2 |
| Charts (progress viz) | MEDIUM | MEDIUM | P2 |
| Streak Tracking | MEDIUM | LOW | P2 |
| Adaptive Rescheduling | HIGH | HIGH | P2 |
| Browser Notifications | MEDIUM | MEDIUM | P2 |
| iCal Export | LOW | MEDIUM | P3 |
| Dark Mode | LOW | LOW | P3 |
| Multiple Concurrent Plans | MEDIUM | HIGH | P3 |
| File Import (CSV) | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | MyStudyLife | Revu | Anki | Study-Track | Our Approach |
|---------|-------------|------|------|-------------|-------------|
| Auth/Account | ✅ Required | ✅ Required | ✅ Optional sync | ✅ Required | ✅ Email/password with Turso |
| Subject/Topic management | ✅ Classes + tasks | ✅ Topics | ✅ Decks + cards | ✅ Subjects | ✅ Subjects group topics (simpler) |
| Auto timetable | ❌ Manual only | ❌ Manual only | ❌ Manual (SRS only) | ❌ Manual | ✅ **Auto-generate from deadline + topics** |
| Spaced repetition | ❌ | ✅ Topic intervals | ✅ Flashcard SRS | ❌ | ✅ Topic-level (7d/30d, no flashcards) |
| Calendar view | ✅ Weekly/daily | ✅ Revision calendar | ❌ (add-on) | ✅ Weekly | ✅ Weekly, responsive |
| Progress tracking | ✅ Grade tracker | ✅ Retention stats | ✅ Cards studied | ✅ Hours tracked | ✅ % topics complete + charts |
| Focus timer | ✅ Pomodoro | ❌ | ❌ | ✅ Built-in | ✅ Post-MVP Pomodoro |
| Available time input | ❌ | ❌ | ❌ | ❌ | ✅ **User sets weekly hours** |
| Adaptive reschedule | ❌ | ❌ | ❌ | ❌ | ✅ **Replan on demand** |
| Flashcards | ❌ | ❌ | ✅ Core feature | ❌ | ❌ **Deliberately not building** |
| Study groups | ❌ | ❌ | ❌ | ✅ Friend hours | ❌ Not building — personal tool |
| File import | ❌ | ❌ | ✅ .apkg | ❌ | ❌ Not building v1 |
| PDF syllabus import | ❌ | ❌ | ❌ | ❌ | ❌ Not building |
| Streak tracking | ❌ | ❌ | ✅ Heatmap | ✅ Streak | ✅ Post-MVP |
| Notifications | ✅ Push | ✅ Push | ❌ | ❌ | ✅ Post-MVP browser push |

**Key insight:** No competitor combines automatic timetable generation with topic-level revision scheduling and available time input. Every existing tool makes you schedule manually. This is the whitespace.

## Sources

- **MyStudyLife** (mystudylife.com) — App store listing and feature tour. Most popular student planner app. 24M+ users.
- **Revu** (revu.co.in) — Spaced repetition study planner app. App store and website features analyzed.
- **Study-Track** (study-track.app) — Modern study tracker with social features. Feature tour analyzed.
- **YPT / YeolPumTa** (yeolpumta.com) — Study timer app with group features. 5M+ downloads.
- **Study Bunny** — Gamified focus timer app. App store features analyzed.
- **Anki** — Gold standard spaced repetition flashcard app. Feature comparison from Reddit and review articles.
- **Shovel App** (shovelapp.io) — Smart study planner with PDF syllabus import. Landing page features analyzed.
- **Multiple roundup articles** (blaze.today, duetoday.ai, revu.co.in, planwiz.app, amberstudent.com — 2026-published) — Feature comparisons across 10-20 study planner apps each.

---
*Feature research for: personal study planner with automatic timetable generation*
*Researched: 2026-06-22*
