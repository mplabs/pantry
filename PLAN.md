# PLAN

## Completed

1. Initialize repository and baseline docs.
2. Migrate to Next.js app architecture.
3. Implement Auth.js with passkey support.
4. Model shared households and membership roles.
5. Implement household selection and invite-link join flow.
6. Implement category shelf-life defaults and freshness statuses.
7. Implement language-independent ingredient normalization endpoint.
8. Add Tailwind-based web UI refresh.
9. Publish OpenAPI contract for native client integration (`apps/web/openapi.yaml`).
10. Add barcode lookup flow with camera/USB input and product metadata caching.
11. Add item edit/delete + stock decrement workflows (API + basic dashboard UI).
12. Add API tests (Vitest) and an OpenAPI contract test (`npm test` in `apps/web`).
13. Scaffold Swift client in `apps/apple` (PantryKit + SwiftUI list app).

## In Progress

1. Auth hardening: session policy and rate limits landed; remaining: self-service recovery when all passkeys are lost, confirm behavior when registering a passkey for an existing email.
2. Replace deterministic SQLite bootstrap with robust migration workflow.

## Next

1. Fix bugs found by tests (pinned as `it.fails` in `apps/web/tests/api-routes.test.ts` / `normalizer.test.ts`): item create 500 on lexicon names (alias dedupe ignores locale vs. unique index), and noop translator overriding the lexicon (e.g. "Milch" -> "milch" instead of "milk").
2. Add low-stock thresholds and recurring-needs model.
3. Add purchasing orchestration endpoints using `PurchasingProvider` abstractions.
4. Add invite management UI (revoke, list history, expiration controls).
5. Add OpenAPI response schemas for households, invites, accept, resolve, barcode (Swift models currently mirror route handlers).
6. Swift client: passkey `AuthSession`, Xcode app project (signing, ATS, associated domain), sign-in UI.
