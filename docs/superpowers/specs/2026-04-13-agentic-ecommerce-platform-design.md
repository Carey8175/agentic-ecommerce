# Agentic E-Commerce Platform — Design Spec
**Date:** 2026-04-13  
**Project:** Agentic E-Commerce Demo Platform  

---

## 1. Overview

A demo e-commerce platform built on Medusa v2 that showcases an agentic shopping experience powered by ByteDance/BytePlus AI models. The platform delivers an Amazon-style commerce experience with an AI chat layer enabling intent recognition → product discovery → recommendation → virtual try-on → checkout.

BytePlus APIs (Seed 2.0, Seedream, Seedance, AgentKit) are **mocked** for the demo and designed as clean integration points for real API keys later.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER BROWSER                          │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │   Next.js Storefront  (localhost:8000)       │            │
│  │                                              │            │
│  │  /           → Agent Landing Page           │            │
│  │  /store       → Product Listing (PLP)       │            │
│  │  /products/:  → Product Detail (PDP)        │            │
│  │  /cart        → Cart                        │            │
│  │  /checkout    → Checkout                    │            │
│  │  /account     → Orders / Profile            │            │
│  │  /try-on      → Virtual Try-On Studio        │            │
│  │                                              │            │
│  │  [Chat Widget] floating on every page        │            │
│  └──────────────┬──────────────────────────────┘            │
└─────────────────┼───────────────────────────────────────────┘
                  │  HTTP
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌─────────────────────┐
│  Medusa v2   │    │  Mock Agent Service  │
│  Backend     │    │  (Node.js/Express)   │
│  :9000       │    │  :3001               │
│              │    │                      │
│  Products    │◄───│  POST /agent/chat    │
│  Cart        │    │  POST /agent/search  │
│  Orders      │    │  POST /agent/tryon   │
│  Customers   │    │                      │
│  Admin /app  │    │  → BytePlus stub     │
│              │    └─────────────────────┘
│  PostgreSQL  │
│  :5432       │
└──────────────┘
```

### Three Running Processes

| Service | Directory | Port | Tech |
|---|---|---|---|
| Medusa Backend | `/medusa-backend` | 9000 | Node.js, Medusa v2 |
| Next.js Storefront | `/storefront` | 8000 | Next.js 14, Tailwind |
| Mock Agent Service | `/agent-service` | 3001 | Node.js, Express |

### Database
- PostgreSQL 17 running locally on port 5432
- Database: `medusa_store`
- User: `postgres`

---

## 3. Components

### 3.1 Medusa Backend (`/medusa-backend`)

**Modules enabled (default Medusa v2):**
- Product Module — catalog, variants, categories
- Cart Module — cart management
- Order Module — order lifecycle
- Customer Module — registration, authentication
- Payment Module — manual provider (no real payment for demo)
- Fulfillment Module — basic fulfillment

**Seed data:**
- Medusa built-in starter catalog (expandable to ~500 products from Kaggle later)
- Admin user: created via CLI

**Custom additions:**
- Product reviews data model (seeded with static reviews per product)
- `GET /store/products/:id/reviews` endpoint

### 3.2 Next.js Storefront (`/storefront`)

Built on the official Medusa Next.js Starter Storefront with the following customizations:

**Pages:**

| Route | Description |
|---|---|
| `/` | Agent Landing Page — hero, feature highlights, suggested prompts, CTA, "Recommended for you" carousel |
| `/store` | Product Listing Page — grid, filters, search bar |
| `/products/[handle]` | Product Detail Page — images, variants, reviews, "Recommended for you", Virtual Try-On button |
| `/cart` | Cart page |
| `/checkout` | Checkout flow |
| `/order/confirmed/[id]` | Order confirmation |
| `/account` | Customer account, order history |
| `/try-on` | Virtual Try-On Studio — select items from cart, upload photo, see try-on result |

**Agent Chat Widget:**
- Floating button (bottom-right) present on all pages
- Opens a slide-in chat panel
- Renders product cards (image, name, price, "Add to cart") inline for product results
- Maintains conversation history within session

**Agent Landing Page (`/`):**
- Hero section: "Your AI Shopping Assistant"
- Feature highlights: AI Search, Recommendations, Virtual Try-On
- Suggested prompts grid: e.g. "Show me red dresses under $50", "Find a modern sofa", "What's trending in beauty?"
- CTA: "Start Shopping with AI" → opens chat widget

**Product Detail Page additions:**
- "Recommended for you" section — calls `/agent/search` with current product context
- Static seeded product reviews (star rating, text, date)
- "Virtual Try-On" button → links to `/try-on` page with current product pre-selected

**Virtual Try-On Studio (`/try-on`):**
- Lists all items currently in the customer's cart (product image, name, variant)
- Customer selects one item to try on
- Photo upload area (or webcam capture) for customer photo
- "Generate Try-On" button → calls `POST /agent/tryon` with selected product + photo
- Result panel displays placeholder try-on image
- "Add to Cart" shortcut if item not already in cart
- "Try another item" to switch selection without re-uploading photo

**Agent Landing Page (`/`) additions:**
- "Recommended for you" carousel — calls `POST /agent/search` on the agent service (agent service calls Medusa internally; storefront never calls Medusa directly for recommendations)

### 3.3 Mock Agent Service (`/agent-service`)

Lightweight Express.js app simulating BytePlus AgentKit + model APIs.

**Endpoints:**

| Method | Path | Simulates | Response |
|---|---|---|---|
| `POST` | `/agent/chat` | BytePlus Seed 2.0 (LLM) | Streaming mock chat response with product references |
| `POST` | `/agent/search` | Agent semantic search | Queries PostgreSQL via Medusa product API, returns ranked product list |
| `POST` | `/agent/tryon` | Seedance 2.0 video/image | Returns a placeholder try-on image URL |
| `GET` | `/health` | — | Service health check |

**`/agent/chat` behavior:**
- Parses user message for product intent keywords
- Calls Medusa `GET /store/products` with extracted filters
- Returns a structured response: text + product card array
- Simulates streaming with chunked response

**`/agent/search` behavior:**
- Takes `{ product_id, context }` or `{ query }`
- Calls Medusa product search API
- Returns top 4 products ranked by category/tag relevance

**`/agent/tryon` behavior:**
- Accepts `{ product_id, user_image_base64 }`
- Returns a static placeholder image URL (mock)
- Response includes a note: "BytePlus Seedance integration point"

**Design principle:** All BytePlus calls are isolated in `/agent-service/src/providers/byteplus.ts` — swap mock implementations for real API calls by replacing that file.

---

## 4. Data Flow — Agentic Shopping Journey

```
User types: "Show me red dresses under $50"
        │
        ▼
