# Stack Research

**Domain:** Study Planner Web App (Next.js + Turso + Vercel)
**Researched:** 2026-06-22
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.9 LTS | Full-stack React framework | Current LTS (released Oct 2025). App Router, Server Components, Server Actions, Turbopack stable. Next.js 15 reaches EOL Oct 2026 — starting on 16 avoids a migration within months. Vercel-first deployment, zero-config on their platform. |
| TypeScript | 5.x | Type safety | Non-negotiable for a new Next.js project. Next.js ships with built-in TS support, `next.config.ts` is now the default. |
| Turso (via @libsql/client) | 0.17.4 | Edge-hosted SQLite database | User-specified. SQLite-compatible, HTTP-based (no cold starts on Vercel serverless), 9GB free tier, 1B reads/month free. Local development uses a local SQLite file; production switches to Turso URL seamlessly. |
| Drizzle ORM | 0.45.2 | Type-safe SQL ORM | Best ORM for Turso/SQLite. Native `drizzle-orm/libsql` driver, ~7.4kb min+gzipped, tree-shakeable, zero-dependency. Generates plain SQL for migrations — you see exactly what runs. Far lighter than Prisma (22MB vs ~50KB) and doesn't fight Turso's HTTP-based architecture. |
| Better Auth | 1.6.19 | Authentication framework | The clear 2026 winner for self-hosted auth. Native Drizzle adapter with SQLite support, built-in email/password, cookie-based sessions, fully type-safe. 4.2M weekly downloads, active maintenance (123 releases). Auth.js (NextAuth) is legacy — its maintainers now point to Better Auth. |
| Tailwind CSS | v4 | Utility-first CSS | CSS-first config (`@theme` in `globals.css` replaces `tailwind.config.js`), 8x faster incremental builds, OKLCH color space, PostCSS plugin. Standard for all new Next.js projects in 2026. |
| shadcn/ui | latest | Copy-paste component library | Default UI kit for Next.js + Tailwind v4. Not an npm package — components are copied into your project, fully owned and customizable. Radix UI primitives for accessibility. Includes Calendar, Date Picker, Chart (with Recharts) blocks. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.4.0 | Date manipulation | Default choice for a study planner that needs date math (7d/30d revision windows, deadline calculations). shadcn/ui's Date Picker uses date-fns for formatting, and many community shadcn extensions depend on it. Using dayjs risks pulling in both libraries if you later add date-fns-dependent components. date-fns is functional (no mutation), tree-shakeable, has 200+ functions, and 87M weekly downloads. Use for formatting timestamps, calculating revision intervals, scheduling math. |
| Recharts | 3.x | Charts and data viz | 48M+ weekly npm downloads, React-native composable API, SVG-based (SSR compatible). shadcn/ui's chart blocks are built on Recharts. Use for progress charts, topic completion visualization, study time analytics. |
| react-day-picker | 9.13.0 | Calendar date picker | Underlying engine for shadcn/ui's Calendar component. Provides month/year navigation, range selection, localization. The in-app study calendar view can be built on top of this. |
| lucide-react | latest | Icons | Used by shadcn/ui by default. Clean, consistent SVG icon set. Use for UI icons throughout the app. |
| clsx + tailwind-merge | latest | Class merging | `cn()` utility used by shadcn/ui. Essential for conditional class composition. |
| zod | 4.x | Schema validation | Validate user input (subject names, deadlines, study session data). Works well with Server Actions for form validation. Also used by Better Auth internally. |
| @libsql/client | 0.17.4 | Turso database driver | Primary database client. Create a wrapper in `lib/db.ts` that uses a local SQLite file in dev (`file:./local.db`) and Turso remote in production (`libsql://...` + auth token). |
| drizzle-orm/libsql | 0.45.2 | Drizzle + libSQL adapter | Import `drizzle-orm/libsql` to connect Drizzle to `@libsql/client`. Schema-driven, type-safe queries with SQL-like syntax. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| drizzle-kit | DB schema migrations | Generates plain SQL migration files. Run `drizzle-kit generate` then `drizzle-kit migrate` for local dev. For Turso: run `turso db shell <db> < migration.sql` to apply. |
| Turso CLI | Turso DB management | `turso db create`, `turso db shell`, `turso db tokens create`. Required for setup and production migrations. Install via `brew install tursodatabase/tap/turso` or `curl -sSfL https://get.tur.so/install.sh \| bash`. |
| ESLint + Prettier | Code quality | Next.js ships with ESLint config. Add Prettier for consistent formatting. |
| @next/codemod | Version upgrades | Official upgrade CLI. Run `npx @next/codemod@canary upgrade latest` when upgrading Next.js versions. |

