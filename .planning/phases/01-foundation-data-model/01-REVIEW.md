---
phase: 01-foundation-data-model
reviewed: 2026-06-22T16:45:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - .env.example
  - .github/workflows/ci.yml
  - .gitignore
  - drizzle.config.ts
  - eslint.config.mjs
  - package.json
  - tsconfig.json
  - src/lib/dal/commands/plans.ts
  - src/lib/dal/commands/progress.ts
  - src/lib/dal/commands/schedule.ts
  - src/lib/dal/commands/subjects.ts
  - src/lib/dal/queries/calendar.ts
  - src/lib/dal/queries/plans.ts
  - src/lib/dal/queries/progress.ts
  - src/lib/dal/queries/subjects.ts
  - src/lib/dal/scheduler/adapt.ts
  - src/lib/dal/scheduler/distribute.ts
  - src/lib/dal/scheduler/revisions.ts
  - src/lib/db/client.ts
  - src/lib/db/schema.ts
  - tsconfig.json
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 01: Code Review Report — Foundation & Data Model

**Reviewed:** 2026-06-22T16:45:00Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Phase 01 establishes the project foundation: database schema, migrations, DAL stub functions, and project tooling. The schema defines 8 tables (users, subjects, topics, study_plans, plan_topics, schedule_slots, study_sessions, completions, revisions) with proper foreign key relationships and indices. The DAL layer consists of well-structured stubs that throw "Not implemented" errors for future phases. Build tooling (ESLint, TypeScript, Drizzle Kit, CI) is correctly configured.

**One critical bug was found** — all timestamp defaults in the schema produce string literals instead of SQL expressions, making every `created_at` and `updated_at` column store the literal text "(current_timestamp)" instead of an actual timestamp. This corrupts the entire data model and must be fixed before the migration is applied.

Additionally, several quality issues were found in `.gitignore`, `package.json`, and DAL type signatures that should be addressed.

---

## Critical Issues

### CR-01: Timestamp defaults are string literals, not SQL expressions

**File:** `src/lib/db/schema.ts:17`
**Issue:** Every `createdAt` and `updatedAt` column uses `default("(current_timestamp)")` which Drizzle ORM treats as a string literal, generating SQL `DEFAULT '(current_timestamp)'` (with quotes). In SQLite, quoted values are string literals, not expressions. The actual SQLite function `CURRENT_TIMESTAMP` will never be invoked. All rows will store the literal text `(current_timestamp)` instead of the actual timestamp value.

**Affected columns (8 tables):**
- `users.created_at` (line 17), `users.updated_at` (line 18)
- `subjects.created_at` (line 30), `subjects.updated_at` (line 31)
- `topics.created_at` (line 44), `topics.updated_at` (line 45)
- `study_plans.created_at` (line 61), `study_plans.updated_at` (line 62)
- `schedule_slots.created_at` (line 99)
- `study_sessions.created_at` (line 117)
- `completions.created_at` (line 133)
- `revisions.created_at` (line 152)

**Consequences:**
1. Every sort/order-by on `created_at` will produce no meaningful ordering (all values are identical strings)
2. Any query filtering by creation time (e.g., "created today") will return zero results
3. The audit log (`completions.created_at`) will be useless
4. The migration SQL (confirmed in `0000_first_magdalene.sql`) already contains the broken defaults

**Fix:** Import `sql` from `drizzle-orm` and use `default(sql`(current_timestamp)`)` for every timestamp default:

```typescript
import { sql } from "drizzle-orm";

// Example for users.createdAt:
createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
```

This generates `DEFAULT (current_timestamp)` (no quotes), making SQLite evaluate the expression on each insert. Also regenerate the migration file after fixing.

---

## Warnings

### WR-01: `.gitignore` negation will not track `drizzle-kit/migrator` contents

