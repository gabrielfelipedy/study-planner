# Phase 1: Foundation & Data Model - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold, Turso database connection, Drizzle ORM schema, data access layer (DAL) structure, and CI/CD pipeline. All 9 schema tables created. No user-facing features — this is pure infrastructure that everything else depends on.

</domain>

<decisions>
## Implementation Decisions

### Package Manager
- **D-01:** Use pnpm (not npm). Faster installs, disk-efficient, de facto standard for Next.js.

### Schema Organization
- **D-02:** Single `db/schema.ts` file for all 9 tables (~9 tables, small enough for one file). Split by domain only if schema grows significantly later.

### Turso Dev Setup
- **D-03:** Local SQLite file in development (via `@libsql/client`), Turso remote in production. Switch via `TURSO_CONNECTION_TYPE` env var or similar pattern. Standard Turso local-dev pattern.

### GitHub Repository
- **D-04:** Create private GitHub repo now, push initial code immediately. Enables Vercel auto-deploy from `main` branch.

### OpenCode's Discretion
- `create-next-app` exact configuration (TypeScript, App Router, ESLint, import alias `@/`)
- Drizzle config file (`drizzle.config.ts`) structure and migration tool settings
- GitHub Actions workflow details (which Node version, pnpm version, lint/type-check commands)
- DAL skeleton implementation specifics (export signatures, type conventions)
- Environment variable naming conventions
- `.gitignore` contents
- shadcn/ui initialization timing (add components per-need during later phases, not all at once now)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — All 14 v1 requirements with REQ-IDs
- `.planning/ROADMAP.md` — Phase structure, Phase 1 details and success criteria

### Research & Stack Decisions
- `.planning/research/SUMMARY.md` — Research synthesis with stack, architecture, pitfalls
- `.planning/research/STACK.md` — Technology stack with versions and rationale
- `.planning/research/ARCHITECTURE.md` — Architecture patterns and build order
- `.planning/research/PITFALLS.md` — Domain-specific pitfalls and prevention

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
No existing code — greenfield project. Research has established the patterns to follow.

### Established Patterns
- **Next.js App Router** with Server Components, Server Actions
- **DAL pattern**: `lib/dal/queries/` for reads, `lib/dal/commands/` for writes, `lib/dal/scheduler/` for timetable logic
- **Turso local dev**: Local SQLite file, switch to remote via env var
- **Drizzle ORM** with typed schema, plain SQL migrations

### Integration Points
Phase 1 is the foundation — every subsequent phase connects to the schema tables and DAL established here.

</code_context>

<specifics>
## Specific Ideas

- Standard create-next-app setup with TypeScript, App Router, `@/` import alias
- Drizzle Kit for schema push and migration generation
- GitHub Actions runs `pnpm lint` and `pnpm type-check` on push

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---
*Phase: 01-foundation-data-model*
*Context gathered: 2026-06-22*