## Installation

```bash
# Create Next.js project (App Router, TypeScript, Tailwind, src directory)
npx create-next-app@latest study-planner --typescript --tailwind --app --src-dir
cd study-planner

# Core database
npm install @libsql/client drizzle-orm
npm install -D drizzle-kit

# Authentication
npm install better-auth @better-auth/cli
npx @better-auth/cli init  # sets up Drizzle adapter

# UI
npx shadcn@latest init
npx shadcn@latest add calendar chart button card input form dialog

# Date handling + validation
npm install date-fns zod

# Utilities (bundled by shadcn but ensure they're installed)
npm install clsx tailwind-merge lucide-react
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Better Auth** | Auth.js (NextAuth) v5 | Only if you need 60+ OAuth providers out of the box. Auth.js has a larger provider ecosystem but worse DX, no built-in RBAC, and its own maintainers now point users to Better Auth. For email/password only (this project), Better Auth is strictly superior. |
| **Drizzle ORM** | Prisma 7.8.0 | Choose Prisma if your team already knows it and you accept: (1) Prisma migrations don't work over HTTP with Turso — you must use `prisma migrate diff` + Turso CLI, (2) 22MB bundle vs Drizzle's ~50KB, (3) slower build times. For a greenfield project with Turso, Drizzle is the right call. |
| **date-fns** | dayjs 1.11.x | Choose dayjs if you're certain you won't use shadcn/ui's calendar component. If you do, date-fns gets pulled in anyway and you pay for two date libraries. Since this project needs an in-app calendar, date-fns is the pragmatic choice. |
| **Recharts** | Apache ECharts | Choose ECharts if you need >10K data points per chart, exotic chart types (heatmap, sankey, geo), or Canvas rendering. For a study planner with basic bar/line/pie charts, Recharts' React-native API and SVG rendering are more than sufficient and easier to maintain. |
| **Tailwind CSS v4** | CSS Modules / Styled Components | CSS Modules work but lack the design system consistency. Styled Components adds runtime cost. Tailwind v4 + shadcn/ui is the dominant 2026 stack and has the best tooling. |
| **shadcn/ui** | Radix UI (raw) | Use raw Radix if you need extreme customization shadcn doesn't support. But shadcn already wraps Radix — you can always eject individual components. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js 15** | Reaches EOL October 2026. Starting a greenfield project on a version that'll be unsupported in 4 months is wasteful. Next.js 16 has Turbopack stable, Cache Components, better caching APIs. | Next.js 16.2.9 LTS |
| **Pages Router** | Deprecated in Next.js 14, removed in 16. All new features target App Router. | App Router (`app/` directory) |
| **Prisma (with Turso)** | Migrations break over HTTP. Prisma 7.8.0 requires `@prisma/adapter-libsql` which adds complexity. Migrations require manual `prisma migrate diff` + Turso CLI shell. Drizzle handles this natively. | Drizzle ORM 0.45.2 |
| **Auth.js v5** | v5 migration was painful, ecosystem fragmented, maintainers now recommend Better Auth. Email/password in Auth.js requires writing credential provider boilerplate. Better Auth handles it in 3 lines. | Better Auth 1.6.19 |
| **Clerk** | Hosted auth service = vendor lock-in. Your user data lives in Clerk's US-only database. Free tier caps at 50K MAU, then gets expensive. For a personal app, self-hosted auth on your own Turso DB is free and portable. | Better Auth (self-hosted) |
| **Moment.js** | Officially deprecated. Large bundle (4.35MB), mutable API, no tree-shaking. | date-fns or dayjs |
| **JWT for sessions** | Better Auth's cookie-based sessions handle all the edge cases you'd otherwise have to build (refresh, rotation, CSRF). Rolling your own JWT auth is a security footgun in production. | Better Auth's built-in session management |
| **Prisma Studio / Drizzle Studio in production** | Database GUIs should never be accessible in production. Use them locally only. | Turso CLI (`turso db shell`) for production queries |
| **React Context for global state** | Study planner data is server-fetched and doesn't need a global state manager. Server Components + URL params handle 95% of state needs. | Server Components + server-side data fetching |

## Stack Patterns by Variant

**If deploying with Vercel:**
- Use Vercel's `@vercel/postgres`-style env vars — no special config needed for Turso
- Server Actions + Server Components handle all data fetching (no separate API routes needed for most operations)
- Use Vercel's Edge Config or KV only if you need caching — the app's data volume is small enough that direct DB queries are fine

**If developing locally:**
- Use a local SQLite file (`file:./data/dev.db`) for development
- Schema: run `drizzle-kit generate` then `drizzle-kit migrate` against local file
- Turso connection only needed in production (Vercel) and for applying migrations to Turso

**If the app grows beyond single-user:**
- Better Auth already supports multi-session and basic RBAC — no migration needed
- The session model stays the same
- Only the data model (adding `user_id` foreign keys) needs changes

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@16.2.9 | react@19.2, react-dom@19.2 | React 19 is required by Next.js 16. Use `latest` tags for both. |
| next@16.2.9 | @libsql/client@0.17.4 | HTTP-based, no native dependency issues on Vercel serverless. |
| better-auth@1.6.19 | drizzle-orm@0.45.2 | Use `better-auth/adapters/drizzle` adapter with `provider: "sqlite"`. |
| better-auth@1.6.19 | @libsql/client@0.17.4 | Better Auth uses the Drizzle adapter, which uses the libSQL client. No direct dependency. |
| drizzle-orm@0.45.2 | @libsql/client@0.17.4 | Native via `drizzle-orm/libsql` import path. |
| date-fns@4.4.0 | react-day-picker@9.13.0 | react-day-picker does NOT directly depend on date-fns, but shadcn/ui's calendar uses date-fns for formatting. Install both. |
| tailwindcss@4 | @tailwindcss/postcss@4 | PostCSS plugin is required. Not included in core v4 package. |
| shadcn/ui latest | tailwindcss@4 | shadcn now defaults to Tailwind v4. Run `npx shadcn@latest init` which auto-detects v4 and configures `@theme` correctly. |

## Sources

- Next.js 16 release blog: https://nextjs.org/blog/next-16 — confirmed LTS, features, React 19.2 support
- Next.js npm: https://www.npmjs.com/package/next — v16.2.9 latest, published 2026-06-09
- Turbo repo: https://eosl.date/eol/product/nextjs — Next.js 15 EOL Oct 2026, 16 is current LTS
- Drizzle ORM docs: https://orm.drizzle.team/docs/tutorials/drizzle-with-turso — confirmed native libSQL support
- Drizzle npm: https://www.npmjs.com/package/drizzle-orm — v0.45.2, ~7.4kb gzipped, 0 dependencies
- Prisma + Turso docs: https://www.prisma.io/docs/orm/core-concepts/supported-databases/sqlite — adapter exists but migration complexity noted
- Better Auth npm: https://www.npmjs.com/package/better-auth — v1.6.19, 4.3M weekly downloads, MIT
- Better Auth + Drizzle docs: https://better-auth.com/docs/integrations/drizzle — SQLite adapter confirmed
- Turso / libSQL docs: https://docs.turso.tech/sdk/ts/guides/nextjs — official integration guide, @libsql/client 0.17.4
- shadcn/ui changelog: https://ui.shadcn.com/docs/changelog — Tailwind v4 support, June 2026 registry features
- Tailwind v4 + shadcn migration guide: https://ui.shadcn.com/docs/tailwind-v4 — OKLCH colors, CSS-first config
- Recharts npm: https://www.npmjs.com/package/recharts — v3.x required (v1/v2 deprecated), 48M weekly downloads
- LogRocket chart comparison: https://blog.logrocket.com/best-react-chart-libraries-2026/ — updated June 2026, Recharts leads for React dashboards
- date-fns npm: https://www.npmjs.com/package/date-fns — v4.4.0, 87M weekly downloads, tree-shakeable
- react-day-picker: https://www.npmjs.com/package/react-day-picker — v9.13.0, shadcn/ui's calendar dependency
- Better Auth vs Auth.js: https://www.wisp.blog/blog/authjs-vs-betterauth-for-nextjs-a-comprehensive-comparison — published March 2025, confirms Better Auth superiority for email/password
- Auth.js homepage: https://next-auth.js.org/ — now redirects to Better Auth ("NextAuth.js is now part of Better Auth")
- Comparison analysis: https://solodevstack.com/blog/turso-vs-prisma-solo-developers — Turso + Drizzle recommended over Prisma for edge SQLite
- Starter template: https://github.com/joaquinponzone/starter-2025 — Next.js 15 + Drizzle + Turso + shadcn reference

---

*Stack research for: Study Planner Web App (Next.js + Turso + Vercel)*
*Researched: 2026-06-22*
