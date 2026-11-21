# Pantry Inventory System

Pantry OS is a web-first pantry inventory platform for shared households.

## Current Direction

- Next.js (App Router) with backend API routes.
- Auth.js with passkey authentication.
- Shared households with invite links.
- Category-based shelf-life defaults and use-by tracking.
- English UI, with language-independent ingredient normalization for EN/DE shopping flows.
- OpenAPI contract for upcoming Swift (iOS/macOS) client integration.

## Repository Layout

- `apps/web`: Web app + backend API + SQLite/Prisma.
- `ARCHITECTURE.md`: Architectural design and interaction model.
- `PLAN.md`: Work plan and roadmap.
- `AGENTS.md`: Project preferences and working agreements.

## Quick Start

```bash
cd apps/web
npm install
cp .env.example .env
npm run prisma:generate
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Snapshot

- `GET/POST /api/households`
- `GET/POST /api/households/:householdId/items`
- `POST /api/households/:householdId/invites`
- `POST /api/invites/accept`
- `POST /api/language/ingredients/resolve`
- `GET /api/products/barcode/:barcode`
- `GET/POST /api/auth/[...nextauth]`

## Notes

- The SQLite schema is created from Prisma migrations via `npm run db:init` (see "Database Migrations" in `ARCHITECTURE.md`).
- OpenAPI spec for Swift client generation: `apps/web/openapi.yaml`.
