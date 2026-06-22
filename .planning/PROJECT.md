# Study Planner

## What This Is

A personal web app that automatically creates study timetables based on deadlines. You input what you need to study (subjects, topics), set a deadline, and the app generates a schedule with even topic distribution and auto-scheduled revisions at 7-day and 30-day intervals. Tracks study sessions, shows progress (topics completed vs planned), and visualizes everything in calendar and chart views.

## Core Value

Given a set of topics and a deadline, the app produces a usable daily study schedule — that's the one thing that must work.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can sign up and log in with email/password
- [ ] User can create subjects and topics manually
- [ ] User can set a deadline for a study plan
- [ ] App automatically creates a timetable distributing topics evenly before the deadline
- [ ] App automatically schedules 7d and 30d revisions after marking a topic as studied
- [ ] User can mark topics as studied and track study sessions
- [ ] User can see progress (topics completed vs planned)
- [ ] User can view an in-app calendar with scheduled topics
- [ ] User can see chart views with progress metrics
- [ ] App adapts to user's available time and actual progress

### Out of Scope

- File import (PDF/CSV) — manual input only for v1
- External calendar sync (Google/Apple) — in-app calendar only
- Multi-user / shared plans — personal tool only
- Quiz/test scoring — study session tracking only

## Context

- Greenfield project — no existing codebase
- Personal productivity tool for studying public concourses, college subjects, and personal learning
- User wants to start simple and expand later
- Tech decisions already made (Next.js, Turso, Vercel, GitHub)
- Single-user app with auth for data persistence

## Constraints

- **Tech Stack**: Next.js (React framework), Turso DB (SQLite edge DB), Vercel (hosting), GitHub (version control)
- **Timeline**: No hard deadline — build iteratively
- **Platform**: Web only (responsive, but not mobile-native)
- **Auth**: Email/password required (no OAuth v1)
- **Storage**: Turso handles all persistent data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Turso | User specified; optimal for Vercel deployment | — Pending |
| Manual content input | Start simple, add imports later | — Pending |
| Even distribution scheduling | Fair baseline, adaptable later | — Pending |
| Auto-scheduled revisions | 7d and 30d after topic completion | — Pending |
| One-shot planning per deadline | No cycles, revisions mixed into schedule | — Pending |
| In-app calendar only | No external integration for v1 | — Pending |
| Single user with auth | Personal data safety without complexity | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-22 after initialization*