Chat Widget → POST /agent/chat { message }
        │
        ▼
Agent Service parses intent → calls Medusa GET /store/products?category=dresses&price_max=50
        │
        ▼
Medusa returns product list
        │
        ▼
Agent Service formats response: { text: "Here are some options...", products: [...] }
        │
        ▼
Chat Widget renders: text + product cards (image, name, price, "Add to cart")
        │
        ▼
User clicks product card → navigates to PDP
        │
        ▼
PDP loads → "Recommended for you" section calls POST /agent/search { product_id }
        │
        ▼
User clicks "Virtual Try-On" on PDP → navigates to /try-on with product pre-selected
        │
        ▼
User uploads photo → POST /agent/tryon → placeholder try-on result displayed
        │
        ▼
User clicks "Add to Cart" (if not already in cart) → back to checkout flow
        │
        ▼
User clicks "Add to Cart" → Medusa Cart API → Checkout → Order
```

---

## 5. Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Storefront base | Next.js Starter (official) | Full Amazon-style UI out of the box, saves weeks of work |
| Agent service | Separate Express app | Clean separation, easy to swap mocks for real BytePlus APIs |
| Payment | Manual provider | Demo only, no real payment needed |
| Reviews | Seeded static data | Realism without complexity |
| Try-on | Placeholder image | Shows integration point clearly for demo |
| Product data | Medusa starter seed | Fast setup, expandable to Kaggle dataset later |

---

## 6. Future Integration Points (BytePlus)

| Mock Endpoint | Real BytePlus API |
|---|---|
| `/agent/chat` | BytePlus AgentKit + Seed 2.0 LLM |
| `/agent/search` | VikingDB vector search with product embeddings (agent handles VikingDB when BytePlus AgentKit is integrated; demo uses PostgreSQL via Medusa) |
| `/agent/tryon` | Seedance 2.0 image-to-video try-on |
| Outfit generation | Seedream 4.5 text-to-image |

---

## 7. Prerequisites & Setup

- Node.js v20+ (LTS)
- PostgreSQL 17 (local, port 5432, password stored in `.env`)
- Database: `medusa_store` (created)
- Git
- pnpm (recommended)

---

## 8. Out of Scope (Demo)

- Real payment processing
- Email notifications
- Production deployment
- BytePlus API integration (mocked)
- Kaggle product data import (deferred)
- TikTok Shop integration
- Multi-region / multi-currency (beyond Medusa defaults)
