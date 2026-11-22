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

/// Stub for the real passkey (WebAuthn) session. Intentionally not implemented: needs an auth-design decision.
public struct PasskeyAuthSession: AuthSession {
    public enum Failure: Error, LocalizedError {
        case notImplemented
        public var errorDescription: String? { "Passkey sign-in is not implemented yet. Use the dev session cookie." }
    }
    public let baseURL: URL
    public init(baseURL: URL) { self.baseURL = baseURL }
    /// Would run the WebAuthn ceremony against the Auth.js endpoints and return a cookie session.
    public func signIn() async throws -> StaticCookieSession { throw Failure.notImplemented }
    public func authorize(_ request: URLRequest) async throws -> URLRequest { throw Failure.notImplemented }
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
