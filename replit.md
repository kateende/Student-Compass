# Compass — Student Lifecycle Platform

## Overview

pnpm workspace monorepo using TypeScript. Full-stack student lifecycle platform with React + Vite frontend, Express API backend, PostgreSQL via Drizzle ORM, and Clerk authentication.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (Replit-managed)
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui
- **Fonts**: Fraunces (serif) + Plus Jakarta Sans

## Artifacts

- `artifacts/compass` — Web app (React + Vite), served at `/`, port 22639
- `artifacts/api-server` — Express API server, served at `/api`, port 8080

## Shared Libraries

- `lib/db` — Drizzle ORM schema + DB client (PostgreSQL)
- `lib/api-spec` — OpenAPI spec (`openapi.yaml`) + Orval codegen config
- `lib/api-zod` — Generated Zod schemas from OpenAPI spec
- `lib/api-client-react` — Generated React Query hooks from OpenAPI spec

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite lib declarations
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Features

- **Energy Tracker** — log tasks with energy 1–10, categories, history, dashboard charts
- **Mentor Discovery** — browse near-peer mentors with search, ratings, availability
- **Session Booking** — book sessions with mentors, mark complete/cancel
- **Major Recommendations** — AI-driven major matches with confidence scores

## Authentication (Clerk)

- Replit-managed Clerk instance (provisioned via `setupClerkWhitelabelAuth()`)
- Dev run command in artifact.toml passes `VITE_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY`
- Routes: `/sign-in`, `/sign-up` (Clerk components with custom Compass branding)
- Landing page at `/` for unauthenticated users; redirects to `/dashboard` when signed in
- `requireAuth` middleware on all protected API endpoints (energy logs, sessions, dashboard)
- Energy logs and sessions are scoped per `userId` (Clerk user ID stored in DB)
- Mentors and major recommendations are global (shared across all users)

## Database Schema

Tables: `categories`, `energy_logs` (with `user_id`), `mentors`, `sessions` (with `user_id`), `major_recommendations`

## Theme

- Primary: forest green `hsl(145, 35%, 25%)`
- Secondary: tawny amber `hsl(35, 60%, 55%)`
- Background: cream/linen `hsl(40, 33%, 96%)`
