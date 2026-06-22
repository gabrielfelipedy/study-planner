# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 02-authentication
**Areas discussed:** Protected Routes Strategy, Password Reset Email, Session & UX Behavior, Auth UI & Pages, Better Auth Integration

---

## Protected Routes Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Middleware only | Define protected route patterns in middleware.ts. Better Auth middleware handles redirect. | ✓ |
| Per-page auth() | Each page calls auth() to get user. Public by default — opt into protection. | |
| Hybrid approach | Middleware for broad protection, per-page auth() for specific pages. | |

**User's choice:** Middleware only

| Option | Description | Selected |
|--------|-------------|----------|
| Protect everything except /sign-in and /sign-up | Simple rule: auth pages only public. | |
| Home page public, everything else protected | Landing page public, app functionality locked behind login. | ✓ |

**User's choice:** Home page public, everything else protected

| Option | Description | Selected |
|--------|-------------|----------|
| Login → home, Logout → home | Simple redirects for both. | |
| Login → dashboard, Logout → home | Login goes straight to study plans. | |
| Login → previous page, Logout → home | Redirect back to where the user was. | ✓ |

**User's choice:** Login → previous page, Logout → home

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — redirect back to original page | Callback URL support for bookmarking. | ✓ |
| No — always go to home page | Simpler, loses navigation state. | |

**User's choice:** Yes — callback URL pattern

---

## Password Reset Email

| Option | Description | Selected |
|--------|-------------|----------|
| Resend in prod, console log in dev | API key only for prod, console link in dev. | ✓ |
| Resend for both dev and prod | Requires Resend account from day one. | |
| SMTP in prod, console in dev | Provider-agnostic but more config. | |

**User's choice:** Resend in prod, console log in dev

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated /forgot-password page | Full page with email input. Standard pattern. | ✓ |
| Link on sign-in page opens inline form | Compact form on sign-in page. | |

**User's choice:** Dedicated /forgot-password page

| Option | Description | Selected |
|--------|-------------|----------|
| Back to sign-in page | Standard flow: password reset → sign in with new password. | ✓ |
| Auto-redirect to home (logged in) | Fewer steps, auto-auth after reset. | |

**User's choice:** Back to sign-in page

---

## Session & UX Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 7 days | Standard web app session. | ✓ |
| 30 days | Longer convenience for personal tool. | |
| Until browser close + remember me | Flexible, common pattern. | |

**User's choice:** 7 days

| Option | Description | Selected |
|--------|-------------|----------|
| Simple nav bar with email + logout | Shows email and Logout button. | ✓ |
| Avatar + dropdown menu | Circular avatar with dropdown: email, settings, logout. | |
| Minimal — just logout link | Only a Logout link in footer or sidebar. | |

**User's choice:** Simple nav bar with email + logout button

| Option | Description | Selected |
|--------|-------------|----------|
| Separate auth layout — centered card | Centered card on clean background, no nav. | ✓ |
| Same layout as the app | Auth pages use same shell (nav, footer). | |

**User's choice:** Separate auth layout — centered card

---

## Auth UI & Pages

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui form components | Use Input, Button, Card, Label from shadcn/ui. | ✓ |
| Simple HTML forms with Tailwind | Plain form elements with Tailwind classes. | |

**User's choice:** shadcn/ui form components

| Option | Description | Selected |
|--------|-------------|----------|
| Sign-in, Sign-up, Forgot-password, Reset-password | Full set of 4 pages. | ✓ |
| Sign-in + Sign-up only (defer password reset UI) | Core pages only, reset via server links. | |

**User's choice:** Full set of 4 pages

---

## Better Auth Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Let Better Auth manage auth tables | Better Auth creates its own schema tables via Drizzle adapter. | ✓ |
| Customize Better Auth to use existing users table | Extend Better Auth to work with existing `users` schema. | |

**User's choice:** Let Better Auth manage auth tables

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing table + sync | Keep `users` table as app-facing entity, sync via hooks. | ✓ |
| Use Better Auth's user table directly | Let Better Auth's `user` table be canonical, update FK refs. | |

**User's choice:** Keep existing table + sync via Better Auth hooks/events

---

## OpenCode's Discretion

- Middleware matcher route pattern
- shadcn/ui component selection per-need
- Auth page route naming convention (`/auth/sign-in` vs `/sign-in`)
- Better Auth server config file structure and location
- Email template customization
- Password complexity/validation policy
- Error message styling and content
- Form validation implementation details
- Loading state and submitting state UX

## Deferred Ideas

- OAuth/social login — not needed for v1 (per PROJECT.md constraint)
- User profile/settings page — future phase
- Avatar/Gravatar support — not needed with simple approach
- "Remember me" toggle — not needed with fixed 7-day session

---

*Phase: 02-authentication*
*Discussion log generated: 2026-06-22*
