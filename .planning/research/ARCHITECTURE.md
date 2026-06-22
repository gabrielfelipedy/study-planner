# Architecture Research

**Domain:** Personal study planner web app (single-user, timetable generation, progress tracking)
**Researched:** 2026-06-22
**Confidence:** HIGH — patterns verified against Next.js 16 + Turso + Drizzle production references and real study planner codebases

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Browser)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Page Views   │  │  Calendar     │  │  Chart Views  │  │  Progress   │  │
│  │ (RSC output)  │  │  (RSC + CSS)  │  │  (Recharts)   │  │  Dashboard  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                 │                 │          │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐  │
│  │            Client Interactivity (Client Components)                │  │
│  │  useActionState / useTransition / TanStack Query (optional)       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │  Server Actions (form POST) / RSC
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER (Next.js App Router)                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                   Route Handlers (app/api/*)                       │    │
│  │           For external callers / future integrations               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────┐  ┌─────────────────────────────────┐    │
│  │   Server Actions           │  │   Server Components (RSC)        │    │
│  │   (app/actions/*.ts)        │  │   (app/page.tsx, etc.)          │    │
│  │   - Auth                    │  │   - Direct DB reads             │    │
│  │   - Create/mutate plans     │  │   - No API intermediaries       │    │
│  │   - Mark topics studied     │  │                                  │    │
│  │   - Revalidate cache        │  │                                  │    │
│  └───────────┬────────────────┘  └────────────────┬─────────────────┘    │
│              │                                    │                      │
│              ▼                                    ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                 DATA ACCESS LAYER (lib/dal/)                       │    │
│  │                                                                   │    │
│  │  ┌──────────────┐ ┌───────────────┐ ┌─────────────────────────┐  │    │
│  │  │ queries/*.ts  │ │  commands/*.ts │ │  scheduler/*.ts          │  │    │
│  │  │ (read ops)    │ │  (write ops)   │ │  (timetable engine)     │  │    │
│  │  └──────┬───────┘ └───────┬───────┘ └───────────┬─────────────┘  │    │
│  │         │                 │                      │                │    │
│  │         ▼                 ▼                      ▼                │    │
│  │  ┌──────────────────────────────────────────────────────────┐    │    │
│  │  │              Drizzle ORM + LibSQL Client                  │    │    │
│  │  │              (lib/db/client.ts, lib/db/schema.ts)         │    │    │
│  │  └──────────────────────────┬───────────────────────────────┘    │    │
│  └─────────────────────────────┼────────────────────────────────────┘    │
│                                │                                        │
│                    ┌───────────┴───────────┐                            │
│                    │    Auth Layer          │                            │
│                    │  (lib/auth/*)          │                            │
│                    │  Session + middleware  │                            │
│                    └───────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────────┘
                                    │  HTTPS / libSQL wire protocol
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER (Turso)                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │              Turso (LibSQL) Edge Database                          │    │
│  │                                                                   │    │
│  │  users │ subjects │ topics │ study_plans │ schedule_slots         │    │
│  │  study_sessions │ completions │ revisions                         │    │
│  │                                                                   │    │
│  │  Development: file:local-replica.db (embedded replica)            │    │
│  │  Production:  libsql:// (remote, edge-distributed)                │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Page Views (RSC)** | Render HTML with data; handle layout, calendar, dashboard charts | Next.js Server Components; direct calls to DAL queries |
| **Client Interactivity** | Handle user input, form state, optimistic updates, chart interactivity | Client Components with `useActionState`, `useTransition`, `useFormStatus` |
| **Server Actions** | Validate, auth-check, mutate data, revalidate cache | `"use server"` functions in `app/actions/*.ts`; Zod validation |
| **Route Handlers** | Future external API (mobile client, webhooks) | `app/api/*/route.ts` (not needed for v1) |
| **Data Access Layer** | All database reads and writes; no business logic in UI | `lib/dal/queries/` for reads, `lib/dal/commands/` for writes |
| **Scheduler Engine** | Generate timetable from topics + deadline; compute revision schedule | Pure TypeScript function in `lib/dal/scheduler/`; deterministic algorithm |
| **Auth Layer** | Session management, middleware protection | Better Auth / Lucia with LibSQL adapter; middleware session check |
| **Drizzle ORM** | Schema definition, type-safe queries, migrations | `lib/db/schema.ts` (tables), `lib/db/client.ts` (connection) |
| **Turso DB** | Persistent storage, edge-distributed SQLite | Turso remote DB (prod); file-based replica (dev) |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth route group (login, signup)
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts        # Co-located auth server actions
│   │   └── signup/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── (dashboard)/              # Dashboard route group (protected)
│   │   ├── page.tsx              # Main dashboard (progress, metrics)
│   │   ├── calendar/
│   │   │   └── page.tsx          # Calendar view
│   │   ├── plans/
│   │   │   ├── page.tsx          # List study plans
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Create plan wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Plan detail + progress
│   │   │       └── actions.ts    # Plan-specific server actions
│   │   ├── subjects/
│   │   │   ├── page.tsx          # Subject list
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Subject detail with topics
│   │   │       └── actions.ts
│   │   └── layout.tsx            # Protected layout with nav
│   ├── api/                      # Route handlers (future use)
│   └── globals.css
├── components/                   # Shared React components
│   ├── ui/                       # Primitive UI (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── calendar.tsx          # Calendar grid component
│   │   └── ...
│   ├── charts/                   # Chart & visualization components
│   │   ├── progress-pie.tsx
│   │   ├── study-heatmap.tsx
│   │   └── weekly-bar.tsx
│   ├── forms/                    # Form components
│   │   ├── plan-form.tsx
│   │   ├── subject-form.tsx
│   │   └── topic-form.tsx
│   └── layout/                   # Layout components
│       ├── sidebar.tsx
│       ├── navbar.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── db/                       # Database configuration
│   │   ├── client.ts             # Turso LibSQL client + Drizzle instance
│   │   ├── schema.ts             # All Drizzle table definitions
│   │   └── migrations/           # Generated SQL migrations
│   ├── dal/                      # Data Access Layer
│   │   ├── queries/              # Read operations
│   │   │   ├── plans.ts          # Get plans, get plan by id
│   │   │   ├── subjects.ts       # Get subjects with topics
│   │   │   ├── progress.ts       # Get completion stats, progress %
│   │   │   └── calendar.ts       # Get schedule slots by date range
│   │   ├── commands/             # Write operations
│   │   │   ├── plans.ts          # Create/update/delete plan
│   │   │   ├── subjects.ts       # Create/update/delete subject & topic
│   │   │   ├── progress.ts       # Mark topic studied, log session
│   │   │   └── schedule.ts       # Save generated schedule, reset
│   │   └── scheduler/            # Timetable generation engine
│   │       ├── distribute.ts     # Even topic distribution algorithm
│   │       ├── revisions.ts      # 7d/30d revision scheduling
│   │       └── adapt.ts          # Reschedule based on actual progress
│   ├── auth/                     # Auth configuration
│   │   ├── client.ts             # Auth client setup
│   │   ├── middleware.ts         # Session verification middleware
│   │   └── config.ts             # Auth config (session duration, etc.)
│   ├── validations/              # Zod schemas (shared types)
│   │   ├── plan.ts
│   │   ├── subject.ts
│   │   └── topic.ts
│   └── utils.ts                  # General utilities
├── actions/                      # Server Actions (thin orchestration)
│   ├── auth.ts                   # Login, signup, logout actions
│   ├── plans.ts                  # Create plan, generate timetable
│   ├── subjects.ts               # Add subject, add topic
│   ├── progress.ts               # Mark studied, log session
│   └── schedule.ts               # Regenerate, adapt schedule
├── types/                        # Shared TypeScript types
│   ├── index.ts
│   ├── plan.ts
│   └── schedule.ts
└── config/
    └── site.ts                   # App configuration constants
```

### Structure Rationale

- **`app/` route groups:** `(auth)` and `(dashboard)` route groups keep auth pages separate from authenticated pages, each with its own layout. The dashboard group uses a single `layout.tsx` with shared navigation. Co-located `actions.ts` files next to pages means the code that renders a page and the code that mutates its data live together.
- **`lib/dal/` (Data Access Layer):** Centralizes all database access. Server Components read via `lib/dal/queries/*`, Server Actions write via `lib/dal/commands/*`. The scheduler engine lives in `lib/dal/scheduler/` because it reads plan data and writes schedule slots. No component or action imports Drizzle directly — they go through the DAL.
- **`lib/db/`:** Owns the Drizzle client setup, schema definitions, and migrations. Only `lib/dal/` imports from here. This enforces the boundary that DB details are an implementation concern.
- **`actions/`:** Thin Server Action files that handle auth checks, validate with Zod, call DAL commands, revalidate cache. They are the orchestration layer — no direct Drizzle calls.
- **`components/ui/`:** shadcn/ui primitives. Generic, reusable, no business logic.
- **`components/charts/`:** Chart components wrapping Recharts. Accept data props only.
- **`components/forms/`:** Form components that call Server Actions via `useActionState`.

## Architectural Patterns

### Pattern 1: Data Access Layer (DAL) — Repository-Lite

**What:** All database access is encapsulated in `lib/dal/`. Server Components and Actions import DAL functions, never Drizzle directly. The DAL exports explicit query and command functions with typed inputs and outputs.

**When to use:** Any Next.js App Router app with more than ~5 database queries. Prevents scattered DB calls and makes caching/optimization changes central.

**Trade-offs:**
- **Pro:** Single place to add caching (`React.cache()`), change query logic, or swap ORM
- **Pro:** Enforces separation between data fetching and presentation
- **Pro:** Authorization can be baked into DAL functions
- **Con:** Extra indirection for simple CRUD (overkill at 2-3 queries, worthwhile at 10+)
- **Con:** Must resist over-abstracting — no separate Repository interfaces for each entity

**Example:**
```typescript
// lib/dal/queries/plans.ts
import { db } from "@/lib/db/client";
import { studyPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getPlansForUser = cache(async (userId: string) => {
  return db.select().from(studyPlans).where(eq(studyPlans.userId, userId));
});

export const getPlanById = cache(async (planId: string, userId: string) => {
  const [plan] = await db
    .select()
    .from(studyPlans)
    .where(eq(studyPlans.id, planId))
    .limit(1);
  return plan ?? null;
});
```

### Pattern 2: Server Action as Orchestrator (Thin Action Pattern)

**What:** Each Server Action does exactly 5 things in order: (1) authenticate, (2) validate with Zod, (3) call a DAL command, (4) revalidate cache, (5) return a typed result or redirect. No business logic lives in the action itself — it's in the DAL command.

**When to use:** All mutations in the app. This is the recommended Next.js + Drizzle pattern from ecosystem leaders (MakerKit, 0xstack, Drizzle docs).

**Trade-offs:**
- **Pro:** Actions are thin and auditable — you can see auth, validation, and business logic in sequence
- **Pro:** DAL commands are testable independently of the action/calling context
- **Pro:** Consistent error handling across all mutations
- **Con:** Requires discipline to keep business logic out of actions
- **Con:** Slightly more files than putting everything in one function

**Example:**
```typescript
// src/actions/plans.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createPlan } from "@/lib/dal/commands/plans";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";
import { CreatePlanSchema } from "@/lib/validations/plan";
import type { ActionState } from "@/types";

export async function createPlanAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAuth();           // 1. Auth

  const parsed = CreatePlanSchema.safeParse({     // 2. Validate
    title: formData.get("title"),
    deadline: formData.get("deadline"),
    hoursPerDay: Number(formData.get("hoursPerDay")),
  });
  if (!parsed.success) {
    return { message: "Validation failed", errors: parsed.error.flatten().fieldErrors };
  }

  const plan = await createPlan({                 // 3. Mutate
    userId: session.user.id,
    ...parsed.data,
  });

  await generateSchedule(plan.id);                // 3b. Side effect: generate timetable

  revalidatePath("/dashboard");                   // 4. Revalidate
  redirect(`/plans/${plan.id}`);                  // 5. Redirect
}
```

### Pattern 3: Server Components for Reads, Client Islands for Interactivity

**What:** Page shells are Server Components that fetch data directly. Only interactive elements (forms, charts, calendar click handlers) are wrapped in Client Components using `"use client"`. Data is passed as props.

**When to use:** Default pattern for Next.js App Router. Avoids making entire pages client-rendered when only a small piece needs interactivity.

**Trade-offs:**
- **Pro:** Most HTML is server-rendered and streamed; minimal client JS
- **Pro:** Data fetching happens during render, no waterfall or loading states needed
- **Pro:** Direct DB calls from Server Components (no API route needed for reads)
- **Con:** Client Components must pass data down as props (can't call DAL directly)
- **Con:** Interleaving server/client components requires careful boundary design

**Example:**
```typescript
// app/(dashboard)/plans/[id]/page.tsx — Server Component
import { getPlanById } from "@/lib/dal/queries/plans";
import { getScheduleForPlan } from "@/lib/dal/queries/calendar";
import { requireAuth } from "@/lib/auth";
import { PlanHeader } from "./plan-header";          // Client Component
import { ScheduleCalendar } from "./schedule-calendar"; // Client Component
import { ProgressBar } from "@/components/charts/progress-bar"; // Client Component

export default async function PlanPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  const plan = await getPlanById(params.id, session.user.id);
  const schedule = await getScheduleForPlan(params.id);

  return (
    <div>
      <PlanHeader plan={plan} />                     {/* Interactive form buttons */}
      <ProgressBar completed={plan.completed} total={plan.totalTopics} />
      <ScheduleCalendar slots={schedule} />          {/* Interactive calendar */}
    </div>
  );
}
```

### Pattern 4: Deterministic Timetable Generation Engine

**What:** The timetable generator is a pure TypeScript function (no ML, no OR-Tools — overkill for personal use). It takes topics + deadline + hoursPerDay and produces daily schedule slots. The algorithm distributes topics evenly across available days, interleaving new topics with revision slots based on the 7d/30d rule.

**When to use:** Core scheduling feature. The generator is stateless and deterministic — same input always produces same output (important for reproducibility).

**Trade-offs:**
- **Pro:** Simple, testable, fast (sub-millisecond for personal-scale data)
- **Pro:** No external solver dependency (OR-Tools, Z3)
- **Pro:** Deterministic output means the user gets consistent results
- **Con:** Limited optimization — doesn't handle complex constraints like topic dependencies
- **Con:** Manual rescheduling needed if user falls behind (adaptive rescheduling is a future enhancement)

**Example:**
```typescript
// lib/dal/scheduler/distribute.ts

interface Topic {
  id: string;
  subjectId: string;
  title: string;
  estimatedHours: number;
}

interface ScheduleInput {
  topics: Topic[];
  deadline: Date;
  startDate: Date;
  hoursPerDay: number;
}

interface ScheduleSlot {
  date: string;        // YYYY-MM-DD
  topicId: string;
  type: "study" | "revision-7d" | "revision-30d";
  estimatedMinutes: number;
}

export function generateSchedule(input: ScheduleInput): ScheduleSlot[] {
  const daysAvailable = daysBetween(input.startDate, input.deadline);
  const totalHours = input.topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const dailyTopicCount = Math.ceil(totalHours / (daysAvailable * input.hoursPerDay));

  // Distribute topics evenly across days
  const slots: ScheduleSlot[] = [];
  let topicIndex = 0;
  let dayOffset = 0;

  for (const date of eachDay(input.startDate, input.deadline)) {
    if (topicIndex >= input.topics.length) break;

    for (let i = 0; i < dailyTopicCount && topicIndex < input.topics.length; i++) {
      slots.push({
        date,
        topicId: input.topics[topicIndex].id,
        type: "study",
        estimatedMinutes: input.hoursPerDay * 60 / dailyTopicCount,
      });

      // Schedule 7d revision
      const revision7d = addDays(date, 7);
      if (revision7d <= input.deadline) {
        slots.push({
          date: revision7d,
          topicId: input.topics[topicIndex].id,
          type: "revision-7d",
          estimatedMinutes: Math.round(input.hoursPerDay * 60 / dailyTopicCount / 2),
        });
      }
      // Schedule 30d revision
      const revision30d = addDays(date, 30);
      if (revision30d <= input.deadline) {
        slots.push({
          date: revision30d,
          topicId: input.topics[topicIndex].id,
          type: "revision-30d",
          estimatedMinutes: Math.round(input.hoursPerDay * 60 / dailyTopicCount / 3),
        });
      }

      topicIndex++;
    }
  }

  return slots;
}
```

### Pattern 5: Route Groups for Auth Separation

**What:** Auth pages (`login`, `signup`) live in an `(auth)` route group with a minimal guest layout. Protected pages live in `(dashboard)` or `(app)` with a full layout (sidebar, nav) and middleware that checks session.

**When to use:** Any app with authenticated and unauthenticated pages. Next.js idiomatic pattern.

**Trade-offs:**
- **Pro:** Clean URL structure (`/login`, `/dashboard`) without layout leakage
- **Pro:** Middleware can check `nextUrl.pathname` for route group patterns
- **Pro:** Different layouts for auth vs app without conditional layout logic
- **Con:** Route groups can be confusing to newcomers (parentheses in path)

## Data Flow

### Request Flow

```
[User opens dashboard]
    ↓
[Server Component: dashboard/page.tsx]
    ↓
[requireAuth()] ──→ [Auth middleware verifies session cookie]
    ↓
[lib/dal/queries/progress.ts] ──→ [db.select() from Turso]
    ↓
[Drizzle builds SQL → LibSQL client → HTTPS to Turso edge DB]
    ↓
[Data returned to Server Component]
    ↓
[HTML + serialized data rendered to client]
    ↓
[Client hydrates interactive islands: charts, calendar, forms]

[User clicks "Mark studied"]
    ↓
[Client Component calls Server Action via form action or startTransition]
    ↓
[Server Action: actions/progress.ts]
    ↓ 1. requireAuth()
    ↓ 2. Zod validate input
    ↓ 3. lib/dal/commands/progress.ts → db.insert() → Turso
    ↓ 4. revalidatePath("/dashboard") — busts RSC cache
    ↓ 5. Return { success: true }
    ↓
[Next.js re-renders affected RSC payloads]
    ↓
[UI updates without full page reload]
```

### State Management

```
[Turso (source of truth)]
    ↓ (read via DAL queries in RSC)
[React Server Component payload]
    ↓ (serialized)
[Client receives HTML + data]
    │
    ├── [Passed as props to Client Components]
    │       ↓
    │   [Client Component renders data]
    │       ↓
    │   [User interacts → calls Server Action]
    │       ↓
    │   [Server Action returns → revalidatePath()]
    │       ↓
    │   [RSC re-renders → new data streamed]
    │
    └── [No client-side state store needed for v1]
        [TanStack Query optional for optimistic updates in future]

Key principle: Server is source of truth for all data.
Client never holds authoritative state — it's always a snapshot from the server.
```

### Key Data Flows

1. **Timetable Generation:** User creates a plan (subjects + topics + deadline) → Server Action calls scheduler engine → engine reads topics from DB, computes schedule → writes `schedule_slots` to DB → UI re-renders with calendar view populated. This is the core value flow.

2. **Progress Tracking:** User marks topic "studied" → Server Action inserts `completion` record → checks if this triggers 7d/30d revision creation (if not already scheduled) → revalidates dashboard → progress bars update. The progress calculation queries: `(completed topics / total topics)` per plan, per subject, and overall.

3. **Calendar Population:** Server Component for calendar page queries `schedule_slots` for the visible date range → groups by date → renders a grid. No client-side fetching needed — the RSC has all data at render time. For month navigation, the route param changes and a new RSC request fetches the next month.

4. **Dashboard Aggregation:** Dashboard RSC queries: total plans count, active plan progress %, upcoming 7 days of schedule, recent completions. These are 4 separate DAL queries (each with `React.cache()` deduplication within the render tree). Results are passed as props to chart Client Components.

## DB Schema Design (Logical)

```
users
├── id (text, primary key)
├── email (text, unique, not null)
├── name (text)
├── hashedPassword (text)/auth-managed
├── createdAt (text, ISO date)
└── settings (text, JSON blob — timezone, theme, hoursPerDay default)

subjects
├── id (text, primary key)
├── userId (text, FK → users.id, not null)
├── name (text, not null)
├── color (text — hex color for UI accent)
├── difficulty (text — "easy" | "medium" | "hard")
└── createdAt (text)

topics
├── id (text, primary key)
├── subjectId (text, FK → subjects.id, not null)
├── title (text, not null)
├── estimatedHours (real, default 1.0)
├── status (text — "pending" | "studied" | "revised")
└── sortOrder (integer)

study_plans
├── id (text, primary key)
├── userId (text, FK → users.id, not null)
├── title (text, not null)
├── deadline (text, ISO date)
├── startDate (text, ISO date)
├── hoursPerDay (real)
├── totalTopics (integer)
├── completedTopics (integer, default 0 — denormalized for fast reads)
├── status (text — "active" | "completed" | "paused")
└── createdAt (text)

plan_topics (join table — which topics belong to which plan)
├── id (text, primary key)
├── planId (text, FK → study_plans.id, not null)
├── topicId (text, FK → topics.id, not null)
└── UNIQUE(planId, topicId)

schedule_slots (generated timetable)
├── id (text, primary key)
├── planId (text, FK → study_plans.id, not null)
├── topicId (text, FK → topics.id, not null)
├── date (text, ISO date — YYYY-MM-DD)
├── type (text — "study" | "revision-7d" | "revision-30d")
├── estimatedMinutes (integer)
├── isCompleted (boolean, default false)
├── completedAt (text, nullable)
└── INDEX (planId, date) — for calendar queries

study_sessions (time tracking — future expansion)
├── id (text, primary key)
├── userId (text, FK → users.id, not null)
├── planId (text, FK → study_plans.id)
├── topicId (text, FK → topics.id)
├── durationMinutes (integer)
├── date (text, ISO date)
└── notes (text, nullable)

completions (audit log of what was studied when)
├── id (text, primary key)
├── userId (text, FK → users.id, not null)
├── planId (text, FK → study_plans.id, not null)
├── topicId (text, FK → topics.id, not null)
├── date (text, ISO date)
└── createdAt (text)

revisions (scheduled revision events)
├── id (text, primary key)
├── planId (text, FK → study_plans.id, not null)
├── topicId (text, FK → topics.id, not null)
├── originalStudyDate (text — when the topic was first studied)
├── scheduledDate (text — when revision is due)
├── interval (integer — 7 or 30 days)
├── isCompleted (boolean, default false)
└── completedAt (text, nullable)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1 users (this app)** | Single Turso database, direct DAL queries in RSC, no caching layer needed. Server Actions run on Vercel serverless functions (Node.js runtime). No external services beyond Turso. |
| **1-1k users** | Turso handles this natively (multi-tenancy via `userId` FK filter in every query). Add `React.cache()` for per-request deduplication. Consider `@tursodatabase/vercel-experimental` for local-read optimization. |
| **1k+ users** | Turso scales horizontally (add replicas). Add `unstable_cache` for cross-request caching of dashboard aggregates. Consider moving timetable generation to a queue (Vercel Cron + background function) if compute becomes expensive. |

### Scaling Priorities

1. **First bottleneck:** Timetable generation for very large plans (1000+ topics). The O(n) distribute algorithm runs in milliseconds for typical plans (10-100 topics). Not an issue for v1. If it becomes one, move generation to a background job.

2. **Second bottleneck:** Dashboard aggregate queries as the data grows. Multiple `SELECT COUNT(*)` queries per render. Mitigation: denormalize `completedTopics` on `study_plans` (already in schema above), add periodic materialized views or summary tables.

3. **Never a bottleneck for this app:** Connection pooling, database sharding, CDN caching. Single-user personal tool with a few hundred rows. Premature optimization is the enemy.

## Anti-Patterns

### Anti-Pattern 1: Scattered Database Queries

**What people do:** Importing `db` directly in page components, mixing `SELECT` statements inside JSX, or calling the ORM from inside UI event handlers.

**Why it's wrong:** When queries are scattered, a schema change means hunting through 20 files. Authorization checks are easily forgotten. Caching becomes impossible to add retroactively. Testing requires spinning up the full app.

**Do this instead:** All database access goes through `lib/dal/`. Pages and Server Components never import from `lib/db/` directly. If a page needs data, it imports a function from `lib/dal/queries/`.

### Anti-Pattern 2: Over-Abstracting the Scheduler (Using OR-Tools for Personal Use)

**What people do:** Dropping in Google OR-Tools, Z3, or a genetic algorithm library to "optimize" the timetable for a single user with 20 topics.

**Why it's wrong:** These tools are designed for university timetabling with hundreds of courses, room constraints, faculty availability, and clash avoidance. For a personal study planner, a simple O(n) distribution algorithm produces the same quality result in microseconds with zero external dependencies. OR-Tools adds 50+ MB of binary dependencies and complexity.

**Do this instead:** Start with a deterministic even-distribution algorithm in pure TypeScript. It's testable, fast, and produces a "good enough" schedule. If the user needs constraint-based optimization later, the DAL boundary makes it easy to swap the implementation behind the same interface.

### Anti-Pattern 3: Fat Server Actions

**What people do:** Putting business logic, multiple DB calls, email sending, and file processing all inside a single Server Action function that spans 200+ lines.

**Why it's wrong:** Server Actions become untestable monoliths. If you need to change logic, you have to read through auth checks, validation, error handling, and mutations mixed together. The action can't be reused by a future API route.

**Do this instead:** Keep Server Actions thin. Auth + validate + call DAL command + revalidate. Business logic lives in `lib/dal/commands/` or `lib/dal/scheduler/`. The action is the orchestration layer, not the logic layer.

### Anti-Pattern 4: Client-Side Data Fetching with Loading States for Everything

**What people do:** Using `fetch()` in client components, showing spinners everywhere, and managing loading states for what could be server-rendered.

**Why it's wrong:** Every piece of data that doesn't need real-time updates or user-specific interactivity should be fetched in Server Components. This eliminates loading states, reduces client JS bundle, and simplifies the code. Study planner data (subjects, topics, schedule, progress) is not real-time — server-render it.

**Do this instead:** Fetch data in Server Components, pass as props to Client Components for interactivity. Only use client-side fetching (`useEffect` + fetch, TanStack Query) for features that genuinely need it: real-time countdown timers, maybe.

### Anti-Pattern 5: Storing the Generated Schedule Only in Memory

**What people do:** Computing the timetable on the fly every time the user visits the calendar page, or storing it only in client-side state.

**Why it's wrong:** The timetable is a deterministic output that should be persisted. Storing `schedule_slots` in the DB means the calendar page loads instantly (one query), the user can see the same schedule on any device, and they can manually adjust slots. Regeneration only happens when topics change.

**Do this instead:** Persist generated schedule slots in `schedule_slots` table. Only regenerate when the user edits topics or deadline explicitly. This also enables incremental progress tracking against a fixed schedule.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Turso** | LibSQL client via `@libsql/client` or `@tursodatabase/serverless`. Production: remote `libsql://` URL. Dev: `file:local-replica.db` with optional sync. | Vercel production uses remote mode only (no file persistence in serverless). Drizzle Kit migrations run against remote URL from separate env file. |
| **Auth (Better Auth / Lucia / custom)** | LibSQL adapter for session storage. Middleware reads session cookie on every request. Server Actions call `requireAuth()` at the top. | Session cookie is HTTP-only, same-site. No client-side session access. Auth middleware protects `(dashboard)` route group. |
| **Vercel** | Standard Next.js deployment. Environment variables for Turso credentials. No special configuration needed. | Use Node.js runtime (not Edge) for Turso compatibility — Edge Runtime has limitations with `@libsql/client`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Server Component ↔ DAL** | Direct function call (same Node.js process) | Use `React.cache()` for deduplication |
| **Server Action ↔ DAL** | Direct function call | Actions orchestrate: auth, validate, call DAL, revalidate |
| **Client Component ↔ Server Action** | Form action / `startTransition` | Data serialized automatically. Returns typed `ActionState`. |
| **Scheduler Engine ↔ DAL** | The scheduler calls DAL commands to write schedule slots. The scheduler is itself a DAL module. | Scheduler reads topics from DB (via queries), writes schedule to DB (via commands). |
| **Charts ↔ Data** | Server Component passes data as props to chart Client Components | Charts are pure render — no data fetching. |

## Sources

- [Turso + Next.js Official Docs](https://docs.turso.tech/sdk/ts/guides/nextjs) — HIGH confidence: official integration patterns
- [Turso + Vercel Integration (BETA)](https://github.com/tursodatabase/turso-vercel) — HIGH confidence: partial sync for serverless reads
- [Next.js Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — HIGH confidence: official Next.js patterns
- [Building Production-Grade Next.js: Design Patterns & Data (Kaveesh Karunarathna)](https://medium.com/@kaveeshbc/building-production-grade-next-js-part-2-design-patterns-data-af76543beb4c) — MEDIUM confidence: community but broadly cited pattern matching production codebases
- [Structuring Your Data Access Layer in Next.js (MD Samrose)](https://medium.com/@samrose.mohammed/structuring-your-data-access-layer-in-next-js-patterns-that-actually-scale-2e4c07491866) — MEDIUM confidence: DAL pattern verified against multiple real codebases
- [0xstack CQRS Architecture for Next.js](https://github.com/0xMilord/0xstack) — MEDIUM confidence: production-pattern starter with clear layer separation
- [MakerKit Next.js + Drizzle Server Actions Guide](https://makerkit.dev/docs/nextjs-drizzle/development-guide/server-actions) — MEDIUM confidence: well-documented production template
- [Next.js + Turso Starter (official)](https://github.com/tursodatabase/nextjs-turso-starter) — HIGH confidence: official starter with Drizzle ORM
- [Study Sync Architecture](https://www.mintlify.com/AffanHossainRakib/study-sync/architecture/overview) — MEDIUM confidence: real study planner reference (MongoDB, but component patterns translate)
- [AI Study Planner Database Schema (Harshal-Bsys27)](https://github.com/Harshal-Bsys27/ai-study-planner) — MEDIUM confidence: reference schema for study planner tables
- [Plan4U Study Planner (sahil007-ai)](https://github.com/sahil007-ai/raisoni) — MEDIUM confidence: full-featured study planner with SQLite schema reference

---

*Architecture research for: Study Planner (Next.js + Turso)*
*Researched: 2026-06-22*
