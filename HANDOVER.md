# Project Handover — Agentic E-Commerce Platform
**Date:** 2026-04-13  
**Status:** In Progress — Ready for feature development (Migrations resolved)

---

## What Was Done

### 1. Design & Spec
- Full design brainstorm completed
- Spec written and reviewed: `docs/superpowers/specs/2026-04-13-agentic-ecommerce-platform-design.md`

### 2. Tools & Prerequisites
- PostgreSQL 17 installed and running on `localhost:5432` (password stored in `.env` — never commit)
- Node.js v24.14.0 installed
- pnpm v10.32.1 installed
- Medusa agent skills installed via `/plugin marketplace add medusajs/medusa-agent-skills`

### 3. Medusa Installation
- Medusa v2 backend scaffolded at: `c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store/`
- Next.js Starter Storefront scaffolded at: `c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront/`
- Both directories have all dependencies installed (`node_modules` present)

### 4. Databases Created & Seeded
- `medusa_store` — PostgreSQL database (partially set up, ignore)
- `agentic_store` — PostgreSQL database (Successfully migrated and seeded)
  - Manual migration scripts (`manual-migrate.js`, `manual-patch.js`, etc.) were used to bypass MikroORM Windows path bugs.
  - Store seeded with initial data (Products, Regions, Inventory, etc.) via `seed.ts`.
  - Admin user created (`admin@example.com` / `yourpassword`).

### 5. Client/Storefront Connected
- Extracted Publishable API Key from the database.
- Storefront environment variables configured (`NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9001`, `NEXT_PUBLIC_DEFAULT_REGION=us`).
- Next.js development server is successfully running on port 8000.
- **Fixed Medusa v2 Storefront Breaking Changes:**
  - Resolved `order.fulfillment_status` deprecation.
  - Resolved checkout `workflow_execution` 500 errors (manually ran missing DB migrations).
  - Fixed missing `product_shipping_profile` associations for imported items.
  - Set up a Global region with USD to support worldwide shipping.
  - Updated storefront logic to automatically fall back to thumbnail image if image gallery is empty.

### 6. Admin & Redis Fixes
- Identified that **missing Redis** was causing Medusa v2's async workflows and pub/sub to fail, resulting in Admin UI bugs ("Failed to fetch" race condition, "Unauthorized" session drops).
- Downloaded and ran a native Windows `redis-server.exe` to restore core functionality.
- Configured Medusa to properly use Redis for Caching, Events, Locking, and Workflows.
- Deleted all hacky custom `POST` route overrides since Medusa's official logic is now 100% stable with Redis.
- Fixed the Medusa watcher restarting on every image upload by renaming the `uploads` folder to `.uploads` so the `chokidar` watcher ignores it.
- Fixed the Admin Inventory UI not auto-refreshing by implementing a custom React `MutationObserver` widget that watches for the "Inventory level updated successfully" toast and forces a page reload.

### 7. Database Dump
- `database_dump.sql` is committed to the repo root (3.8MB, 504 products, fully seeded).
- To regenerate: `PGPASSWORD=yourpassword pg_dump -U postgres agentic_store > database_dump.sql`

---

## Resolved Blockers (Historical Context)

### Problem: `db:migrate` reported "Skipped. Database is up-to-date for module" on a fresh empty DB
**Resolution:** Executed a series of manual SQL migration scripts directly against the PostgreSQL database to instantiate the schema, bypassing MikroORM's crawler. Subsequent executions of `db:migrate` and the seed scripts succeeded. 

### Problem: Checkout crashed with "Transaction already started" and "Unknown Error"
**Resolution:** Discovered the backend was missing the `workflow_execution` table. Extracted the exact SQL schema from the Medusa v2 orchestration node modules and manually created the table and indexes.

### Problem: Checkout crashed with "Shipping profiles not satisfied"
**Resolution:** Imported products lacked shipping profiles. Assigned all 500 imported products to the `Default Shipping Profile` via a script and updated the Python seed script to do this automatically going forward.

---

## Next Steps

1. **Mock Agent Service:** Build `/agent-service` Express app with endpoints:
   - `POST /agent/chat`
   - `POST /agent/search`
   - `POST /agent/tryon`
2. **Storefront customizations:**
   - Agent landing page at `/` (replace default home)
   - Floating chat widget on all pages
   - Virtual Try-On Studio at `/try-on`
   - "Recommended for you" sections on PDP and landing page
   - Product reviews on PDP
3. **Product reviews backend:** Custom Medusa module + API route `GET /store/products/:id/reviews`

---

## Completed Since Initial Handover

