# Phase 2: Authentication - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Sign up, login/logout, password reset, protected routes. Better Auth is already in `package.json` dependencies but unconfigured. No auth code exists yet. The `users` table is defined in the schema but needs integration with Better Auth's auth tables.

</domain>

<decisions>
## Implementation Decisions

### Protected Routes Strategy
- **D-01:** Use middleware-only approach for route protection — define protected route patterns in `middleware.ts`. Better Auth middleware handles redirect to sign-in.
- **D-02:** Home page is public, all other pages are protected. Auth pages (sign-in, sign-up, forgot-password, reset-password) are also public.
- **D-03:** Login redirects back to the page the user was trying to access (callback URL pattern). Better Auth supports this natively.
- **D-04:** Logout redirects to the home page.
- **D-05:** Callback URL support enabled — `/sign-in?callback=/original-path` pattern.

### Password Reset Email
- **D-06:** Use Resend for production email sending. In development, log reset links to console.
- **D-07:** Dedicated `/forgot-password` page with email input form.
- **D-08:** After successful password reset, redirect to sign-in page (not auto-logged-in).

### Session & UX Behavior
- **D-09:** 7-day session duration. No "remember me" toggle — 7 days is the standard.
- **D-10:** Simple nav bar showing user email + logout button. No avatar or dropdown for now.
- **D-11:** Auth pages use a separate layout — centered card on clean background, no main nav. App layout only after login.

### Auth UI & Pages
- **D-12:** Use shadcn/ui form components (Input, Button, Card, Label) for auth forms.
- **D-13:** Four auth pages to build: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`.

### Better Auth Integration
- **D-14:** Let Better Auth manage its own auth schema tables (user, session, account, verification) via the Drizzle adapter. These are the auth source of truth.
- **D-15:** Keep the existing `users` table in `schema.ts` as the app-facing user entity. Sync between Better Auth's user table and the app `users` table via Better Auth hooks/events (e.g., on user create). Update FK references from other tables to reference whichever table becomes canonical.

### OpenCode's Discretion
- Exact middleware matcher route pattern configuration
- Which shadcn/ui components to install per-need
- Auth page route naming convention (`/auth/sign-in` vs `/sign-in`)
- Better Auth server-side configuration file structure and location
- Email template customization for password reset emails
- Password complexity/validation policy
- Error message styling and content
- Form validation implementation details
- Loading state and submitting state UX

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Project context, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03 requirements with acceptance criteria
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria (5 items), dependency on Phase 1

### Prior Context
- `.planning/phases/01-foundation-data-model/01-CONTEXT.md` — Prior decisions (D-01 through D-04) including Turso dev setup, schema organization

### Research & Stack
- `.planning/research/SUMMARY.md` — Research synthesis with tech stack decisions
- `.planning/research/STACK.md` — Technology stack with versions and rationale
- `.planning/research/ARCHITECTURE.md` — Architecture patterns and build order

### Existing Codebase
- `src/lib/db/schema.ts` — Existing `users` table schema definition and all FK references
- `src/lib/db/client.ts` — Database client singleton (Turso/Drizzle)
- `src/app/layout.tsx` — Root layout, will need auth-provider wrapper
- `src/app/page.tsx` — Current landing page (public)
- `package.json` — Better Auth dependency already installed (v1.6.20)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **better-auth** (v1.6.20) + **@better-auth/cli** (v1.4.21) — Already in dependencies, needs configuration
- **Turso db client** (`src/lib/db/client.ts`) — Existing Drizzle client ready for Better Auth Drizzle adapter
- **Drizzle ORM** — Schema definitions in `src/lib/db/schema.ts`, migrations in `src/lib/db/migrations/`
- **Tailwind CSS v4** — Already configured, shadcn/ui compatible
- **shadcn/ui** — Available for per-need component installation (per Phase 1 decision)

### Established Patterns
- **Next.js App Router** — Server Components, Server Actions pattern
- **DAL pattern** — `lib/dal/queries/` for reads, `lib/dal/commands/` for writes
- **Local SQLite dev / Turso remote prod** — Pattern established in Phase 1 (D-03)

### Integration Points
- **Root layout** (`src/app/layout.tsx`) — Will need `<SessionProvider>` or equivalent auth context wrapper
- **Database schema** (`src/lib/db/schema.ts`) — `users` table needs reconciliation with Better Auth's auth tables
- **Middleware** (`src/middleware.ts`) — Needs to be created for route protection
- **Environment variables** — Better Auth secrets and Resend API key need to be added to `.env.local` and `.env.example`

### Creative Options
- Better Auth's Drizzle adapter works natively with Turso SQLite — no special config needed beyond the adapter setup
- Better Auth provides built-in UI components or server-side handlers; both approaches are viable
- Resend has a native Better Auth adapter simplifying email integration

</code_context>

<specifics>
## Specific Ideas

- "I want it to feel simple — no frills, just works"
- Password reset flow should be standard: email link → new password → back to sign-in
- Public landing page should hint at what the app does (study planning) before asking to sign up

</specifics>

<deferred>
## Deferred Ideas

- OAuth/social login providers — not needed for v1 (per PROJECT.md constraint: email/password only)
- User profile/settings page — related but belongs in its own future phase
- Avatar/Gravatar support — not needed with simple email + logout approach
- "Remember me" toggle — not needed with fixed 7-day session

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-06-22*
