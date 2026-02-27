# PLAN

## Completed

1. Initialize repository and baseline docs.
2. Migrate web prototype to Next.js.
3. Add multi-user/shared-household schema and API routes.
4. Add category shelf-life defaults and freshness status logic.
5. Add multilingual canonicalization and EN/DE alias search.
6. Add purchasing provider abstraction.
7. Add deterministic SQLite bootstrap (`db:init`) and demo seeding script.

## In Progress

1. Harden database migration workflow for local/dev/prod parity.
2. Replace demo bootstrap with real authentication and household invitations.

## Next

1. Add stock decrement and low-stock thresholds per household.
2. Add recurring-needs model for auto-buy candidate generation.
3. Add provider orchestration endpoints behind `PurchasingProvider`.
4. Add test coverage for API handlers and multilingual matching.
5. Add localization layer for the UI itself (not just item matching).
6. Add OpenAPI spec for Flutter integration.
7. Add CI checks for lint, build, and API contract validation.
