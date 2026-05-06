# Compass — Student Lifecycle Platform

A full-stack web app that helps students track energy levels, connect with near-peer mentors, book sessions, and get AI-driven major recommendations.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) v9+ (`npm install -g pnpm`)
- A PostgreSQL database (the `DATABASE_URL` env var must be set)

---

## Environment Variables

The following secrets/env vars must be set before running the app. In Replit these are managed in the Secrets pane; locally, create a `.env` file or export them in your shell.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk server-side secret key (auto-provisioned on Replit) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (auto-provisioned on Replit) |
| `SESSION_SECRET` | Secret for session signing |

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 3. Start both servers

Open two terminals (or use the Replit workflow panel):

**API server** (port 8080, served at `/api`):
```bash
pnpm --filter @workspace/api-server run dev
```

**Web app** (port 22639, served at `/`):
```bash
VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY \
  pnpm --filter @workspace/compass run dev
```

Then open `http://localhost:22639` in your browser (or the Replit preview pane).

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/       # Express 5 API server
│   └── compass/          # React + Vite web app
├── lib/
│   ├── db/               # Drizzle ORM schema & DB client
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-zod/          # Generated Zod schemas
│   └── api-client-react/ # Generated React Query hooks
└── scripts/              # Shared utility scripts
```

---

## Key Commands

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm run typecheck:libs` | Build composite lib declarations |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks & Zod schemas from OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes to the database |
| `pnpm --filter @workspace/api-server run build` | Build the API server bundle |

---

## Features

| Feature | Route |
|---|---|
| Landing page | `/` |
| Sign in / Sign up | `/sign-in` · `/sign-up` |
| Dashboard | `/dashboard` |
| Energy Tracker | `/energy` |
| Mentor Discovery | `/mentors` |
| Session Booking | `/sessions` |
| Major Recommendations | `/recommendations` |

---

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, shadcn/ui, TanStack Query
- **Backend**: Express 5, Node.js 24
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (Replit-managed)
- **Validation**: Zod v4 + drizzle-zod
- **API contract**: OpenAPI → Orval codegen
- **Fonts**: Fraunces (serif) + Plus Jakarta Sans
