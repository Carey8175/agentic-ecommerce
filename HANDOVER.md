# Project Handover — Agentic E-Commerce Platform (Byteshop)
**Last Updated:** 2026-04-27 (Session 8)

---

## Stack Overview

| Layer | Tech | Port |
|-------|------|------|
| Medusa v2 backend | Node.js, PostgreSQL, Redis | 9001 |
| Next.js storefront | Next.js 15, App Router, Tailwind | 8000 |
| Agent service | TypeScript, Express, SQLite (node:sqlite) | 3001 |
| AI model | BytePlus Ark (OpenAI-compatible) | — |
| Admin dashboard | Medusa Admin (Vite SPA at `/app`) | 9001/app |

---

## Run Commands

**Start in this exact order — each must be ready before the next.**

```powershell
# Terminal 1 — Redis (MUST be first — Medusa won't start without it)
cd "C:\Users\Admin\Desktop\E-com Platform (Medusa)\redis"; .\redis-server.exe .\redis.windows.conf

# Terminal 2 — Medusa Backend (wait for "Server is ready on port: 9001")
cd "C:\Users\Admin\Desktop\E-com Platform (Medusa)\agentic-store"; pnpm dev

# Terminal 3 — Agent Service
cd "C:\Users\Admin\Desktop\E-com Platform (Medusa)\agent-service"; pnpm dev

# Terminal 4 — Storefront
cd "C:\Users\Admin\Desktop\E-com Platform (Medusa)\agentic-store-storefront"; pnpm dev
```

**URLs:**
- Storefront: http://localhost:8000
- Backend API: http://localhost:9001
- Admin Dashboard: http://localhost:9001/app
- Agent Service: http://localhost:3001
- Agent Health: http://localhost:3001/health

**Admin credentials:** `admin@example.com` / `yourpassword`

---

## Credentials & Keys

All secrets are in `.env` files (gitignored). Never commit them.

| File | Key | Notes |
|------|-----|-------|
| `agent-service/.env` | `ARK_API_KEY` | BytePlus Ark API key |
| `agent-service/.env` | `MEDUSA_API_KEY` | Medusa secret key (`sk_...`) for admin API calls |
| `agent-service/.env` | `MEDUSA_PUBLISHABLE_KEY` | `pk_...` from DB |
| `agent-service/.env` | `BYTEPLUS_VLM_MODEL` | VLM model endpoint ID |
| `agent-service/.env` | `BYTEPLUS_SEEDREAM_MODEL` | Seedream model endpoint (try-on) |
| `agentic-store/.env` | `DATABASE_URL` | PostgreSQL connection string |
| `agentic-store/.env` | `REDIS_URL` | `redis://localhost:6379` |

To regenerate `MEDUSA_API_KEY`:
```powershell
cd "C:\Users\Admin\Desktop\E-com Platform (Medusa)\agentic-store"
npx medusa exec ./src/scripts/create-api-key.ts
# Copy the printed sk_... into agent-service/.env
```

---

## Architecture

### Agent Service (`agent-service/`)
TypeScript/Express microservice. Handles all AI chat, tool calls, history, settings, support tickets, try-on jobs, and cancel/return flows.

