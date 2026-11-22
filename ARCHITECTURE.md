# ARCHITECTURE

## Scope

Pantry OS is a shared-household pantry system with:

- Web client now (Next.js + Tailwind).
- Swift/SwiftUI client for iOS and macOS next (reusing backend API contracts).
- Auth.js passkeys for authentication.
- Language-independent ingredient handling for EN recipes and DE shopping.

## Core Interaction Model

1. User signs in with passkey.
2. User sees households where they are a member.
3. User selects one household as active context.
4. Household members share one inventory view.
5. Members can generate invite links; recipient opens `/join/:token` and joins household.

This directly supports "select a household and see shared households" with link-based invites.

## Components

1. Web UI (`apps/web/src/app`, `apps/web/src/components`)
- English-only UI.
- Tailwind styling.
- Household selection, inventory operations, invite generation, recipe-language bridge.

2. Auth (`apps/web/src/auth.ts`)
- Auth.js v5 + Prisma adapter.
- Passkey provider (`next-auth/providers/passkey`).
- Session-backed route protection.
- Session policy: database sessions, 30-day `maxAge`, 24h `updateAge` (sliding). Secure cookies in production; `trustHost` is on in dev and in prod only with `AUTH_TRUST_HOST=true` (set `AUTH_URL` + `AUTH_SECRET`).
- Abuse limits: in-memory sliding window (`lib/http/rate-limit.ts`) on passkey options/callback (20/min/IP) and invite accept (10/min/user), returning 429 + `Retry-After`. Per-process only; move to Redis/DB counters if running multiple instances. IP comes from `X-Forwarded-For`, so only trustworthy behind a proxy that sets it.
- Recovery: no schema changes, so recovery = add a second passkey from a signed-in session ("Add passkey"); the sign-in card tells users this. Known gap: no self-service recovery if all passkeys are lost (needs email magic-link/recovery codes + schema/provider work).

3. API (Next.js route handlers)
- `/api/households`: list/create households for current user.
- `/api/households/[householdId]/items`: shared inventory list/create.
- `/api/households/[householdId]/invites`: generate invite URL.
- `/api/invites/accept`: join household using token.
- `/api/language/ingredients/resolve`: normalize ingredient names.
- `/api/products/barcode/[barcode]`: resolve barcode to cached product metadata.

4. Domain Services (`apps/web/src/lib`)
- `inventory/category-defaults.ts`: shelf-life defaults.
- `inventory/freshness.ts`: freshness status derivation.
- `inventory/name-lexicon.ts`: deterministic EN/DE lexical mappings.
- `language/ingredient-normalizer.ts`: canonicalization + alias expansion.
- `language/translator.ts`: optional LLM-backed normalization when `OPENAI_API_KEY` exists.
- `barcode/openfoodfacts.ts`: external barcode product lookup adapter.
- `barcode/catalog.ts`: product cache orchestration and local upsert logic.
- `purchasing/provider.ts`: abstract purchasing provider interface (`searchOffers`, `submitOrder`).
- `purchasing/mock-provider.ts` + `registry.ts`: deterministic mock provider (default); pick via `PURCHASING_PROVIDER`. REWE / Ökomarktgemeinschaft adapters register here later.
- `purchasing/shopping.ts`: maps a recipe term to its German shopping term via the ingredient normalizer, then queries the provider.
- Routes `/api/households/{id}/purchasing/{providers,search,cart}`: cart is a preview only; no checkout or ordering is exposed.

5. Persistence
- Prisma schema in `apps/web/prisma/schema.prisma`.
- SQLite schema is managed by Prisma Migrations in `apps/web/prisma/migrations/` (committed; `*.db` is gitignored).
- Auth tables (`User`, `Account`, `Session`, `Authenticator`) + pantry domain tables.
- Product catalog cache table (`ProductCatalogItem`) for barcode lookups.

### Database Migrations

- Fresh checkout / CI / tests: `npm run db:deploy` (alias `db:init`) applies all migrations (`prisma migrate deploy`). `npm run db:reset` wipes the dev DB and re-applies them.
- Add a migration: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name <change>`, commit the generated `prisma/migrations/<ts>_<change>/` folder together with the schema change. Never edit an applied migration.
- Tests build their temp DB with `prisma migrate deploy` (`tests/global-setup.ts`).
- Baselining an existing dev DB created from the old `init.sql` (tables exist, no `_prisma_migrations`): run `npx prisma migrate resolve --applied 20260101000000_init`, then `npx prisma migrate status` should be clean. Or just `npm run db:reset` if the data is disposable.

## Language-Independent Ingredient Strategy

- Keep UI language fixed to English.
- Convert user input and recipe ingredients into canonical keys.
- Persist aliases per item (`PantryItemName`) for EN/DE terms.
- Optional LLM normalization augments deterministic lexicon fallback.
- This supports mapping English recipe ingredients to German shopping terms.

## Native Client (Swift) Readiness

- API-first architecture and OpenAPI spec (`apps/web/openapi.yaml`).
- Swift client can consume existing household, invite, inventory, and language endpoints.

## Future Extensions

- Replace SQLite bootstrap with migration-based managed Postgres flow.
- Add RBAC refinements per household role.
- Implement provider adapters for REWE and Ökomarktgemeinschaft.
- Add recurring-buy rules and checkout orchestration flows.
