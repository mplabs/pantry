# Architecture Notes (Initial)

## Current Stage

Single-page web app with local browser storage for fast iteration.

## Near-Term Target

- Keep domain logic decoupled from UI code.
- Use a small data model for inventory and date-based status.
- Keep API adapter boundaries explicit so automated purchasing can be added later.

## Future Evolution

- Add backend service for shared inventory and authentication.
- Add API integration layer for vendor purchasing.
- Reuse domain logic in a mobile app.
