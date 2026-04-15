# Agentic E-Commerce Platform

Welcome to the **Agentic E-Commerce Platform**! This project is a modern, AI-powered e-commerce ecosystem built on **Medusa v2** and **Next.js**.

## 🌟 Project Overview
This repository contains the foundation for an intelligent, modular e-commerce store. It is currently set up with:
- **Backend:** A robust headless commerce engine using Medusa v2.
- **Storefront:** A high-performance, React/Next.js 15 storefront pre-configured for global shipping and multi-currency.
- **Rich Dataset:** A pre-seeded database complete with realistic inventory levels, global shipping profiles, and image hosting.

### The "Agentic" Vision
The long-term goal of this platform is to seamlessly integrate AI agents directly into the shopping experience. Upcoming features include:
- A custom Express `/agent-service` for intelligent product search.
- An interactive floating chat widget across all pages.
- A "Virtual Try-On Studio".

## 📦 Directory Structure

```text
.
├── agentic-store/             # Medusa v2 Backend (Node.js, Postgres)
├── agentic-store-storefront/  # Next.js Storefront (React, Tailwind CSS)
├── docs/                      # Technical specifications and design documents
├── SETUP.md                   # Step-by-step installation and database setup guide
├── HANDOVER.md                # Project status, history, and active to-do lists
└── database_dump.sql          # Quick-start database state (504 products, fully seeded)
```

## 🚀 Getting Started

If you are a new collaborator setting up the project locally for the first time, please refer strictly to **`SETUP.md`**. It contains detailed instructions on:
1. Installing dependencies (`pnpm`).
2. Setting up the PostgreSQL database and Redis server.
3. Fast-tracking data ingestion using the `database_dump.sql` file.
4. Configuring Model Context Protocol (MCP) for your AI Assistant.

## 🛠️ Tech Stack
- **Medusa Framework (v2):** Commerce logic, workflows, modules.
- **Next.js (v15):** React-based storefront, App Router.
- **PostgreSQL:** Primary database.
- **Redis:** Required for Medusa pub/sub and workflows.
- **Python:** Custom dataset extraction and seeding scripts.

## ⚠️ Collaboration & AI Note
This repository relies heavily on the **Medusa MCP (Model Context Protocol)**. 
We **do not** store static Medusa documentation in this repository. All AI assistants working on this project should connect to the `@medusajs/mcp-server` to dynamically pull the latest Medusa v2 documentation, references, and upgrade guides. See `SETUP.md` for configuration instructions.