**File:** `.gitignore:56`
**Issue:** Line 55 (`drizzle-kit/**`) ignores all contents of `drizzle-kit/`. Line 56 (`!drizzle-kit/migrator`) attempts to un-ignore the `migrator` subdirectory, but git's negation rules only affect the exact path `drizzle-kit/migrator` — files *inside* that directory remain ignored. If the intent is to track files within `drizzle-kit/migrator`, this pattern won't work.

**Fix:** Add a second negation rule for the directory contents:

```
!drizzle-kit/migrator
!drizzle-kit/migrator/**
```

Alternatively, if `drizzle-kit/migrator` should remain fully ignored, remove line 56 entirely.

### WR-02: `@better-auth/cli` is a production dependency

**File:** `package.json:13`
**Issue:** `@better-auth/cli` is a CLI tool for code generation and database migrations. It should be a `devDependency` since it is never imported by application code at runtime. Including it in `dependencies` unnecessarily inflates production installs and sends the wrong signal about its usage.

**Fix:** Move to `devDependencies`:

```json
{
  "devDependencies": {
    "@better-auth/cli": "^1.4.21",
    ...
  }
}
```

### WR-03: `updatePlan` accepts `userId` through partial input allowing ownership transfer

**File:** `src/lib/dal/commands/plans.ts:36`
**Issue:** The `data` parameter is typed as `Partial<CreatePlanInput>`, and `CreatePlanInput` includes `userId`. This means a caller could pass `{ userId: "another-user-id" }` to `updatePlan`, transferring plan ownership to another user. The `userId` field should be immutable after creation and excluded from the update type.

**Fix:** Create a dedicated update type without `userId`:

```typescript
export type UpdatePlanInput = Omit<Partial<CreatePlanInput>, 'userId'>;

export async function updatePlan(
  planId: string,
  userId: string,
  data: UpdatePlanInput
): Promise<PlanResult> {
  // ...
}
```

### WR-04: `updateSubject` accepts `userId` through partial input allowing ownership transfer

**File:** `src/lib/dal/commands/subjects.ts:25`
**Issue:** Same pattern as WR-03. `updateSubject` takes `Partial<CreateSubjectInput>` which includes `userId`, allowing a caller to transfer subject ownership. The `userId` field in `CreateSubjectInput` determines ownership at creation time and should not be updateable.

**Fix:** Create a dedicated update type:

```typescript
export type UpdateSubjectInput = Omit<Partial<CreateSubjectInput>, 'userId'>;

export async function updateSubject(
  subjectId: string,
  userId: string,
  data: UpdateSubjectInput
): Promise<void> {
  // ...
}
```

### WR-05: Drizzle Kit config missing `authToken` for remote Turso migrations

