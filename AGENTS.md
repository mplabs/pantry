# AGENTS

## Project Preferences

1. Framework: Next.js for web.
2. Styling: Tailwind CSS.
3. Tenancy: Multi-user with shared households.
4. Household UX: Select from existing shared households; join via invite links.
5. Shelf-life policy: Category-specific defaults with per-item overrides.
6. Backend: Required (API + database), not frontend-only.
7. Auth: Auth.js with passkeys.
8. Native client target: Swift/SwiftUI app for iOS and macOS (in `apps/apple`).
9. Language policy:
- UI can stay English-only.
- Ingredient and recipe terms must be language-independent.
- EN recipe terms should map to DE shopping terms (LLM-assisted when available).
10. Purchasing: Keep abstract provider interface now; REWE and Ökomarktgemeinschaft later.

## Working Agreements

1. Keep architectural decisions in `ARCHITECTURE.md`.
2. Keep roadmap/work tracking in `PLAN.md`.
3. Commit progress in small, reviewable checkpoints.
4. Prefer API-first design so the Swift app reuses backend contracts.
