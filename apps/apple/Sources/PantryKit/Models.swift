import Foundation

// Mirrors apps/web/openapi.yaml schemas. Response shapes the YAML leaves
// undocumented (households, invites, barcode, resolve) follow the route handlers.

public struct APIErrorBody: Codable, Sendable { public let error: String }

public enum HouseholdRole: String, Codable, Sendable { case OWNER, ADMIN, MEMBER }

public struct UserRef: Codable, Hashable, Sendable {
    public let id: String
    public let name: String?
    public let email: String
}

public struct HouseholdMember: Codable, Hashable, Sendable {
    public let id: String
    public let role: HouseholdRole
    public let user: UserRef
}

public struct Household: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let name: String
    public let defaultLocale: String
    public let memberships: [HouseholdMember]
}

/// GET /api/households
public struct HouseholdsResponse: Codable, Sendable {
    public let households: [Household]
    public let currentUser: UserRef?
}

public struct PantryItem: Codable, Identifiable, Hashable, Sendable {
    public let id: String
    public let barcode: String?
    public let primaryName: String
    public let canonicalName: String
    public let quantity: Double
    public let unit: String?
    public let category: String
    public let useByDate: Date?
}

public struct ItemsResponse: Codable, Sendable { public let items: [PantryItem] }
public struct ItemResponse: Codable, Sendable { public let item: PantryItem }

public enum FreshnessStatus: String, Codable, Sendable { case fresh, expiring, expired }

public struct CreateHouseholdRequest: Codable, Sendable {
    public var name: String
    public var defaultLocale: String?
    public init(name: String, defaultLocale: String? = nil) {
        self.name = name; self.defaultLocale = defaultLocale
    }
}

public struct HouseholdResponse: Codable, Sendable { public let household: Household }

public struct CreateItemRequest: Codable, Sendable {
    public var name: String
    public var quantity: Double
    public var barcode: String?
    public var unit: String?
    public var category: String?
    public var location: String?
    public var purchaseDate: String?   // yyyy-MM-dd
    public var useByDate: String?      // yyyy-MM-dd
    public var shelfLifeDays: Int?
    public var notes: String?
    public var localizedNames: [String: String]?
    public init(name: String, quantity: Double) { self.name = name; self.quantity = quantity }
}

public struct Invite: Codable, Sendable {
    public let token: String
    public let expiresAt: Date
}

public struct CreateInviteResponse: Codable, Sendable {
    public let invite: Invite
    public let inviteUrl: URL
}

public struct AcceptInviteResponse: Codable, Sendable {
    public struct HouseholdRef: Codable, Sendable { public let id: String; public let name: String }
    public let household: HouseholdRef
}

public struct ResolvedIngredient: Codable, Hashable, Sendable {
    public let input: String
    public let canonical: String
    public let aliases: [String]
}

public struct ResolveIngredientsResponse: Codable, Sendable {
    public let normalized: [ResolvedIngredient]
    public let llmEnabled: Bool
}

public struct BarcodeProduct: Codable, Hashable, Sendable {
    public let barcode: String
    public let source: String
    public let productName: String
    public let normalizedProductName: String
    public let brand: String?
    public let quantityLabel: String?
    public let imageUrl: String?
    public let category: String
    public let fromCache: Bool
}

public struct BarcodeResponse: Codable, Sendable { public let product: BarcodeProduct }
