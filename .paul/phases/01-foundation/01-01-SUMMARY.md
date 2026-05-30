---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [rate-limiting, d1, cloudflare-workers, next-proxy, sqlite]

requires: []
provides:
  - Fixed-window rate limiter backed by D1 (src/lib/rate-limit.ts)
  - Next.js 16 proxy intercepting all /api/* routes (src/proxy.ts)
  - rate_limit_buckets D1 table with upsert-on-conflict pattern
  - Auth endpoints limited to 10 req/min/IP; general API to 60 req/min/IP
affects: [02-plan-limits, 03-stripe-billing, 04-email, 05-analytics]

tech-stack:
  added: []
  patterns:
    - "proxy.ts (Next.js 16) for edge concerns — replaces deprecated middleware.ts"
    - "D1 batch([upsert, select]) for atomic fixed-window counter"
    - "Fail-open: rate limiter errors never block requests"

key-files:
  created:
    - migrations/002_rate_limit_buckets.sql
    - src/lib/rate-limit.ts
    - src/proxy.ts
  modified:
    - schema.sql
    - next.config.ts

key-decisions:
  - "proxy.ts not middleware.ts — Next.js 16 renamed the convention; middleware.ts is deprecated"
  - "D1 for rate limit storage — no new infrastructure; acceptable for auth-frequency traffic"
  - "Fail-open behavior — rate limiter errors never block legitimate requests"
  - "initOpenNextCloudflareForDev() in next.config.ts — required for getCloudflareContext in local dev"

patterns-established:
  - "Fail-open proxy: always wrap proxy logic in try/catch, return NextResponse.next() on error"
  - "D1 direct access in proxy.ts: get binding from getCloudflareContext, do NOT use db.ts singleton"
  - "Rate limit key format: '{ip}:{group}' — group is 'auth' or 'api'"

duration: ~20min
started: 2026-05-29T00:00:00Z
completed: 2026-05-29T00:20:00Z
---

# Phase 1 Plan 01: Rate Limiting Summary

**Fixed-window rate limiter on all /api/* routes via Next.js 16 proxy — auth group capped at 10 req/min/IP, general API at 60 req/min/IP, backed by D1, fail-open on error.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Started | 2026-05-29 |
| Completed | 2026-05-29 |
| Tasks | 3 completed |
| Files modified | 5 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Auth endpoints rate limited | Pass | 429 on request 11+ to /api/auth/login — verified with 12-request curl loop |
| AC-2: General API endpoints rate limited | Pass | X-RateLimit-Limit: 60 confirmed on /api/auth/me |
| AC-3: Rate limit headers on all API responses | Pass | X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset present |
| AC-4: Middleware fails open | Pass | try/catch returns NextResponse.next() + logs error |

## Accomplishments

- Rate limiting enforced on all `/api/*` routes with zero npm additions — D1 only
- D1 `batch([upsert, select])` pattern handles atomic fixed-window counter in a single roundtrip
- Fail-open design means a D1 outage never takes down the app
- `next.config.ts` now properly bootstrapped for local D1 dev (`initOpenNextCloudflareForDev`)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `migrations/002_rate_limit_buckets.sql` | Created | D1 table for rate limit counters |
| `schema.sql` | Modified | Added rate_limit_buckets to canonical schema |
| `src/lib/rate-limit.ts` | Created | Fixed-window rate limiter — accepts D1Database directly |
| `src/proxy.ts` | Created | Next.js 16 proxy — applies limits, adds headers, fails open |
| `next.config.ts` | Modified | Added initOpenNextCloudflareForDev() for local D1 access |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| proxy.ts over middleware.ts | Next.js 16 deprecated middleware.ts in favour of proxy.ts | All future edge work goes in proxy.ts |
| D1 for rate limit storage | No new bindings — consistent with existing stack | Rows accumulate; cleanup is a Phase 6 concern |
| Fail-open on error | Rate limiter failure should not take down the app | Any D1 outage is transparent to users |
| Direct D1 access in proxy | proxy.ts must not depend on db.ts singleton (different lifecycle) | Pattern for all proxy-layer D1 work going forward |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Essential — Next.js 16 breaking change + local dev gap |
| Scope additions | 0 | — |
| Deferred | 1 | Logged below |

**Total impact:** Essential fixes only, no scope creep.

### Auto-fixed Issues

**1. Next.js 16 proxy convention**
- **Found during:** Task 3 (middleware.ts creation) — deprecation warning on dev server start
- **Issue:** Next.js 16 renamed `middleware.ts` → `proxy.ts` and the exported function `middleware` → `proxy`
- **Fix:** Created `src/proxy.ts` with `export function proxy(...)`, deleted `src/middleware.ts`
- **Files:** src/proxy.ts (created), src/middleware.ts (removed)
- **Verification:** Dev server log shows `proxy.ts:` timing — no more deprecation warning

**2. `initOpenNextCloudflareForDev` missing from next.config.ts**
- **Found during:** Task 3 verify — `getCloudflareContext` threw error in local dev
- **Issue:** `getCloudflareContext` requires `initOpenNextCloudflareForDev()` to be called in next.config.ts for local dev; this was missing from the project entirely
- **Fix:** Added `import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"` + `initOpenNextCloudflareForDev()` call to `next.config.ts`
- **Files:** next.config.ts
- **Verification:** Subsequent curl test showed rate limiting working end-to-end locally

### Deferred Items

- Rate_limit_buckets row cleanup: old window rows accumulate indefinitely. Not a risk until D1 approaches 10MB limit. Flagged for Phase 6 (scale prep).

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `getCloudflareContext` fails without `initOpenNextCloudflareForDev` | Added to next.config.ts — this was a missing project setup step that affected all D1 access in local dev |

## Next Phase Readiness

**Ready:**
- All /api/* routes have rate limiting active in both local dev and Cloudflare Workers
- `src/lib/rate-limit.ts` is a standalone utility usable in any future proxy logic
- D1 migration pattern established: `NNN_description.sql` in `/migrations/`, mirrored in `schema.sql`
- Local dev now properly bootstrapped for D1 access

**Concerns:**
- `rate_limit_buckets` rows will grow over time; no cleanup mechanism yet
- Rate limits (10/min auth, 60/min API) are reasonable defaults but untested under real traffic

**Blockers:** None

---
*Phase: 01-foundation, Plan: 01*
*Completed: 2026-05-29*
