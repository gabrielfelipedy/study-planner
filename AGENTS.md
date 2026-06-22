# Study Planner — Project Guide

## Project Overview

A personal web app that automatically creates study timetables based on deadlines. Built with Next.js, Turso DB (SQLite), hosted on Vercel, versioned on GitHub.

**Core Value:** Given a set of topics and a deadline, the app produces a usable daily study schedule.

## Workflow

This project uses GSD (Get Shit Done) workflow. All planning artifacts live in `.planning/`.

### Key Commands
- `/gsd-new-project` — Initialize project
- `/gsd-plan-phase N` — Plan a specific phase
- `/gsd-execute-phase N` — Execute a phase plan
- `/gsd-discuss-phase N` — Discuss phase approach before planning
- `/gsd-transition` — Move from one phase to the next
- `/gsd-progress` — View project progress

### Planning Artifacts
- `.planning/PROJECT.md` — Living project context document
- `.planning/config.json` — Workflow configuration
- `.planning/REQUIREMENTS.md` — Checkable requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase structure and mappings
- `.planning/STATE.md` — Project state tracking
- `.planning/research/` — Domain research outputs

## Current State

**Phase:** 0 (not started)
**Next step:** `/gsd-discuss-phase 1` or `/gsd-plan-phase 1`

## Tech Stack

- **Framework:** Next.js (React, App Router, Server Actions)
- **Database:** Turso (SQLite edge DB) via Drizzle ORM
- **Auth:** Better Auth (email/password)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
- **Dates:** date-fns
- **Spaced Repetition:** ts-fsrs
- **Hosting:** Vercel
- **CI/CD:** GitHub Actions (lint, type-check)

## Phases

| Phase | Goal | Status |
|-------|------|--------|
| 1 | Foundation & Data Model | Not started |
| 2 | Authentication | Not started |
| 3 | Subject & Topic Management | Not started |
| 4 | Timetable Engine & Schedule View | Not started |
| 5 | Study Sessions & Progress Tracking | Not started |
| 6 | Revision Scheduling | Not started |
| 7 | Adaptive Rescheduling | Not started |
| 8 | Dashboard & Visualizations | Not started |

## Requirements Coverage

14 v1 requirements across 5 categories: Authentication (3), Subjects & Topics (3), Timetable (3), Progress & Tracking (5).

## Important Rules

- Always check `.planning/` before making assumptions about project state
- Never modify `.planning/` files unless instructed via GSD workflow
- Follow existing code conventions (check neighboring files before creating new ones)
- Commit planning docs after each phase transition
- Use `REQ-IDs` (AUTH-01, SUBJ-02, etc.) when referencing requirements
