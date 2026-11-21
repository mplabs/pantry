import XCTest
@testable import PantryKit

final class DecodingTests: XCTestCase {
    func testItemsDecode() throws {
        let json = #"{"items":[{"id":"1","barcode":null,"primaryName":"Milk","canonicalName":"milk","quantity":1.5,"unit":"L","category":"dairy","useByDate":"2026-12-01T00:00:00.000Z"}]}"#
        let r = try APIClient.decoder.decode(ItemsResponse.self, from: Data(json.utf8))
        XCTAssertEqual(r.items[0].primaryName, "Milk")
        XCTAssertNotNil(r.items[0].useByDate)
    }

    func testHouseholdsDecode() throws {
        let json = #"{"households":[{"id":"h","name":"Home","defaultLocale":"de","memberships":[{"id":"m","role":"OWNER","user":{"id":"u","name":null,"email":"a@b.c"}}],"invites":[]}],"currentUser":{"id":"u","name":null,"email":"a@b.c"}}"#
        let r = try APIClient.decoder.decode(HouseholdsResponse.self, from: Data(json.utf8))
        XCTAssertEqual(r.households[0].memberships[0].role, .OWNER)
    }
}