### Storefront Bug Fixes & Code Quality (2026-04-20)
- **Password update** (`profile-password/index.tsx`) — implemented using `sdk.auth.updateProvider`. Re-authenticates with old password first, then updates. Validates new password / confirm match client-side.
- **Email update** (`profile-email/index.tsx`) — confirmed `StoreUpdateCustomer` API does not expose email changes. Field is now a plain read-only display (no edit button, no form).
- **Image typings** (`thumbnail/index.tsx`) — replaced `any[]` with `HttpTypes.StoreProductImage[]`.
- **Cart inventory limit** (`cart/components/item/index.tsx`) — quantity selector replaced with `−`/`+` stepper buttons. Caps to real `item.variant?.inventory_quantity` when `manage_inventory` is true, falls back to 10.
- **Cart address parsing** (`cart.ts`) — replaced 20 hardcoded `formData.get()` calls with a typed `parseAddress()` helper. Also fixed missing `await` on `getCartId()` in `setAddresses`.
- **Checkout country select** (`native-select/index.tsx`, `country-select/index.tsx`) — fixed React uncontrolled→controlled console error by detecting `value` prop presence and spreading either `{ value }` or `{ defaultValue }` conditionally.
- **Profile page** (`profile/page.tsx`) — `ProfilePassword` section was accidentally commented out; now visible.

### Unit Tests Added (2026-04-20)
Jest + React Testing Library test suite scaffolded at `agentic-store-storefront/src/__tests__/`:
- `customer.test.ts` — 9 tests for customer data functions
- `cart.test.ts` — 8 tests for cart functions including `setAddresses`
- `ProfilePassword.test.tsx` — 5 tests
- `ProfileEmail.test.tsx` — 6 tests (updated to match read-only implementation)
- `Thumbnail.test.tsx` — 12 tests
- `CartItem.test.tsx` — 15 tests (updated for +/- button implementation)

### Password Change — Backend Custom Route (2026-04-20)
- **Root cause:** The built-in `POST /auth/customer/emailpass/update` route is designed for the reset-password token flow (where `actor_id` = auth identity ID). A regular login token has `actor_id` = customer ID — different thing — causing a 500.
- **Fix:** Added custom backend route `POST /store/customers/me/password` (`agentic-store/src/api/store/customers/me/password/route.ts`) that verifies the old password via `authService.authenticate`, then uses the auth identity ID from the authenticate result to call `authService.updateProvider`.
- Registered `authenticate("customer", ["bearer", "session"])` middleware for the new route in `middlewares.ts`.
- Storefront `updatePassword` (`lib/data/customer.ts`) updated to call the new endpoint instead of `sdk.auth.updateProvider`.

### Cart Transfer Banner (2026-04-20)
- The orange "Something went wrong when we tried to transfer your cart" banner appears when a logged-in customer has a guest cart that hasn't been linked to their account.
- `POST /store/carts/:id/customer` runs a workflow via the Workflow Engine — **requires Redis to be running**. If Redis is down the route returns 500 and the banner appears.
- Fix: ensure Redis is running before starting the backend (see Run Commands below).

### Ineligible Promotion Warning (2026-04-20)
- **Problem:** Medusa silently accepts a promo code even when no cart items match the promotion's rules (e.g. apparel-only discount applied to a non-apparel cart). No feedback was shown to the customer.
- **Fix** (`checkout/components/discount-code/index.tsx`):
  - Added `discount_total` and `*items.adjustments` to the default `retrieveCart` fields string so the value is always available on the cart prop.
  - A `pendingCheck` ref stores `{ code, discountBefore }` before calling `applyPromotions`.
  - A `useEffect` watches `cart.promotions` and `cart.discount_total`; once the newly applied code appears in `promotions` (confirming the server re-render), it compares `discountAfter <= discountBefore`. If true, shows a dismissible orange warning banner: *"CODE was applied, but none of the items in your cart are eligible for this promotion."*

---

## Run Commands

```bash
# Terminal 1 — Redis (required for workflows, cart transfer, event bus)
cd "c:/Users/Admin/Desktop/E-com Platform (Medusa)/Redis"
& ".\redis-server.exe" ".\redis.windows.conf"

# Terminal 2 — Backend
cd "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store"
pnpm dev

# Terminal 3 — Storefront  
cd "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agentic-store-storefront"
pnpm dev

# Terminal 4 — Agent Service (to be built)
cd "c:/Users/Admin/Desktop/E-com Platform (Medusa)/agent-service"
pnpm dev
```

**URLs:**
- Backend: http://localhost:9001
- Admin Dashboard: http://localhost:9001/app
- Storefront: http://localhost:8000
- Agent Service: http://localhost:3001

---

## Official Documentation & MCP
*Note: Hardcoded documentation has been removed from this file. This repository uses the official **Medusa MCP Server**. AI assistants (like Trae/Cursor) have real-time, dynamic access to the entire Medusa v2 documentation, references, and upgrade guides via the MCP connection. Do not paste static documentation here.*
