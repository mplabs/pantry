# Pantry OS Web

Next.js web app + backend API for Pantry OS.

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run db:init
npm run dev
```

## Required Environment Variables

- `DATABASE_URL` (default: `file:./dev.db`)
- `AUTH_SECRET` (Auth.js session encryption secret)

Optional:

- `OPENAI_API_KEY` for LLM-assisted ingredient normalization
- `OPENAI_MODEL` to override default model

## API Endpoints

- `GET/POST /api/households`
- `GET/POST /api/households/:householdId/items`
- `POST /api/households/:householdId/invites`
- `POST /api/invites/accept`
- `POST /api/language/ingredients/resolve`
- `GET/POST /api/auth/[...nextauth]`

## Docs

- OpenAPI: `openapi.yaml`
- Architecture: `../ARCHITECTURE.md`
- Plan: `../PLAN.md`
