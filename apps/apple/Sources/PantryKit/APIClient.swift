import Foundation

public enum APIError: Error, LocalizedError {
    case http(status: Int, message: String?)
    case invalidResponse

    public var errorDescription: String? {
        switch self {
        case .http(let s, let m): return m ?? "HTTP \(s)"
        case .invalidResponse: return "Invalid response"
        }
    }
}

public struct APIClient: Sendable {
    public var baseURL: URL
    public var session: AuthSession
    private let urlSession: URLSession

    public init(baseURL: URL = URL(string: "http://localhost:3000")!,
                session: AuthSession = AnonymousSession(),
                urlSession: URLSession = .shared) {
        self.baseURL = baseURL; self.session = session; self.urlSession = urlSession
    }

    // MARK: Endpoints (one per openapi.yaml operation)

    public func households() async throws -> HouseholdsResponse {
        try await send("GET", "api/households")
    }
    public func createHousehold(_ body: CreateHouseholdRequest) async throws -> Household {
        let r: HouseholdResponse = try await send("POST", "api/households", body: body)
        return r.household
    }
    public func items(householdId: String, query: String? = nil, status: FreshnessStatus? = nil) async throws -> [PantryItem] {
        var q: [URLQueryItem] = []
        if let query { q.append(.init(name: "q", value: query)) }
        if let status { q.append(.init(name: "status", value: status.rawValue)) }
        let r: ItemsResponse = try await send("GET", "api/households/\(householdId)/items", query: q)
        return r.items
    }
    public func createItem(householdId: String, _ body: CreateItemRequest) async throws -> PantryItem {
        let r: ItemResponse = try await send("POST", "api/households/\(householdId)/items", body: body)
        return r.item
    }
    public func createInvite(householdId: String) async throws -> CreateInviteResponse {
        try await send("POST", "api/households/\(householdId)/invites")
    }
    public func acceptInvite(token: String) async throws -> AcceptInviteResponse {
        try await send("POST", "api/invites/accept", body: ["token": token])
    }
    public func resolveIngredients(_ ingredients: [String]) async throws -> ResolveIngredientsResponse {
        try await send("POST", "api/language/ingredients/resolve", body: ["ingredients": ingredients])
    }
    public func product(barcode: String) async throws -> BarcodeProduct {
        let r: BarcodeResponse = try await send("GET", "api/products/barcode/\(barcode)")
        return r.product
    }

    // MARK: Transport

    private struct Empty: Encodable {}

    private func send<R: Decodable>(_ method: String, _ path: String,
                                    query: [URLQueryItem] = []) async throws -> R {
        try await send(method, path, query: query, body: Optional<Empty>.none)
    }

    private func send<R: Decodable, B: Encodable>(_ method: String, _ path: String,
                                                  query: [URLQueryItem] = [], body: B?) async throws -> R {
        var comps = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { comps.queryItems = query }
        var req = URLRequest(url: comps.url!)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        req = try await session.authorize(req)

        let (data, resp) = try await urlSession.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let msg = try? JSONDecoder().decode(APIErrorBody.self, from: data).error
            throw APIError.http(status: http.statusCode, message: msg)
        }
        return try Self.decoder.decode(R.self, from: data)
    }

    /// Server emits ISO-8601 with fractional seconds (JS Date.toJSON()).
    public static var decoder: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .custom { dec in
            let s = try dec.singleValueContainer().decode(String.self)
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = f.date(from: s) { return date }
            f.formatOptions = [.withInternetDateTime]
            if let date = f.date(from: s) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: dec.codingPath, debugDescription: "Bad date \(s)"))
        }
        return d
    }
}
