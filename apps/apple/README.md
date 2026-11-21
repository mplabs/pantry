# Pantry Apple client (iOS + macOS)

SwiftUI client scaffold. Swift Package, no hand-written `.xcodeproj`.

- `PantryKit` - async/await `APIClient` (URLSession, configurable `baseURL`), Codable models, `AuthSession` seam.
- `PantryApp` - minimal SwiftUI app: households list -> items list. Targets iOS 17 / macOS 14.

## Build / run

```sh
cd apps/apple
swift build && swift test      # macOS host
open Package.swift             # Xcode: pick the PantryApp scheme, run on a Mac or iOS simulator
```

`swift build` only builds for macOS. The iOS build and a proper app bundle (Info.plist,
ATS exception for http://localhost, signing, passkey entitlements) need an Xcode app project
that depends on this package; the executable target is just the SwiftUI sources.

Dev run against the web backend: set `PANTRY_BASE_URL` (default `http://localhost:3000`) and
`PANTRY_SESSION_COOKIE` (value of the `authjs.session-token` cookie from a signed-in browser).

## Mapping to `apps/web/openapi.yaml`

| Operation | `APIClient` method |
|---|---|
| GET/POST `/api/households` | `households()`, `createHousehold(_:)` |
| GET/POST `/api/households/{id}/items` | `items(householdId:query:status:)`, `createItem(householdId:_:)` |
| POST `/api/households/{id}/invites` | `createInvite(householdId:)` |
| POST `/api/invites/accept` | `acceptInvite(token:)` |
| POST `/api/language/ingredients/resolve` | `resolveIngredients(_:)` |
| GET `/api/products/barcode/{barcode}` | `product(barcode:)` |

Several 2xx responses are undocumented in the YAML (no schema); those models in `Models.swift`
follow the route handlers in `apps/web/src/app/api`. Models are hand-written; generating them with
`swift-openapi-generator` is a later option once the YAML has full response schemas.

## TODO: authentication

Auth.js passkeys use a cookie session (`authjs.session-token`). **Passkey login is not implemented.**
`AuthSession` (`authorize(_ request:)`) is the seam: implement a passkey-backed session
(`ASAuthorizationPlatformPublicKeyCredentialProvider` against the Auth.js WebAuthn endpoints, cookie
stored in Keychain) and pass it to `APIClient`. Until then, `StaticCookieSession` is a dev stand-in.
