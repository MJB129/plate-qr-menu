# Plate QR Menu — RomeDigital

**Live:** [plate.romedigital.tech](https://plate.romedigital.tech)  
**Status:** Production  
**Stack:** Next.js 16 + React 19 + Cloudflare Pages + D1 (SQLite)  
**Repository:** `git@github.com:MJB129/plate-qr-menu.git`

A digital QR code menu platform for restaurants. Restaurant owners can create, manage, and publish digital menus with categories, items, descriptions, and pricing — all served via QR codes at their tables.

---

## Features

### Restaurant Dashboard
- **Menu Management** — Create, edit, publish/unpublish multiple menus per restaurant
- **Category System** — Organize items into categories within each menu (Appetizers, Mains, Drinks, etc.)
- **Item Management** — Add items with name, description, price, and image
- **Image Upload** — Item images stored as base64 data URLs in D1 (no external storage needed)
- **Live Preview** — Published menus render as a clean customer-facing view

### Authentication
- **Email/Password Login** — Secure session-based auth with bcrypt password hashing
- **Registration** — New restaurant signup with free tier
- **Session Management** — Token-based sessions stored in D1

### Admin Panel
- **User Management** — View, promote, downgrade, or delete users
- **Plan Tiers** — Free, Starter ($15/mo), Pro ($25/mo), Enterprise ($75/mo)
- **Platform Stats** — User counts by plan, total menus, published menus

### Security
- HTTP-only session cookies
- Password hashing via Web Crypto API (PBKDF2 + SHA-256)
- Input sanitization
- Admin-only routes protected by middleware

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 + Lucide Icons |
| Runtime | Cloudflare Pages (via OpenNext) |
| Database | Cloudflare D1 (SQLite-compatible) |
| Build | OpenNext Cloudflare adapter |

---

## Project Structure

```
plate-dashboard/
├── src/
│   └── app/
│       ├── (auth)/           # Login & register pages
│       │   ├── auth/page.tsx
│       │   └── register/page.tsx
│       ├── (dashboard)/      # Dashboard layout & pages
│       │   └── dashboard/
│       │       ├── page.tsx          # Dashboard home
│       │       ├── menus/            # Menu management
│       │       │   ├── page.tsx
│       │       │   ├── new/page.tsx  # Create menu
│       │       │   └── MenuActions.tsx
│       │   └── DashboardClient.tsx
│       ├── admin/            # Admin panel
│       │   └── page.tsx
│       ├── api/              # API routes
│       │   ├── auth/         # Login, logout, register, session
│       │   ├── admin/        # User management & stats
│       │   ├── menus/        # CRUD + categories + publish
│       │   ├── categories/   # Category CRUD
│       │   ├── items/        # Item CRUD
│       │   ├── upload/       # Image upload
│       │   └── health/       # Health check
│       └── layout.tsx        # Root layout w/ inline CSS
├── migrations/               # D1 migration files
├── public/                   # Static assets
├── scripts/                  # Build scripts
│   ├── patch-opennext-mw.sh
│   ├── prepare-cf-assets.sh
│   └── patch-worker.mjs
├── schema.sql               # Full database schema
├── wrangler.toml            # Cloudflare Pages config
├── open-next.config.ts      # OpenNext config
└── next.config.ts           # Next.js config
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm

### Setup

```bash
git clone git@github.com:MJB129/plate-qr-menu.git
cd plate-dashboard
npm install
```

### Run Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Required for local D1 access:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with D1 + Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID

---

## Deployment

### Build for Cloudflare Pages

```bash
npm run cf:build
```

This runs:
1. `next build` — Build the Next.js app
2. `npx @opennextjs/cloudflare build` — Adapt for Cloudflare Workers runtime
3. `scripts/patch-opennext-mw.sh` — Patch middleware for Cloudflare compatibility
4. `scripts/prepare-cf-assets.sh` — Prepare asset directory

### Deploy to Cloudflare Pages

```bash
npm run cf:deploy
```

This runs:
```bash
npx wrangler pages deploy .open-next/assets --project-name plate-qr-menu --branch master
```

### Deploy to Production Alias

```bash
npx wrangler pages deploy .open-next/assets --project-name plate-qr-menu --branch master --alias production
```

**Production URL:** [https://plate.romedigital.tech](https://plate.romedigital.tech)

### Database Migrations

```bash
# Apply migration to production D1
npx wrangler d1 migrations apply plate-db-v2

# Apply to local D1 (dev)
npx wrangler d1 migrations apply plate-db-v2 --local
```

---

## Database

### D1 Instance
- **Name:** `plate-db-v2`
- **ID:** `95b57144-a46f-4703-bd73-be5081d66829`
- **Binding:** `DB` (available in API routes via `process.env.DB`)

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Restaurant accounts with plan tiers |
| `sessions` | Auth session tokens |
| `menus` | Digital menus per restaurant |
| `menu_categories` | Categories within a menu |
| `menu_items` | Individual items w/ price, description, image |
| `images` | Base64-encoded uploaded images |

### How to Query

```bash
npx wrangler d1 execute plate-db-v2 --command "SELECT COUNT(*) FROM users;"
```

---

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login with email/password (returns session cookie) |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/register` | Create new account |
| GET | `/api/auth/me` | Get current user info |

### Menus
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/menus` | List user's menus |
| POST | `/api/menus` | Create new menu |
| GET | `/api/menus/[id]` | Get menu details |
| PATCH | `/api/menus/[id]` | Update menu |
| POST | `/api/menus/[id]/publish` | Toggle publish status |
| POST | `/api/menus/[id]/categories` | Add category to menu |
| GET | `/api/menus/[id]/categories` | List categories in menu |

### Categories
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/api/categories/[id]` | Update category |
| POST | `/api/categories/[id]/items/add` | Add item to category |

### Items
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/api/items/[id]` | Update item |
| POST | `/api/items/[id]/delete` | Delete item |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| POST | `/api/admin/users/[id]/upgrade` | Change user plan |
| POST | `/api/admin/users/[id]/delete` | Delete user |

### Utility
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload image (returns base64 data URL) |
| GET | `/api/health` | Health check |

---

## Known Issues

- **Image storage:** Images stored as base64 in D1 — fine for small menus, but a dedicated image service (Cloudflare Images, R2) is recommended at scale.
- **Cloudflare middleware:** OpenNext middleware patches are required for compatibility with Next.js 16 on Cloudflare Pages. See `scripts/patch-opennext-mw.sh`.
- **CSS rendering:** Critical CSS is inlined in `layout.tsx` to avoid Cloudflare edge serving inconsistent external stylesheets.
- **Session-based auth:** No JWT — sessions use server-stored tokens in D1. This means all authenticated requests hit the database.

---

## Maintenance

### Updating Dependencies

```bash
npm update
# Test with
npm run dev
# Then rebuild and deploy
npm run cf:all
```

### Checking Production Health

```bash
curl https://plate.romedigital.tech/api/health
```

---

## License

RomeDigital LLC — Proprietary
