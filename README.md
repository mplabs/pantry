# Pantry Inventory System

Pantry OS is a web-first pantry inventory system for **shared households**.

## Product Direction

- Next.js for web UI + backend API routes.
- Multi-user households with shared inventory.
- Category-based shelf life defaults and use-by date tracking.
- Multilingual naming and search (for example, `milk` / `Milch`).
- Abstract purchasing provider interface to support future API integrations.
- Mobile target is Flutter, backed by the same API/domain model.

## Repository Layout

- `apps/web`: Next.js app (frontend + API + database integration).
- `ARCHITECTURE.md`: System design and boundaries.
- `PLAN.md`: Work items and implementation roadmap.
- `AGENTS.md`: Stored project preferences and operating constraints.

## Quick Start

```bash
cd apps/web
npm install
npm run prisma:generate
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints (Current)

- `POST /api/bootstrap`: Creates/returns a shared demo household and users.
- `GET/POST /api/users`: List/create users.
- `GET/POST /api/households`: List/create households.
- `GET/POST /api/households/:householdId/items`: Query/create pantry items.

## Notes

- Prisma schema engine commands (`migrate dev`, `db push`) are currently unreliable in this environment. The project uses `npm run db:init` as the deterministic SQLite schema bootstrap.
