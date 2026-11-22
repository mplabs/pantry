import SwiftUI
import PantryKit

/// Signed-in state: base URL + session cookie, persisted in Keychain.
@MainActor
final class SessionModel: ObservableObject {
    private let store = KeychainStore()
    @Published var baseURL: String
    @Published var cookie: String?

    init() {
        let env = ProcessInfo.processInfo.environment
        baseURL = store.get("baseURL") ?? env["PANTRY_BASE_URL"] ?? "http://localhost:3000"
        cookie = store.get("cookie") ?? env["PANTRY_SESSION_COOKIE"]
    }

    var client: APIClient? {
        guard let cookie, let url = URL(string: baseURL) else { return nil }
        return APIClient(baseURL: url, session: StaticCookieSession(value: cookie))
    }

    func signIn(cookie: String) {
        store.set("baseURL", baseURL); store.set("cookie", cookie); self.cookie = cookie
    }
    func signOut() { store.remove("cookie"); cookie = nil }
}

struct RootView: View {
    @StateObject private var model = SessionModel()
    var body: some View {
        if let client = model.client {
            HouseholdListView(client: client)
                .toolbar { Button("Sign out") { model.signOut() } }
        } else {
            SignInView(model: model)
        }
    }
}

struct SignInView: View {
    @ObservedObject var model: SessionModel
    @State private var devCookie = ""
    @State private var error: String?

    var body: some View {
        Form {
            Section("Server") {
                TextField("Base URL", text: $model.baseURL).autocorrectionDisabled()
                #if os(iOS)
                    .textInputAutocapitalization(.never).keyboardType(.URL)
                #endif
            }
            Section {
                Button("Sign in") { Task { await passkey() } }
                    .disabled(URL(string: model.baseURL) == nil)
            }
            // ponytail: dev-only fallback until passkeys land; remove with the real flow.
            Section("Dev: session cookie (authjs.session-token)") {
                SecureField("Cookie value", text: $devCookie)
                Button("Use cookie") { model.signIn(cookie: devCookie) }.disabled(devCookie.isEmpty)
            }
            if let error { Text(error).foregroundStyle(.red) }
        }
        .formStyle(.grouped)
        .frame(maxWidth: 480)
    }

    private func passkey() async {
        guard let url = URL(string: model.baseURL) else { return }
        do { model.signIn(cookie: try await PasskeyAuthSession(baseURL: url).signIn().value) }
        catch { self.error = error.localizedDescription }
    }
}
