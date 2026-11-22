# Pantry Apple client (iOS + macOS)

SwiftUI client. Swift Package plus an XcodeGen-generated app project (`project.yml`).

- `PantryKit` - async/await `APIClient` (URLSession, configurable `baseURL`), Codable models, `AuthSession` seam.
- `PantryApp` - shared SwiftUI views: sign-in, households list -> items list. Targets iOS 17 / macOS 14.

## Build / run

```sh
cd apps/apple
swift build && swift test      # package only (macOS host)
brew install xcodegen          # once
xcodegen generate              # project.yml -> Pantry.xcodeproj (git-ignored, regenerate on changes)
open Pantry.xcodeproj          # scheme "Pantry": run on My Mac or an iOS 17 simulator
xcodebuild -project Pantry.xcodeproj -scheme Pantry -destination 'platform=macOS' CODE_SIGNING_ALLOWED=NO build
```

The Xcode app target (`project.yml`) is multiplatform (iOS 17 / macOS 14), depends on the local
`PantryKit` package and compiles the shared SwiftUI views in `Sources/PantryApp` (everything except
the SPM-only `PantryAppMain.swift`) plus `App/` (`@main`, `Info.plist`, entitlements). Verified:
macOS and iOS Simulator builds succeed unsigned.

- ATS: `App/Info.plist` allows cleartext HTTP to `localhost` only. DEV ONLY; drop for release builds.
- Signing: set `DEVELOPMENT_TEAM` locally (not committed) for device builds.
- Passkey entitlement placeholder: `App/Pantry.entitlements` is empty. Once the web app has a real
  domain, add `com.apple.developer.associated-domains = ["webcredentials:<domain>"]` there, host
  `/.well-known/apple-app-site-association` (`webcredentials.apps: ["<TEAMID>.app.pantry.client"]`) on
  that domain, and set the matching WebAuthn RP ID in Auth.js. No domain is invented here.

Sign-in screen (`SignInView`): base URL field + "Sign in" (calls `PasskeyAuthSession`, currently throws
`notImplemented`) and a dev-only "paste `authjs.session-token`" fallback. Base URL and cookie are kept in
Keychain (`KeychainStore`); `PANTRY_BASE_URL` / `PANTRY_SESSION_COOKIE` env vars still seed them.
Keychain on macOS needs a signed build; unsigned runs may silently fail to persist.

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

Auth.js passkeys use a cookie session (`authjs.session-token`). **Passkey login is not implemented** (`PasskeyAuthSession` is a stub throwing `notImplemented`).
`AuthSession` (`authorize(_ request:)`) is the seam: implement a passkey-backed session
(`ASAuthorizationPlatformPublicKeyCredentialProvider` against the Auth.js WebAuthn endpoints, cookie
stored in Keychain) and pass it to `APIClient`. Until then, `StaticCookieSession` is a dev stand-in.
