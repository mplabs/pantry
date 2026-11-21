import Foundation

/// Seam for authenticating requests. Auth.js uses a cookie session (`authjs.session-token`).
/// TODO(passkeys): implement a session that performs the WebAuthn flow against the Auth.js
/// endpoints (ASAuthorizationPlatformPublicKeyCredentialProvider) and persists the cookie
/// (Keychain). Not implemented yet; see apps/apple/README.md.
public protocol AuthSession: Sendable {
    func authorize(_ request: URLRequest) async throws -> URLRequest
}

/// No credentials; every call will 401 against a real backend.
public struct AnonymousSession: AuthSession {
    public init() {}
    public func authorize(_ request: URLRequest) async throws -> URLRequest { request }
}

/// Dev-only: paste a session cookie value copied from a browser signed in to the web app.
public struct StaticCookieSession: AuthSession {
    public let cookieName: String
    public let value: String
    public init(value: String, cookieName: String = "authjs.session-token") {
        self.value = value; self.cookieName = cookieName
    }
    public func authorize(_ request: URLRequest) async throws -> URLRequest {
        var r = request
        r.setValue("\(cookieName)=\(value)", forHTTPHeaderField: "Cookie")
        return r
    }
}
