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
9. Publish OpenAPI contract for Flutter integration (`apps/web/openapi.yaml`).
10. Add barcode lookup flow with camera/USB input and product metadata caching.

## In Progress

1. Add production-ready auth hardening (session security policy, abuse limits, recovery UX).
2. Replace deterministic SQLite bootstrap with robust migration workflow.

## Next

1. Add item edit/delete + stock decrement workflows.
2. Add low-stock thresholds and recurring-needs model.
3. Add purchasing orchestration endpoints using `PurchasingProvider` abstractions.
4. Add invite management UI (revoke, list history, expiration controls).
5. Add API tests and contract tests against OpenAPI.
6. Start Flutter client scaffold using current API contract.