**File:** `drizzle.config.ts:8-9`
**Issue:** The `dbCredentials` block only provides `url` but not `authToken`. When `TURSO_DATABASE_URL` points to a remote Turso database (libsql://...), drizzle-kit will fail to authenticate because no auth token is supplied. The runtime client (`src/lib/db/client.ts`) correctly passes `authToken` from the environment, but the migration tool config does not.

**Fix:** Add `authToken` to the Drizzle Kit config:

```typescript
dbCredentials: {
  url: process.env.TURSO_DATABASE_URL ?? "file:./data/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
},
```

---

## Info

### IN-01: Free-text enum fields without CHECK constraints

**File:** `src/lib/db/schema.ts`
**Lines:** 29 (difficulty), 42 (status), 95 (type)
**Issue:** Three columns use free-text strings where their values are expected to be from a fixed set:
- `subjects.difficulty`: expects `"easy" | "medium" | "hard"` (line 29)
- `topics.status`: expects `"pending" | "studied" | "revised"` (line 42)
- `schedule_slots.type`: expects `"study" | "revision-7d" | "revision-30d"` (line 95)

Without CHECK constraints, invalid or misspelled values can be written at the database level. While application-layer validation should catch these, a database constraint provides defense-in-depth.

**Fix:** Add CHECK constraints using Drizzle's `.$type()` or SQL `check()`:

```typescript
// Option 1: Type-level narrowing with Drizzle
difficulty: text("difficulty").$type<"easy" | "medium" | "hard">(),

// Option 2: Drizzle check constraint
import { sql } from "drizzle-orm";
difficulty: text("difficulty").default("medium").notNull(),
// Then add table check: see Drizzle docs for check() usage
```

### IN-02: `getTodaySchedule` returns `unknown[]` instead of typed interface

**File:** `src/lib/dal/queries/progress.ts:27`
**Issue:** The return type `Promise<unknown[]>` is too permissive. While this is a stub awaiting Phase 5 implementation, the return type should be locked down to prevent downstream code from working around the type system. Once the function signature is set, changing it later becomes difficult.

**Fix:** Add a proper interface now, even if the implementation is empty:

```typescript
export type TodayScheduleItem = {
  slotId: string;
  planId: string;
  topicId: string;
  topicTitle: string;
  type: "study" | "revision-7d" | "revision-30d";
  estimatedMinutes: number | null;
  isCompleted: boolean;
};

export const getTodaySchedule = cache(async (
  userId: string
): Promise<TodayScheduleItem[]> => {
  return [];
});
```

### IN-03: No runtime validation for required production environment variables

**File:** `src/lib/db/client.ts:14-17`, `drizzle.config.ts:8`
**Issue:** Both the database client and Drizzle Kit config silently fall back to `"file:./data/dev.db"` when `TURSO_DATABASE_URL` is unset. In production, this means a misconfiguration would attempt to use a local SQLite file instead of the remote Turso database, likely failing with a confusing error or (worse) silently running against the wrong database. Same applies to `TURSO_AUTH_TOKEN` in production.

**Fix:** Add a startup validation that checks for required env vars in production:

```typescript
if (process.env.NODE_ENV === "production" && !process.env.TURSO_DATABASE_URL) {
  throw new Error(
    "TURSO_DATABASE_URL is required in production."
  );
}
```

---

## Files with No Issues

The following files were reviewed and found to have no defects:

| File | Notes |
|------|-------|
| `.env.example` | Clean — correctly documents both Turso and local dev options |
| `.github/workflows/ci.yml` | Clean — lint + type-check on push/PR, pinned versions |
| `eslint.config.mjs` | Clean — flat config with proper ignores, Next.js core-web-vitals + TS |
| `tsconfig.json` | Clean — strict mode on, bundler module resolution, path aliases |
| `src/lib/dal/commands/progress.ts` | Stub only — no issues in signatures |
| `src/lib/dal/commands/schedule.ts` | Stub only — no issues in types |
| `src/lib/dal/queries/calendar.ts` | Stub only — type definitions are sound |
| `src/lib/dal/queries/plans.ts` | Stub only — good use of React.cache() |
| `src/lib/dal/queries/subjects.ts` | Stub only — nested type structure is clean |
| `src/lib/dal/scheduler/adapt.ts` | Stub only — design constraints well documented |
| `src/lib/dal/scheduler/distribute.ts` | Stub only — pure function signature, feasibility result type |
| `src/lib/dal/scheduler/revisions.ts` | Stub only — 4-button rating type defined |
| `src/lib/db/client.ts` | Clean — singleton pattern, fallback logic, schema import |

---

## Recommendations for Phase 1 Follow-Up

1. **Fix CR-01 before any data is inserted.** If the migration has already been applied to any database, that database must be reset and re-migrated after the fix. The broken defaults cannot be corrected retroactively via a new migration (existing rows already store the literal string).

2. **Regenerate the migration file** (`0000_first_magdalene.sql`) after fixing the timestamp defaults, as the SQL output will change.

3. **Address WR-02** (move `@better-auth/cli` to devDependencies) to keep production dependency tree clean — this matters for Vercel deployments where only `dependencies` are installed unless explicitly configured.

---

_Reviewed: 2026-06-22T16:45:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
