---
phase: 02
slug: authentication
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-22
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser ↔ Next.js | User submits credentials via auth forms | Email, password (plaintext in transit, HTTPS) |
| Next.js ↔ Better Auth | Server validates credentials via Better Auth API | Hashed password, session tokens |
| Better Auth ↔ SQLite DB | Auth tables (user, session, account, verification) | Email, hashed password, session tokens |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Spoofing | Sign-up | mitigate | Email verification configured — `emailVerification.sendOnSignUp: true` with console logging in dev, Resend in prod | closed |
| T-02-02 | Tampering | Session tokens | mitigate | Better Auth signed JWTs with server-side session table validation | closed |
| T-02-03 | Repudiation | User records | mitigate | `created_at` timestamps on user and account database tables | closed |
| T-02-04 | Information Disclosure | Forgot password | mitigate | Generic response — "If an account exists..." regardless of email validity | closed |
| T-02-05 | Denial of Service | Auth endpoints | accept | Vercel platform provides edge DDoS protection; explicit rate limiting deferred as personal app with low traffic profile | closed |
| T-02-06 | Elevation of Privilege | Protected routes | mitigate | Session cookie check in middleware + full session validation at Better Auth API layer | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-02-01 | T-02-05 | No explicit rate limiting on auth endpoints. Vercel's edge network provides baseline DDoS protection. Personal-use app with expected low traffic. If usage grows, add rate limiting via middleware or Vercel WAF rules. | automatic | 2026-06-22 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-22 | 6 | 6 | 0 | orchestrator |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-22
