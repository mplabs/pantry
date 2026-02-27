# AGENTS

## Project Preferences

1. Framework: Use Next.js for web.
2. Tenancy: Multi-user with shared households.
3. Shelf-life policy: Category-specific defaults, overridable per item.
4. Purchasing: Keep an abstract provider interface now; target REWE and Ökomarktgemeinschaft later.
5. Backend: Required (API + database), not frontend-only.
6. Mobile target: Flutter.
7. Language handling: Support multilingual pantry input and matching (at minimum English/German).

## Working Agreements

1. Keep architecture decisions documented in `ARCHITECTURE.md`.
2. Keep implementation roadmap and task tracking in `PLAN.md`.
3. Commit progress in small, reviewable checkpoints.
4. Prefer API-first domain modeling so Flutter can reuse backend contracts.
