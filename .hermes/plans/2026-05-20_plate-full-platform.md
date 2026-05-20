# Plate by RomeDigital — Full Platform Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement this plan phase-by-phase.

**Goal:** Full SaaS platform — users sign up, build QR menus, customers scan. Plus super admin dashboard for Marcus.

**Architecture:** Next.js 16 + TypeScript + Supabase PostgreSQL, deployed to Cloudflare Pages (`plate-qr-menu`). Separate from bio-romedigital.tech — independent project, independent Supabase project.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, Supabase (auth + DB), Cloudflare Pages

---

## Supabase Schema

```sql
-- Users table (extends Supabase auth with restaurant data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  restaurant_name TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions (DIY — same pattern as bio-romedigital)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menus
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  theme TEXT NOT NULL DEFAULT 'warm' CHECK (theme IN ('warm', 'dark', 'light', 'modern')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Menu Categories
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Phase 1: Scaffold + Auth (MVP foundation)

### Task 1: Create Next.js project
- `npx create-next-app@latest plate-dashboard` — TypeScript, Tailwind, App Router
- Initialize git, connect to `MJB129/plate-qr-menu`
- Create `~/plate-dashboard/` directory

### Task 2: Supabase client setup
- Create `src/lib/supabase.ts` — anon + service_role clients (lazy getters)
- Create `src/lib/auth.ts` — session management, password hashing
- Create `src/lib/db.ts` — SQL-to-Supabase adapter (reuse from bio, stripped down)
- Create `.env.local` with Supabase URL + keys

### Task 3: Supabase schema
- Run the full schema SQL in Supabase SQL Editor
- Verify all tables exist via REST API

### Task 4: Auth pages
- `/register` — signup form (name, restaurant name, email, password)
- `/auth` — login (email + password)
- API: `POST /api/auth/register` — create user + session
- API: `POST /api/auth/login` — verify password + create session
- API: `GET /api/auth/me` — get current user from cookie

### Task 5: Middleware + protected routes
- `middleware.ts` — protect `/dashboard/*`, `/admin/*`
- Redirect to `/auth` if no session

### Task 6: Dashboard shell
- `src/app/(dashboard)/layout.tsx` — sidebar nav
- `src/app/(dashboard)/dashboard/page.tsx` — overview (welcome, stats placeholder)
- Restaurant-themed UI (cream/terracotta/olive)

### Task 7: Deploy Phase 1
- Build + deploy to Cloudflare Pages
- Wire `app.plate-rome.digital` or similar subdomain
- Test registration + login flow end-to-end

---

## Phase 2: Menu Builder

### Task 8: Menu CRUD API
- `POST /api/menus` — create menu
- `GET /api/menus` — list user's menus
- `GET /api/menus/[id]` — get single menu
- `PUT /api/menus/[id]` — update (name, theme, publish)
- `DELETE /api/menus/[id]` — delete

### Task 9: Category CRUD API
- `POST /api/menus/[id]/categories`
- `PUT /api/categories/[id]`
- `DELETE /api/categories/[id]`

### Task 10: Item CRUD API
- `POST /api/categories/[id]/items`
- `PUT /api/items/[id]`
- `DELETE /api/items/[id]`

### Task 11: Dashboard — Menus page
- List all menus with create button
- Edit button → menu editor

### Task 12: Menu editor page
- `/dashboard/menus/[id]` — full editor
- Add/remove/rename categories
- Add/remove/edit items (name, description, price, image, dietary tags)
- Drag-to-reorder (or up/down buttons)
- Publish toggle
- Live preview panel (phone mockup)

### Task 13: Deploy Phase 2

---

## Phase 3: Public QR Menu + Super Admin

### Task 14: Public menu page
- `/menu/[slug]` — renders the published menu
- Restaurant theme, mobile-first
- No auth required — this is what customers scan

### Task 15: QR code generation
- On menu publish, generate QR code → save URL
- Download button on dashboard
- `GET /api/menus/[id]/qr` — returns QR code PNG

### Task 16: Super admin dashboard
- `/admin` — only accessible to `is_admin = true`
- List all restaurants with plan, menu count, created date
- Click into any restaurant's dashboard (impersonation view)
- Stats: total restaurants, menus, plans breakdown

### Task 17: Landing page CTA wiring
- Update static `index.html` "Get Started" / "Create Your Menu" links
- Point to `/register` (the Next.js app)
- Keep landing page on `plate-qr-menu.pages.dev` or custom domain
- App on subdomain or separate path

### Task 18: Final deploy + custom domain
- Set `plate.romedigital.tech` or `plate-qr-menu.pages.dev`
- Verify full flow: land → register → dashboard → create menu → publish → scan

---

## Files Structure

```
~/plate-dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing (redirect to /register or static)
│   │   ├── layout.tsx                  # Root layout
│   │   ├── (auth)/
│   │   │   ├── auth/page.tsx           # Login
│   │   │   └── register/page.tsx       # Signup
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + nav
│   │   │   ├── dashboard/page.tsx      # Overview
│   │   │   ├── menus/page.tsx          # Menu list
│   │   │   └── menus/[id]/page.tsx     # Menu editor
│   │   ├── menu/[slug]/page.tsx        # Public QR menu
│   │   ├── admin/page.tsx              # Super admin
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   └── me/route.ts
│   │       ├── menus/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts        # GET/PUT/DELETE
│   │       │       └── qr/route.ts     # QR code
│   │       ├── categories/
│   │       │   └── [id]/route.ts       # PUT/DELETE
│   │       └── items/
│   │           └── [id]/route.ts        # PUT/DELETE
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   └── db.ts
│   └── middleware.ts
├── .env.local
├── supabase-schema.sql
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Supabase Project

**New Supabase project needed** — separate from the bio-romedigital one. The bio project uses `ghubgvptkoppijboihvx`. Create a new one for Plate.

## Risks & Notes

- Same `execute()` swallowing errors pattern as bio — must check `result.success` everywhere
- UUID ID generation — always use `crypto.randomUUID()`, never random strings
- Cloudflare Worker async termination — await ALL side effects before response
- Custom domain needs Cloudflare DNS entry (CNAME → plate-qr-menu.pages.dev)
- Landing page (static HTML) lives in `~/qr-menu/` currently — may need to coexist with Next.js app or be served separately
