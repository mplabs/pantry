import SwiftUI
import PantryKit

struct HouseholdListView: View {
    let client: APIClient
    @State private var households: [Household] = []
    @State private var error: String?

    var body: some View {
        NavigationStack {
            List(households) { h in
                NavigationLink(h.name) { ItemListView(client: client, household: h) }
            }
            .overlay { if let error { Text(error).foregroundStyle(.red).padding() } }
            .navigationTitle("Households")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        do { households = try await client.households().households; error = nil }
        catch { self.error = error.localizedDescription }
    }
}

struct ItemListView: View {
    let client: APIClient
    let household: Household
    @State private var items: [PantryItem] = []
    @State private var error: String?

    var body: some View {
        List(items) { item in
            HStack {
                VStack(alignment: .leading) {
                    Text(item.primaryName)
                    Text(item.category).font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(item.quantity.formatted()) \(item.unit ?? "")")
            }
        }
        .overlay { if let error { Text(error).foregroundStyle(.red).padding() } }
        .navigationTitle(household.name)
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        do { items = try await client.items(householdId: household.id); error = nil }
        catch { self.error = error.localizedDescription }
    }
}