```
src/
  agents/
    chat-agent.ts            — main LLM orchestrator; tools, system prompt, subagent delegation, uiDataAccum persistence
    recommendation-agent.ts  — personalized product recommendation subagent
    tryon-subagent.ts        — resolveContextImage(); reads saved profile photo from customer metadata
    tryon-agent.ts           — two-stage try-on pipeline (VLM prompt → Seedream image); base64 conversion
  tools/
    medusa.ts                — all Medusa API calls (products, orders, cart, promos, etc.)
    byteplus.ts              — BytePlus VLM + Seedream image generation; generateTryOnImage saves to uploads/<customerId>/
  db/
    schema.ts                — SQLite schema + migrations (node:sqlite, no native deps)
    history.ts               — sessions + messages CRUD, session pruning (max 6 per customer)
    tickets.ts               — support_tickets + ticket_messages CRUD; deleteTicket removes messages + ticket row
    settings.ts              — per-customer settings (one-click checkout, history window)
    tryon-jobs.ts            — tryon_jobs CRUD; failStalePendingJobs() marks pending jobs >4 min as error
  routes/
    chat.ts                  — POST /agent/chat (SSE streaming)
    history.ts               — GET/POST /agent/sessions, GET /agent/sessions/:id/messages
    settings.ts              — GET/POST /agent/settings
    tickets.ts               — full ticket CRUD + admin endpoints + DELETE /:id (hard delete)
    cancel-order.ts          — POST /agent/cancel-order
    tryon.ts                 — POST /agent/tryon (synchronous, legacy)
    tryon-jobs.ts            — POST /agent/tryon-jobs (async job create), GET list + GET /:id (poll)
    tryon-profile.ts         — POST/DELETE /agent/tryon-profile; multer upload; deletes old file from disk on replace/remove
    checkout.ts              — POST /agent/checkout
  server.ts                  — Express app; stale-job cleanup on startup; 24h tryon file cleanup (hourly)
```

**SQLite DB file:** `agent.db` at repo root (gitignored)

---

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  title TEXT,
  surface TEXT NOT NULL DEFAULT 'floating',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls TEXT,
  tool_name TEXT,
  tool_call_id TEXT,
  ui_data TEXT,         -- JSON blob of card payloads for history reconstruction
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id, updated_at);

