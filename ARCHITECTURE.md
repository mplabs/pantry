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
- `purchasing/provider.ts`: abstract purchasing provider interface.

5. Persistence
- Prisma schema in `apps/web/prisma/schema.prisma`.
- SQLite bootstrap in `apps/web/prisma/init.sql`.
- Auth tables (`User`, `Account`, `Session`, `Authenticator`) + pantry domain tables.
- Product catalog cache table (`ProductCatalogItem`) for barcode lookups.

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
