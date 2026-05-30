# Plate QR Menu

## What This Is

Production hardening of the Plate QR Menu platform — an existing Next.js application where restaurant owners create and publish digital QR menus for their customers. This effort adds the operational layer: Stripe billing, plan limits enforcement, rate limiting, transactional email, and QR scan analytics, making the platform ready for paid production traffic.

## Core Value

Restaurant owners can create and publish digital QR menus for their customers.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.1.0 |
| Status | Beta |
| Last Updated | 2026-05-29 |

## Requirements

### Core Features

1. Stripe billing integration (subscriptions and plan management)
2. Plan limits enforcement (gate features by tier, upgrade prompts for free users)
3. Rate limiting (API and request protection against brute force)
4. Transactional email (welcome, payment confirmation, lifecycle notifications)
5. QR scan analytics (track scans per menu/location, visible to paid users)

### Validated (Shipped)
- [x] Staging environment isolated from production — Phase 1 partial
- [x] CSS delivery fix via `_routes.json` + edge cache workaround

### Active (In Progress)
None yet (production hardening phases not started).

### Planned (Next)

- [ ] Phase 1: Foundation — staging isolation + rate limiting
- [ ] Phase 2: Plan limits enforcement
- [ ] Phase 3: Stripe billing end-to-end
- [ ] Phase 4: Transactional email
- [ ] Phase 5: QR scan analytics
- [ ] Phase 6: Scale prep (R2 migration, performance)

### Out of Scope

- R2 migration (planned for Phase 6 scale prep, not current hardening scope)
- Mobile app
- Multi-language menu support

## Constraints

### Technical Constraints

- **Stripe webhooks:** Signature verification required on all webhook handlers
- **Webhook idempotency:** Enforced via `billing_events` unique constraint (no double-processing)
- **D1 database:** 10MB per-DB limit — R2 migration required before scale (Phase 6)
- **Cloudflare edge cache:** Can serve stale CSS after deploy — workaround required on each deploy
- **Runtime:** Cloudflare Workers via OpenNext — no Node.js-only APIs
- **Auth:** Session-based with HTTP-only cookies (no JWT, sessions stored in D1)

### Business Constraints

- No CI/CD pipeline — all deploys are manual
- Each phase must be independently shippable to production
- Staging environment must remain fully isolated from production (separate D1, separate Pages project)

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Phase-based delivery (6 phases) | Each phase independently shippable — reduces risk on a live platform | 2026-05-29 | Active |
| D1 for billing_events | Extend existing DB rather than add new service — simpler ops, bounded by 10MB limit | 2026-05-29 | Active |
| Stripe webhooks as billing source of truth | Idempotency + audit trail via billing_events table | 2026-05-29 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Stripe checkout (test mode) | End-to-end working | Not built | Not started |
| Plan limits | Free users see upgrade prompt at limit | Not built | Not started |
| Rate limiting | Brute force attempts blocked | Not built | Not started |
| Transactional email | Welcome + payment emails send | Not built | Not started |
| QR scan analytics | Scans visible in dashboard (paid users) | Not built | Not started |
| Staging isolation | Fully isolated from production | Partial | In progress |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 | App Router, Cloudflare-compatible via OpenNext |
| Frontend | React 19 + Tailwind CSS 4 | |
| Database | Cloudflare D1 (SQLite) | 10MB limit — R2 migration planned for scale |
| Hosting | Cloudflare Pages + OpenNext | Workers runtime — no Node.js-only APIs |
| Auth | Session-based + HTTP-only cookies | Sessions stored in D1 |
| Payments | Stripe | Webhooks with signature verification |
| Email | To be defined during /paul:plan | |
| File storage | Cloudflare R2 (planned) | Migration from D1 blobs in Phase 6 |

## Data Model

**Existing:** `users`, `sessions`, `menus`, `menu_categories`, `menu_items`

**New (this effort):**
- `users.stripe_customer_id` — Stripe customer reference
- `users.stripe_subscription_id` — active subscription reference
- `billing_events` — webhook audit log with unique constraint for idempotency

## Links

| Resource | URL |
|----------|-----|
| Repository | /home/marcus/plate-dashboard |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-05-29*