CREATE TABLE IF NOT EXISTS customer_settings (
  customer_id TEXT PRIMARY KEY,
  one_click_checkout_enabled INTEGER NOT NULL DEFAULT 0,
  saved_address_id TEXT,
  history_window INTEGER NOT NULL DEFAULT 30,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  order_id TEXT,
  order_display_id INTEGER,
  type TEXT NOT NULL DEFAULT 'general',   -- refund|return|damaged|missing|general|cancellation
  status TEXT NOT NULL DEFAULT 'open',    -- open|pending_customer|pending_admin|resolved|rejected|closed
  subject TEXT,
  session_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,   -- customer|admin
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ticket_messages ON ticket_messages(ticket_id, created_at);

CREATE TABLE IF NOT EXISTS tryon_jobs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|done|error
  product TEXT NOT NULL,                    -- JSON: { id, title, thumbnail, handle, category }
  context_image_used TEXT NOT NULL,
  image_url TEXT,
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_tryon_jobs_customer ON tryon_jobs(customer_id, created_at);

-- Migration (applied once, safe to re-run)
ALTER TABLE messages ADD COLUMN ui_data TEXT;
```

---

## Agent Tools (All Implemented)

| Tool | Description | Notes |
|------|-------------|-------|
| `search_products` | Semantic product search | Excludes already-shown products per session |
| `get_product_details` | Full product with variants and stock | — |
| `view_cart` | Current cart contents | — |
| `remove_from_cart` | Remove line item | — |
| `list_orders` | All customer orders (up to 100, sorted by display_id desc) | — |
| `get_order_status` | Single order with tracking numbers | — |
| `initiate_return` | Creates a support ticket of type `return` | Previously fake; now writes to DB |
| `prepare_checkout` | Builds checkout summary, auto-applies promos | Applied promo codes shown in checkout card |
| `redirect_to_tryon` | Opens try-on studio tab | — |
| `cancel_order` | Shows confirm card if within 24h; auto-ticket if outside | Agent text now says "please confirm" not "cancelled" |
| `create_support_ticket` | Creates ticket when AI can't resolve | — |
| `get_similar_products` | Same-category alternatives | — |
| `estimate_shipping` | Available shipping options for cart | — |
| `reorder` | Adds all items from past order to cart | — |
| `get_promotions` | Active promos from Medusa admin API | — |
| `delegate_to_recommendation_agent` | Personalized product recommendation subagent | — |
| `delegate_to_tryon_subagent` | Resolve profile photo → async try-on job | Applicability check before queuing; emits `tryon_job_queued` SSE |

---

## Storefront Agent UI (`agentic-store-storefront/src/modules/agent/`)

```
components/
  agent-panel.tsx          — main panel; card rendering, SSE consumer, try-on done notification
  agent-bubble.tsx         — floating bubble wrapping AgentPanel
  product-card.tsx         — product results with "Try On" + "+ Cart" buttons
  order-card.tsx           — order list items (status: Delivered/Fulfilled/Shipped/Partial/Canceled/Pending)
  cart-card.tsx            — cart with checkout button
  checkout-card.tsx        — checkout confirm; "Go to Checkout →" link when one-click off, "Place Order →" when on
  order-confirmed-card.tsx — post-checkout confirmation
  cancel-confirm-card.tsx  — cancel confirmation with Yes/Keep buttons
  ticket-created-card.tsx  — shown after ticket auto-created
  promo-card.tsx           — promo code card
hooks/
  use-agent-stream.ts      — SSE async generator
```

**Try-On done notification:** When a try-on job queued in the current session completes (or errors), `agent-panel.tsx` polls `/api/agent/tryon-jobs?id=<jobId>` every 5s and injects a chat message with a **View Try-On Result →** button linking directly to `/try-on/[jobId]`.

**Checkout card logic:**
- `one_click_enabled === false` → shows **Go to Checkout →** link to `/checkout?step=address`
- `one_click_enabled === true` → shows **Place Order →** button (places order in-chat)

---

## Next.js API Routes (`src/app/api/agent/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agent/chat` | POST | SSE stream proxy |
| `/api/agent/history` | GET | Session messages with ui_data |
| `/api/agent/settings` | GET/POST | Customer settings |
| `/api/agent/checkout` | POST | Place order via Medusa |
| `/api/agent/cancel-order` | POST | Cancel order via Medusa admin API |
| `/api/agent/tickets` | GET/POST | List/create support tickets |
| `/api/agent/tickets/[id]` | GET/POST | Get thread / reply |
| `/api/agent/bust-cache` | GET/POST | Revalidates `"orders"` tag |
| `/api/agent/tryon` | POST | Virtual try-on proxy (legacy) |
| `/api/agent/tryon-jobs` | GET/POST | Async try-on job create + poll |
| `/api/agent/tryon-profile` | POST/DELETE | Profile photo upload/remove |

---

## Support Ticket System

**Ticket types:** `cancellation`, `return`, `refund`, `damaged`, `missing`, `general`

**Status flow:** `open` → `pending_admin` (customer replied) → `pending_customer` (admin replied) → `resolved` / `closed`

**Auto-created by agent when:**
- Cancel order outside 24h window → type `refund`
- `initiate_return` called → type `return`
- `create_support_ticket` called → any type

**Admin actions (Support Tickets page):**
- View all tickets, filter by status
- Reply to customer (auto-sets `pending_customer`)
- Change status via dropdown
- **Delete ticket** (red button → confirm → hard deletes ticket + all messages from DB)

---

## Try-On System

**Flow:**
1. User asks to try on a product
2. `delegate_to_tryon_subagent` checks applicability (VLM: is this apparel/furniture?)
3. If applicable: resolves profile photo → POSTs to `/agent/tryon-jobs`
4. Job row created immediately with product stub (title, thumbnail, handle, category)
5. `generateTryOn` fires in background via `setImmediate`
6. VLM generates Seedream prompt → Seedream generates image → saved to `uploads/<customerId>/tryon-<uuid>.png`
7. Job row updated to `done` with absolute image URL
8. Agent panel polls job and notifies user in chat with a **View Try-On Result →** button

**File storage:**
- Results: `agent-service/src/uploads/<customerId>/tryon-<uuid>.png`
- Profile photos: `agent-service/src/uploads/<customerId>/<timestamp>.<ext>`
- Old profile photo deleted from disk on Replace or Remove
- Tryon files auto-deleted after 24h (cleanup runs on startup + every hour)

**Job timeout:** Pending jobs older than 4 minutes are marked `error` on agent-service startup (`failStalePendingJobs()`). Client polls for 4 minutes then shows timeout error.

**Non-applicable products:** Food, software, digital goods, services, gift cards, supplements, cosmetics, books, toys, pet food — agent relays the reason to the user and does not queue a job.

---

## Admin Pages (Medusa Admin at `/app`)

| Page | Route | Description |
|------|-------|-------------|
| Agent Config | `/app/agent-config` | Name, tone, system prompt, FAQs, knowledge base. Save button: grey (clean) → blue (dirty) → green "Saved ✓" |
| Reviews | `/app/reviews` | View all reviews, filter by product, delete |
| Support Tickets | `/app/support-tickets` | All tickets, filter by status, thread view, reply, change status, delete |

---

## Customer Storefront Pages

| Page | Route | Notes |
|------|-------|-------|
| Home | `/` | Hero with AgentPanel (mode="hero"), fresh session on every visit |
| Shop | `/store` | Product grid with category filter + sort |
| Product | `/products/[handle]` | Detail page with reviews, add to cart, try-on |
| Cart | `/cart` | Cart summary with promo code input |
| Checkout | `/checkout` | Standard Medusa checkout flow |
| Try-On | `/try-on` | Agent result gallery (before/after slider cards) OR manual studio |
| Try-On Detail | `/try-on/[jobId]` | Full-size before/after comparison + product info + Add to Cart |
| Customer Service | `/customer-service` | AI chat (left) + ticket list/thread (right) |
| Account | `/account` | Orders, profile, addresses, AI Assistant, Try-On & Personalization |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `agent-service/src/agents/chat-agent.ts` | LLM orchestrator — tools, system prompt, uiDataAccum |
| `agent-service/src/tools/byteplus.ts` | BytePlus VLM + Seedream; `generateTryOnImage` saves to customer subfolder |
| `agent-service/src/routes/tryon-profile.ts` | Profile photo upload/delete; cleans old file from disk on replace/remove |
| `agent-service/src/routes/tryon-jobs.ts` | Async job runner; passes `customerId` to `generateTryOn` |
| `agent-service/src/db/schema.ts` | SQLite schema + migrations |
| `agent-service/src/db/tickets.ts` | Ticket CRUD; `deleteTicket` removes messages + ticket row |
| `agent-service/src/server.ts` | Startup: stale-job cleanup + 24h tryon file cleanup (hourly) |
| `agentic-store-storefront/src/modules/agent/components/agent-panel.tsx` | Chat panel; try-on done polling + notification |
| `agentic-store-storefront/src/modules/agent/components/checkout-card.tsx` | Checkout card; one-click vs manual checkout button logic |
| `agentic-store-storefront/src/modules/agent/components/order-card.tsx` | Order status badges (Delivered/Fulfilled/Shipped/Partial/Canceled/Pending) |
| `agentic-store-storefront/src/modules/try-on/templates/tryon-gallery.tsx` | Gallery with before/after slider; 4-min timeout |
| `agentic-store-storefront/src/app/[countryCode]/(main)/try-on/[jobId]/page.tsx` | Try-on detail page (server) |
| `agentic-store-storefront/src/modules/try-on/templates/tryon-detail-client.tsx` | Try-on detail client; full-size comparison + Add to Cart |
| `agentic-store/src/admin/routes/support-tickets/page.tsx` | Admin ticket management |
| `agentic-store/src/admin/routes/agent-config/page.tsx` | Admin agent config |
| `agentic-store/src/api/admin/agent-config/route.ts` | Agent config GET/POST API |

---

## Known Issues & Workarounds

| Issue | Cause | Fix/Status |
|-------|-------|-----------|
| Product page 20s load | `listOrders(100)` called server-side on every product page | Fixed — orders fetched lazily client-side via SWR |
| 30+ parallel review requests | `ProductReviewStars` fired independent fetches per card | Fixed — SWR with `dedupingInterval: 60000` |
| History tab empty on support surface | `listSessions(null)` returned all guest sessions | Fixed — `surface` param added throughout |
| Admin bundle crash | `TicketMini` doesn't exist in `@medusajs/icons` | Fixed — using `ChatBubble` |
| `db:migrate` skips review table | Windows MikroORM bug | Created table manually + inserted migration record |
| Cart transfer banner | Redis not running | Always start Redis before Medusa |
| BytePlus 400 on localhost images | BytePlus is external | Fixed — `urlToBase64()` reads local disk / fetches localhost server-side |
| Chat agent swallowing tryon errors | Generic catch → LLM invented "service issue" | Fixed — `{ user_error }` returned; system prompt relays verbatim |
| Agent says "cancelled" before confirm | System prompt didn't instruct agent to wait for user confirmation | Fixed — system prompt now says "tell user to confirm via card below" |
| Checkout card no button (one-click off) | `isActiveCart = cartId === data.id` always false | Fixed — `isActiveCart = !!cartId`; "Go to Checkout →" shown when one-click off |
| Initiate return does nothing | `initiate_return` returned hardcoded message, no DB write | Fixed — creates real support ticket of type `return` |
| Profile photo Replace/Remove doesn't delete old file | Route only updated metadata, never touched disk | Fixed — `tryon-profile.ts` now `fs.unlinkSync` old file before saving/clearing |
| Try-on results saved flat in uploads/ | `customerId` not passed to `generateTryOnImage` | Fixed — saved to `uploads/<customerId>/tryon-<uuid>.png`; cleanup only touches `tryon-` prefixed files |
| Admin ticket delete not implemented | No DELETE route or UI button | Fixed — `DELETE /agent/tickets/:id` route + Delete button with confirm in admin UI |
| Try-on done notification showing for stale jobs | Polled all localStorage job IDs on mount | Fixed — `notifyTryOnDone()` only called when job is queued in the current session |
| Try-on gallery before/after slider showing as strip | `context_image_used` stored as relative `/uploads/...` path; browser on port 8000 can't load from port 3001 | Fixed — `parseJob()` in `tryon-jobs.ts` normalises all URLs to absolute `http://localhost:3001/uploads/...` at read time |
| Try-on gallery before/after slider missing on refresh | `removeJob()` read stale `jobIds` prop, so removal didn't persist to localStorage correctly | Fixed — `removeJob()` now reads localStorage directly before writing |
| Broken `before` image causes slider to collapse/glitch | `context_image_used` file may be cleaned up (24h expiry) but job still in localStorage | Fixed — `BeforeAfterCompare` has `onError` handler; falls back to showing just the try-on result image |

---

## What Still Needs Building

| Feature | Status | Notes |
|---------|--------|-------|
| **Admin live chat** | Not started | Requires session bridge by customer_id + polling or WebSocket |
| **Review moderation** | Not started | All reviews publish immediately; admin delete exists |
| **Promo auto-apply on one-click checkout** | Working for prepare_checkout | Verify also works for the one-click direct button path |

---

## Session History

### 2026-04-27 (Session 8) — Try-On Gallery Fixes & UX Polish

- **Try-on gallery slider fix** — `context_image_used` was stored as a relative `/uploads/...` path; browser on port 8000 couldn't load it from port 3001 causing the before/after slider to collapse to a strip. Fixed: `parseJob()` in `tryon-jobs.ts` now normalises both `image_url` and `context_image_used` to absolute `http://localhost:3001/...` URLs at read time. New jobs also store the absolute URL at creation.
- **Per-card delete (X button)** — gallery cards now have an individual X button in the top-right corner. Removing a card updates localStorage directly (reads current state at click time to avoid stale prop); removing the last card redirects back to the studio.
- **Stale removal fix** — `removeJob()` previously read the stale `jobIds` prop passed at mount time, so deletions didn't persist across refreshes. Fixed to read/write localStorage directly.
- **Broken before-image fallback** — `BeforeAfterCompare` now has an `onError` handler on the `before` image. If the original context photo is no longer available (e.g. 24h cleanup removed it), the component falls back to showing just the try-on result image instead of collapsing/glitching.
- **Gallery grid alignment** — added `alignItems: "start"` to the grid container so cards size to their own content height rather than stretching to match the tallest card in each row.

### 2026-04-27 (Session 7) — Bug Fixes, UX Polish, Storage Improvements

- **Try-on done notification** — `agent-panel.tsx` polls job on completion and injects a chat message with **View Try-On Result →** button linking to `/try-on/[jobId]`. Fixed stale-job notification bug (was triggering on all localStorage jobs on mount; now only triggers for jobs queued in the current session via `notifyTryOnDone()`).
- **Try-on storage** — results now saved to `uploads/<customerId>/tryon-<uuid>.png` instead of flat `uploads/`. `customerId` passed through `generateTryOn` → `generateTryOnImage`. 24h cleanup job runs on startup and every hour, deletes `tryon-` files from all customer subfolders.
- **Profile photo cleanup** — `tryon-profile.ts` now deletes the old file from disk on both Replace and Remove (was only updating Medusa metadata, leaving orphaned files).
- **Admin ticket delete** — `DELETE /agent/tickets/:id` route hard-deletes ticket + all messages. Admin UI has a "Delete" button with inline Yes/No confirm that removes the ticket from the list immediately.
- **Initiate return creates ticket** — `initiate_return` tool previously returned a fake success message; now creates a real support ticket of type `return` and emits `show_ticket_created` SSE event.
- **Cancel order UX** — system prompt updated: when `cancel_order` returns `eligible=true`, agent now says "please confirm using the card below" instead of prematurely claiming the order was cancelled.
- **Checkout card fix** — `isActiveCart` was always `false` (compared `cartId` to non-existent `data.id`); fixed to `!!cartId`. When one-click is disabled, card now shows **Go to Checkout →** link instead of the Place Order button.
- **Order status badges** — `order-card.tsx` now covers all Medusa v2 fulfillment statuses: `delivered` (green ✓), `fulfilled` (light green ✓), `shipped` (🚚), `partially_fulfilled` (📦), `canceled` (✕ red), pending (amber 📦).

### 2026-04-27 (Session 6) — Try-On Stability & Endpoints
- Seedream validation, try-on product accuracy fix, gallery title truncation fix, job queue race condition fix, chat agent error handling.

### 2026-04-20 — UI Redesign + Reviews
- Full storefront redesign, product reviews system, virtual try-on studio page, cart promo code.

### 2026-04-22 — Agent Service Base
- Agent service scaffolded, chat agent with all tools, agent panel UI, agent config admin module.

### 2026-04-23 (Session 3) — Async Try-On Gallery, Profile Upload, Bug Fixes
- Async try-on job queue, chat agent async flow, try-on gallery rewrite, profile upload, BytePlus localhost fix.

### 2026-04-23 (Session 2) — Subagents, Cart-Free Try-On, Performance
- Recommendation subagent, try-on subagent, product card Try On button, SWR deduplication, history surface scoping.

### 2026-04-23 (Session 1) — UI Refinements & Agent Debugging
- Caching fixes, chat UX soft navigation, history card rendering, support ticket system, cancel order, promo auto-apply.

---

## Official Documentation
This repository uses the official **Medusa MCP Server**. AI assistants have real-time access to Medusa v2 docs via MCP tool `mcp__plugin_medusa-dev_MedusaDocs__ask_medusa_question`.
