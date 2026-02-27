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

- `INGREDIENT_TRANSLATOR_PROVIDER` (`auto`, `ollama`, `openai`, `noop`)
- `OLLAMA_BASE_URL` and `OLLAMA_MODEL` for Ollama-backed normalization
- `OPENAI_API_KEY` and `OPENAI_MODEL` for OpenAI-backed normalization

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
