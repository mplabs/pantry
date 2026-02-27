# ARCHITECTURE

## Scope

Pantry OS is a shared-household inventory platform with web-first delivery and a Flutter mobile target.

## Principles

- Keep domain logic API-first so web and Flutter clients reuse the same backend.
- Support multilingual item naming and search from the start.
- Separate purchasing orchestration behind provider interfaces.
- Optimize for incremental evolution: local SQLite now, managed database later.

## System Components

1. Next.js Web App (`apps/web`)
- App Router UI for inventory workflows.
- Client-side forms for setup and item management.

2. Backend API (Next.js Route Handlers)
- `/api/users`: user lifecycle for shared households.
- `/api/households`: household creation/listing.
- `/api/households/[householdId]/items`: inventory query/create.
- `/api/bootstrap`: demo workspace initialization.

3. Domain Libraries (`src/lib`)
- `inventory/category-defaults.ts`: category shelf-life defaults.
- `inventory/freshness.ts`: status derivation (`fresh`, `expiring`, `expired`).
- `inventory/name-lexicon.ts`: canonicalization and EN/DE alias support.
- `purchasing/provider.ts`: abstract purchasing provider contract.

4. Data Layer
- Prisma client for data access.
- SQLite as the initial persistence engine (`apps/web/prisma/dev.db`).
- SQL bootstrap script (`apps/web/prisma/init.sql`) for deterministic schema setup.

## Data Model

- `User`: identity + locale preferences.
- `Household`: shared inventory boundary.
- `HouseholdMembership`: user roles per household (`OWNER`, `MEMBER`).
- `PantryItem`: stock record with category, quantity, and shelf/use-by fields.
- `PantryItemName`: localized and alias names per item for multilingual lookup.

## Multilingual Strategy

- Normalize names (case/diacritic insensitive).
- Canonicalize known aliases (for example `milk` and `Milch` => canonical `milk`).
- Persist localized item names (`en`, `de`, and undetermined locale).
- Search checks canonical key, normalized primary name, and alias table.

## Shelf-Life Strategy

- Category defaults provide baseline shelf-life days.
- Item-specific `shelfLifeDays` and `useByDate` override defaults.
- If `useByDate` is absent, derive it from purchase date + effective shelf life.

## Future Extension Points

- AuthN/AuthZ: replace demo bootstrap with real auth and session handling.
- Managed DB: move from SQLite to Postgres with standard migrations.
- Purchasing integrations: implement provider adapters for REWE and Ökomarktgemeinschaft.
- Eventing: emit low-stock/expiry events for auto-buy workflows.
- Flutter client: consume current APIs and shared domain rules.
