# E-com Platform (Medusa) Detailed Setup Guide

Welcome to the Medusa v2 E-commerce platform repository! This project consists of a Medusa v2 backend (`agentic-store`) and a Next.js storefront (`agentic-store-storefront`). 

This guide is designed to help a new collaborator set up the entire environment from scratch in minutes.

---

## 🛠 Prerequisites

Before cloning and setting up the project, ensure your local environment has the following installed and running:

1. **Node.js** (v20 or newer): [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** (v15 or newer): [Download PostgreSQL](https://www.postgresql.org/download/)
   - Ensure the PostgreSQL service is actively running in the background.
3. **Redis**: Required by Medusa v2 for workflow orchestrations and events.
   - Mac/Linux: `brew install redis` and `brew services start redis`
   - Windows: Use [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/en-us/windows/wsl/install) to install Redis, or use Docker (`docker run -p 6379:6379 -d redis`).
4. **pnpm**: We use `pnpm` for package management.
   - Install via npm: `npm install -g pnpm`
5. **Git**: To clone the repository.

---

## 🚀 Step 1: Database Initialization

### Option A — Restore from dump (recommended)

1. **Create the database:**
   ```bash
   createdb -U postgres agentic_store
   ```

2. **Restore the dump:**
   ```bash
   # Replace YOUR_POSTGRES_PASSWORD with your postgres password
   psql -U postgres -d agentic_store -f database_dump.sql
   ```

You now have a fully populated database — skip to Step 2.

### Option B — Fresh migration + seed

1. **Create the database:**
   ```bash
   createdb -U postgres agentic_store
   ```

2. **Complete Step 2 first** (backend env config), then run:
   ```bash
   cd agentic-store
   npx medusa db:migrate
   npx medusa db:seed --seed-file=src/scripts/seed.ts
   ```

> To generate a dump from a working instance: `pg_dump -U postgres agentic_store > database_dump.sql`

---

## ⚙️ Step 2: Backend Setup (`agentic-store`)

Now that the database is ready, let's configure the Medusa v2 backend.

1. **Navigate to the backend directory** (if you aren't already there):
   ```bash
   cd agentic-store
   ```

2. **Install dependencies** using pnpm:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a new `.env` file in the `agentic-store` directory. You can copy from `.env.template` if it exists, or create one manually with the following:
   ```env
   # Replace YOUR_POSTGRES_PASSWORD with your local postgres password
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/agentic_store
   
   # Ensure your local Redis server is running on the default port
   REDIS_URL=redis://localhost:6379
   
   # Required for Medusa v2
   NODE_ENV=development
   ```

4. **Start the Backend Development Server**:
   ```bash
   pnpm dev
   ```
   *Wait until the terminal says the server is ready. It should be running on `http://localhost:9001`.*
   - **Admin Dashboard**: Access at `http://localhost:9001/app`
   - **Admin Login**: `admin@example.com`
   - **Admin Password**: `yourpassword` (or whatever you set locally)

---

## 🛒 Step 3: Storefront Setup (`agentic-store-storefront`)

Next, let's get the Next.js storefront running to connect to your backend.

1. **Open a new terminal window/tab** and navigate to the storefront directory:
   ```bash
   cd agentic-store-storefront
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the `agentic-store-storefront` directory with the following:
   ```env
   # Points to your local Medusa backend
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9001
   
   # The default region country code (us = United States)
   NEXT_PUBLIC_DEFAULT_REGION=us
   ```

4. **Start the Storefront Development Server**:
   ```bash
   pnpm dev
   ```
   *Your storefront is now running on `http://localhost:8000`.*

---

## 🤖 Step 4: AI Assistant & MCP Configuration

If you are using an AI IDE (like **Trae** or **Cursor**) to collaborate on this project, it is highly recommended to connect the **Medusa MCP (Model Context Protocol)**. This gives your AI assistant real-time access to the official Medusa v2 documentation and API references.

**To configure in your IDE:**
1. Open your MCP settings (e.g., `~/.trae/mcp.json` or Cursor settings).
2. Add the Medusa MCP server configuration:
```json
{
  "mcpServers": {
    "medusa-docs": {
      "command": "npx",
      "args": ["-y", "@medusajs/mcp-server"]
    }
  }
}
```
3. Restart your IDE. Your AI can now answer complex Medusa v2 architectural questions directly from the official source without hallucinating v1 syntax!

---

## ⚠️ Troubleshooting & Important Notes

- **"Transaction already started" or Checkout 500 Errors**:
  If you ever encounter this, it means your database migrations are out of sync. Ensure you successfully restored the `database_dump.sql` or run `npx medusa db:migrate` in the backend.
- **Storefront Country Routing Errors (e.g., `/my` returning 404)**:
  The Next.js storefront heavily caches the Regions mapping for country code URLs. If you add or remove countries in the Medusa Admin, you **must** clear the Next.js cache and restart the storefront:
  ```bash
  # Inside agentic-store-storefront
  rm -rf .next   # (On Windows PowerShell: Remove-Item -Recurse -Force .next)
  pnpm dev
  ```
- **Redis Connection Errors**:
  If the backend crashes on startup complaining about Redis, ensure your Redis server is actively running (`redis-cli ping` should return `PONG`).