# Roadmap: Plate QR Menu

## Overview

Production hardening of an existing QR menu platform across six independently shippable phases: foundation + rate limiting, plan limits, Stripe billing, transactional email, QR scan analytics, and scale prep. Each phase adds a distinct operational capability without breaking the running application.

## Current Milestone

**v1.0 Production Ready**
Status: In progress
Phases: 0 of 6 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Foundation | 2 | Planning | - |
| 2 | Plan Limits | 2 | Planning | - |
| 3 | Stripe Billing | TBD | Not started | - |
| 4 | Transactional Email | TBD | Not started | - |
| 5 | QR Scan Analytics | TBD | Not started | - |
| 6 | Scale Prep | TBD | Not started | - |

## Phase Details

### Phase 1: Foundation

**Goal:** Staging environment fully isolated from production + rate limiting protecting all auth and API endpoints
**Depends on:** Nothing (first phase)
**Research:** Unlikely (rate limiting patterns well-established on Cloudflare Workers)

**Scope:**
- Staging env isolation confirmed (separate D1, separate Pages project)
- Rate limiting middleware on auth endpoints (login, register, password reset)
- Rate limiting on API routes
- Edge cache invalidation strategy on deploy

**Plans:**
- [ ] 01-01: Rate limiting infrastructure + middleware
- [ ] 01-02: Staging isolation verification + edge cache strategy

### Phase 2: Plan Limits

**Goal:** Free vs paid tier enforcement — users hitting limits see upgrade prompts, paid features gated
**Depends on:** Phase 1 (stable foundation)
**Research:** Unlikely (feature flag / limit check patterns)

**Scope:**
- Plan tier definitions (free vs paid limits)
- Limit check middleware/hooks
- Upgrade prompt UI for free users at limit
- Plan status readable from session

**Plans:**
- [ ] 02-01: Plan limits utility + API enforcement
- [ ] 02-02: Page action enforcement + upgrade prompt UI

### Phase 3: Stripe Billing

**Goal:** Stripe checkout works end-to-end in test mode — subscribe, upgrade, cancel, webhook processing
**Depends on:** Phase 2 (plan limits must exist before billing can enforce them)
**Research:** Likely (Stripe API + Cloudflare Workers webhook handling)
**Research topics:** Stripe Checkout vs Payment Links for Cloudflare Workers; webhook signature verification in edge runtime

**Scope:**
- Stripe customer creation on signup
- Checkout session for plan upgrade
- Webhook handler with signature verification + idempotency
- `billing_events` table audit log
- `users.stripe_customer_id` + `users.stripe_subscription_id` columns

**Plans:**
- [ ] 03-01: To be defined during /paul:plan

### Phase 4: Transactional Email

**Goal:** Welcome and payment confirmation emails send reliably
**Depends on:** Phase 3 (payment events trigger emails)
**Research:** Likely (email provider selection + Cloudflare Workers compatibility)
**Research topics:** Email providers compatible with Workers runtime (Resend, Postmark, SendGrid); DKIM/SPF setup

**Scope:**
- Email provider integration
- Welcome email on signup
- Payment confirmation email on successful subscription
- Email template system

**Plans:**
- [ ] 04-01: To be defined during /paul:plan

### Phase 5: QR Scan Analytics

**Goal:** QR scan events tracked and visible in dashboard for paid users
**Depends on:** Phase 2 (analytics gated to paid plan)
**Research:** Likely (analytics write path — D1 at scale, possible Cloudflare Analytics Engine)
**Research topics:** D1 write volume limits for scan events; Cloudflare Analytics Engine as alternative

**Scope:**
- Scan event capture on QR code load
- Analytics storage (D1 or Analytics Engine)
- Dashboard UI for paid users showing scan counts
- Plan gate enforcing analytics access

**Plans:**
- [ ] 05-01: To be defined during /paul:plan

### Phase 6: Scale Prep

**Goal:** Platform ready for production traffic growth — D1 size risk mitigated, performance validated
**Depends on:** Phases 1-5 complete
**Research:** Likely (R2 migration strategy, D1 limits at scale)
**Research topics:** D1 10MB limit mitigation; R2 for asset/blob storage; load testing on Cloudflare Workers

**Scope:**
- R2 migration for binary/blob data from D1
- D1 size audit and cleanup
- Performance profiling of critical paths
- Deploy process documentation (no CI/CD)

**Plans:**
- [ ] 06-01: To be defined during /paul:plan

---
*Roadmap created: 2026-05-29*
*Last updated: 2026-05-29*
