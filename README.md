# Byteshop — Agentic E-Commerce Platform

An AI-powered e-commerce platform built on Medusa v2 with a custom agent service for conversational shopping, virtual try-on, and intelligent customer support.

---

## Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- PostgreSQL (running locally)
- Redis (bundled in `redis/` folder for Windows)

---

## Project Structure

```
E-com Platform (Medusa)/
├── agentic-store/             # Medusa v2 backend + admin
├── agentic-store-storefront/  # Next.js 15 storefront
├── agent-service/             # TypeScript/Express AI agent microservice
├── redis/                     # Redis binaries (Windows)
├── agent.db                   # SQLite DB (gitignored, auto-created)
├── README.md                  # This file
└── HANDOVER.md                # Full technical handover document
```

---

## Setup

### 1. Install dependencies

```powershell
cd agentic-store
pnpm install

cd ../agentic-store-storefront
pnpm install

cd ../agent-service
pnpm install
```

### 2. Environment files

**`agentic-store/.env`**
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/byteshop
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9001
AUTH_CORS=http://localhost:9001,http://localhost:8000
```

**`agent-service/.env`**
```env
ARK_API_KEY=your-byteplus-ark-api-key
BYTEPLUS_BASE_URL=https://ark.ap-southeast.bytepluses.com/api/v3
BYTEPLUS_VLM_MODEL=ep-xxxxxxxxxxxxxxxx-xxxxx
BYTEPLUS_SEEDREAM_MODEL=ep-xxxxxxxxxxxxxxxx-xxxxx
MEDUSA_URL=http://localhost:9001
MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxx
MEDUSA_API_KEY=sk_xxxxxxxxxxxx
AGENT_SERVICE_URL=http://localhost:3001
PORT=3001
```

**`agentic-store-storefront/.env.local`**
```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:8000
MEDUSA_BACKEND_URL=http://localhost:9001
AGENT_SERVICE_URL=http://localhost:3001
```

### 3. Set up the database

```powershell
cd agentic-store
npx medusa db:create
npx medusa db:migrate
npx medusa exec ./src/scripts/seed.ts   # optional seed data
```

### 4. Create the Medusa secret API key (for agent service)

```powershell
cd agentic-store
npx medusa exec ./src/scripts/create-api-key.ts
# Copy the printed sk_... into agent-service/.env as MEDUSA_API_KEY
```

### 5. Get the Publishable Key

Go to http://localhost:9001/app → Settings → API Keys → copy the `pk_...` value.
Set it in both `agent-service/.env` and `agentic-store-storefront/.env.local`.

---

## Running the Platform

Start in this exact order — each service must be ready before starting the next.

```powershell
# Terminal 1 — Redis
cd redis
.\redis-server.exe .\redis.windows.conf

# Terminal 2 — Medusa backend (wait for "Server is ready on port: 9001")
cd agentic-store
pnpm dev

# Terminal 3 — Agent service
cd agent-service
pnpm dev

# Terminal 4 — Storefront
cd agentic-store-storefront
pnpm dev
```

| Service | URL |
|---------|-----|
| Storefront | http://localhost:8000 |
| Admin dashboard | http://localhost:9001/app |
| Medusa API | http://localhost:9001 |
| Agent service | http://localhost:3001 |
| Agent health check | http://localhost:3001/health |

**Default admin credentials:** `admin@example.com` / `yourpassword`

---

## Features

### AI Shopping Agent
- Natural language product search and recommendations
- Cart management (add, remove, view)
- Order tracking with tracking numbers
- Checkout — one-click (in-chat) or redirect to full checkout page
- Auto-applies active promo codes at checkout
- Reorder past orders
- Similar product suggestions

### Virtual Try-On
- Upload a personal photo and/or room photo in Account → Try-On & Personalization
- Ask the agent to try on any apparel or furniture product
- AI checks product applicability before queuing (skips food, software, gift cards, etc.)
- Generates a before/after comparison image using BytePlus Seedream 4.5
- Results saved per-customer in `agent-service/src/uploads/<customerId>/`
- Results auto-deleted after 24 hours
- View full-size comparison at `/try-on/[jobId]`
- Agent notifies you in chat when generation is complete with a direct "View Try-On Result →" button

### Customer Support
- AI handles: cancellations (within 24h window), returns, refunds, damaged/missing items
- Escalates to human support via ticket system when needed
- Customer can view and reply to tickets at `/customer-service`
- Admin manages tickets at `/app/support-tickets` (reply, status, delete)

### Admin Panel (`/app`)
- **Agent Config** — name, tone, custom system prompt, FAQs, knowledge base
- **Support Tickets** — full thread management with delete
- **Reviews** — view and delete product reviews

---

## SQLite Database (Agent Service)

The agent service uses its own SQLite database (`agent.db`) separate from Medusa's PostgreSQL.
It is auto-created on first startup — no migration commands needed.

```sql
-- Core tables
sessions          -- chat sessions per customer
messages          -- LLM messages + ui_data JSON (card payloads for history)
customer_settings -- one_click_checkout_enabled, history_window

-- Support system
support_tickets   -- id, customer_id, order_id, type, status, subject
ticket_messages   -- id, ticket_id, sender_role (customer|admin), content

-- Try-on
tryon_jobs        -- id, customer_id, status (pending|done|error), product JSON, image_url
```

See `HANDOVER.md` for the full schema DDL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Medusa v2, Node.js, PostgreSQL, Redis |
| Storefront | Next.js 15, App Router, Tailwind CSS |
| Agent service | TypeScript, Express, SQLite (node:sqlite) |
| AI | BytePlus Ark API (OpenAI-compatible), VLM + Seedream 4.5 |
| Admin | Medusa Admin (Vite SPA) |

---

## Notes

- Use `pnpm` exclusively — do not mix with `npm install`
- `agent.db` is gitignored and auto-created on first agent service start
- Profile photos and try-on results are stored in `agent-service/src/uploads/` (gitignored)
- Try-on results are automatically cleaned up after 24 hours
- See `HANDOVER.md` for full architecture, known issues, and complete session history
