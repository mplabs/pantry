# Pantry OS Web

Next.js web + API app for Pantry OS.

## Commands

```bash
npm install
npm run prisma:generate
npm run db:init
npm run dev
```

Optional demo data:

```bash
npm run db:seed-demo
```

## API

- `POST /api/bootstrap`
- `GET/POST /api/users`
- `GET/POST /api/households`
- `GET/POST /api/households/:householdId/items`

## Notes

- SQLite file: `prisma/dev.db`
- Schema bootstrap SQL: `prisma/init.sql`
- Prisma migrations are not used yet in this environment; use `db:init`.
