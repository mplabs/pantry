import Foundation
import Security

/// Tiny Keychain wrapper (generic password items) for the session cookie value and base URL.
public struct KeychainStore: Sendable {
    public let service: String
    public init(service: String = "app.pantry.session") { self.service = service }

    private func query(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key]
    }
    public func get(_ key: String) -> String? {
        var q = query(key); q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
    public func set(_ key: String, _ value: String) {
        SecItemDelete(query(key) as CFDictionary)
        var q = query(key); q[kSecValueData as String] = Data(value.utf8)
        SecItemAdd(q as CFDictionary, nil)
    }
    public func remove(_ key: String) { SecItemDelete(query(key) as CFDictionary) }
}
