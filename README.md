# Pantry Inventory System

This repository contains the starter implementation for a pantry inventory management system.

## Goals

- Track pantry items and quantities.
- Track shelf life and use-by dates.
- Highlight items that are expiring soon.
- Prepare for future API integrations for automatic re-ordering.
- Start with a web UI and keep architecture open for a future mobile app.

## Initial Plan

1. Create a simple web app (`apps/web`) for local pantry tracking.
2. Model core pantry entities and status rules (fresh, expiring soon, expired).
3. Persist data locally first, then introduce backend/API adapters.
4. Add integration interfaces for future purchasing automation APIs.
5. Reuse core logic for a future mobile client.

## Repository Layout

- `apps/web`: Browser-based UI prototype.
- `docs`: Architecture and product notes.
