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

`npm run dev` now starts HTTPS development mode (self-signed certificate). Use `https://localhost:3000`. If you open the app via LAN IP (for example `https://10.10.10.170:3000`), the generated cert may not match that host.

Database scripts: `db:init`/`db:deploy` apply migrations, `db:migrate` creates a new one (dev), `db:reset` wipes and re-applies, `db:seed-demo` adds demo data. Details: `../ARCHITECTURE.md`.

## Required Environment Variables

- `DATABASE_URL` (default: `file:./dev.db`)
- `AUTH_SECRET` (Auth.js session encryption secret)

Optional:

- `INGREDIENT_TRANSLATOR_PROVIDER` (`auto`, `ollama`, `openai`, `noop`)
- `OLLAMA_BASE_URL` and `OLLAMA_MODEL` for Ollama-backed normalization
- `OPENAI_API_KEY` and `OPENAI_MODEL` for OpenAI-backed normalization
- `OPEN_FOOD_FACTS_USER_AGENT` for barcode product lookups
- `BARCODE_PRODUCT_CACHE_DAYS` for barcode cache freshness

## API Endpoints

- `GET/POST /api/households`
- `GET/POST /api/households/:householdId/items`
- `POST /api/households/:householdId/invites`
- `POST /api/invites/accept`
- `POST /api/language/ingredients/resolve`
- `GET /api/products/barcode/:barcode`
- `GET/POST /api/auth/[...nextauth]`

## Docs

- OpenAPI: `openapi.yaml`
- Architecture: `../ARCHITECTURE.md`
- Plan: `../PLAN.md`
