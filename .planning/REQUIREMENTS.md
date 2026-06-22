# Requirements: Study Planner

**Defined:** 2026-06-22
**Core Value:** Given a set of topics and a deadline, the app produces a usable daily study schedule

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can reset password via email link

### Subjects & Topics

- [ ] **SUBJ-01**: User can create subjects and organize topics under them
- [ ] **SUBJ-02**: User can set a deadline for completing a set of topics
- [ ] **SUBJ-03**: User can input available daily/weekly study time

### Timetable

- [ ] **TIME-01**: App auto-generates daily schedule distributing topics evenly before the deadline
- [ ] **TIME-02**: App auto-schedules 7d and 30d revision slots after a topic is marked as studied
- [ ] **TIME-03**: User can manually adjust the generated schedule

### Progress & Tracking

- [ ] **PROG-01**: User can mark topics as studied during sessions
- [ ] **PROG-02**: User can see overall progress percentage (topics completed vs planned)
- [ ] **PROG-03**: User can view scheduled topics on an in-app calendar
- [ ] **PROG-04**: User can view charts with progress metrics over time
- [ ] **PROG-05**: Schedule adapts based on user's actual progress vs planned

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: User receives reminders for scheduled study sessions
- **NOTF-02**: User receives alerts when revisions are due

### Timer

- **TIMR-01**: Built-in Pomodoro or focus timer integrated with study sessions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| File import (PDF/CSV) | Manual input sufficient for v1; import adds support burden |
| External calendar sync | In-app calendar only; OAuth complexity not worth it for personal tool |
| Flashcards / quizzes | Competes with Anki; dilutes focus from scheduling value prop |
| Multi-user / collaboration | Personal tool only |
| Mobile native app | Web-only; responsive design sufficient for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Pending |
| SUBJ-01 | Phase 3 | Pending |
| SUBJ-02 | Phase 3 | Pending |
| SUBJ-03 | Phase 3 | Pending |
| TIME-01 | Phase 4 | Pending |
| TIME-02 | Phase 6 | Pending |
| TIME-03 | Phase 4 | Pending |
| PROG-01 | Phase 5 | Pending |
| PROG-02 | Phase 5 | Pending |
| PROG-03 | Phase 4 | Pending |
| PROG-04 | Phase 8 | Pending |
| PROG-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-22*
*Last updated: 2026-06-22 after initial definition*
