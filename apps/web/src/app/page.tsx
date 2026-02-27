"use client";

import { FormEvent, useMemo, useState } from "react";

type User = {
  id: string;
  displayName: string;
  email: string | null;
};

type PantryItem = {
  id: string;
  primaryName: string;
  quantity: number;
  unit: string | null;
  category: string;
  location: string | null;
  useByDate: string | null;
  shelfLifeDays: number | null;
  status: "fresh" | "expiring" | "expired";
  names: Array<{
    id: string;
    locale: string;
    text: string;
  }>;
};

type StatusFilter = "all" | "fresh" | "expiring" | "expired";
type CategoryOption =
  | "DAIRY"
  | "PRODUCE"
  | "MEAT"
  | "FROZEN"
  | "CANNED"
  | "GRAINS"
  | "LEGUMES"
  | "SPICES"
  | "BEVERAGES"
  | "BAKING"
  | "SNACKS"
  | "OTHER";

const CATEGORIES: CategoryOption[] = [
  "DAIRY",
  "PRODUCE",
  "MEAT",
  "FROZEN",
  "CANNED",
  "GRAINS",
  "LEGUMES",
  "SPICES",
  "BEVERAGES",
  "BAKING",
  "SNACKS",
  "OTHER",
];

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
}

function formatDate(value: string | null): string {
  if (!value) return "Auto from shelf life";
  return new Date(value).toLocaleDateString();
}

export default function Home() {
  const [householdId, setHouseholdId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<PantryItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    const fresh = items.filter((item) => item.status === "fresh").length;
    const expiring = items.filter((item) => item.status === "expiring").length;
    const expired = items.filter((item) => item.status === "expired").length;

    return {
      total: items.length,
      fresh,
      expiring,
      expired,
    };
  }, [items]);

  async function initializeDemoHousehold() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = await parseResponse<{
        household: { id: string };
        users: User[];
      }>(await fetch("/api/bootstrap", { method: "POST" }));

      setHouseholdId(payload.household.id);
      setUsers(payload.users);
      if (payload.users.length > 0) {
        setActiveUserId(payload.users[0].id);
      }
      setSuccess("Demo household loaded.");
      await loadItems(payload.household.id, query, statusFilter);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to initialize.");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(nextHouseholdId?: string, nextQuery?: string, nextStatus?: StatusFilter) {
    const resolvedHouseholdId = nextHouseholdId ?? householdId;
    if (!resolvedHouseholdId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      const resolvedQuery = (nextQuery ?? query).trim();
      const resolvedStatus = nextStatus ?? statusFilter;

      if (resolvedQuery) {
        params.set("q", resolvedQuery);
      }
      if (resolvedStatus !== "all") {
        params.set("status", resolvedStatus);
      }

      const payload = await parseResponse<{ items: PantryItem[] }>(
        await fetch(`/api/households/${resolvedHouseholdId}/items?${params.toString()}`),
      );
      setItems(payload.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load items.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!householdId || !activeUserId) {
      setError("Initialize a household and select a user first.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const quantity = Number(formData.get("quantity"));
    const shelfLifeRaw = String(formData.get("shelfLifeDays") ?? "").trim();

    const localizedNames: Record<string, string> = {};
    const nameEn = String(formData.get("nameEn") ?? "").trim();
    const nameDe = String(formData.get("nameDe") ?? "").trim();

    if (nameEn) localizedNames.en = nameEn;
    if (nameDe) localizedNames.de = nameDe;

    const payload: Record<string, unknown> = {
      addedByUserId: activeUserId,
      name: String(formData.get("name") ?? "").trim(),
      quantity,
      unit: String(formData.get("unit") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "OTHER"),
      location: String(formData.get("location") ?? "").trim() || undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
      purchaseDate: String(formData.get("purchaseDate") ?? "").trim() || undefined,
      useByDate: String(formData.get("useByDate") ?? "").trim() || undefined,
      localizedNames: Object.keys(localizedNames).length ? localizedNames : undefined,
    };

    if (shelfLifeRaw) {
      payload.shelfLifeDays = Number(shelfLifeRaw);
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await parseResponse(
        await fetch(`/api/households/${householdId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      );
      form.reset();
      setSuccess("Item added.");
      await loadItems();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <header className="hero">
        <h1>Pantry OS</h1>
        <p>
          Multi-user pantry inventory with shared households, category shelf-life defaults, and multilingual
          matching (for example: <strong>milk</strong> and <strong>Milch</strong> map together).
        </p>
      </header>

      <section className="card">
        <h2>Workspace</h2>
        <div className="row actions-row">
          <button type="button" onClick={initializeDemoHousehold} disabled={loading}>
            Initialize Shared Demo Household
          </button>
          <button
            type="button"
            onClick={() => loadItems()}
            disabled={loading || !householdId}
            className="button-secondary"
          >
            Refresh
          </button>
        </div>

        <div className="row">
          <label>
            Household ID
            <input value={householdId} onChange={(event) => setHouseholdId(event.target.value)} />
          </label>
          <label>
            Active User
            <select value={activeUserId} onChange={(event) => setActiveUserId(event.target.value)}>
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="message error">{error}</p> : null}
        {success ? <p className="message success">{success}</p> : null}
      </section>

      <section className="card">
        <h2>Add Item</h2>
        <form onSubmit={handleAddItem}>
          <div className="row">
            <label>
              Item Name
              <input name="name" required />
            </label>
            <label>
              Category
              <select name="category" defaultValue="OTHER">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="row">
            <label>
              Quantity
              <input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required />
            </label>
            <label>
              Unit
              <input name="unit" placeholder="L, kg, pcs" />
            </label>
          </div>

          <div className="row">
            <label>
              Purchase Date
              <input name="purchaseDate" type="date" />
            </label>
            <label>
              Use-by Date
              <input name="useByDate" type="date" />
            </label>
          </div>

          <div className="row">
            <label>
              Shelf Life (days)
              <input name="shelfLifeDays" type="number" min="1" step="1" placeholder="Auto by category" />
            </label>
            <label>
              Location
              <input name="location" placeholder="Pantry shelf, fridge, freezer" />
            </label>
          </div>

          <div className="row">
            <label>
              Name (EN)
              <input name="nameEn" placeholder="milk" />
            </label>
            <label>
              Name (DE)
              <input name="nameDe" placeholder="Milch" />
            </label>
          </div>

          <label>
            Notes
            <input name="notes" placeholder="Any details" />
          </label>

          <button type="submit" disabled={loading}>
            Add Item
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Inventory</h2>

        <div className="stats">
          <article className="stat">
            <p>Total</p>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat">
            <p>Fresh</p>
            <strong>{stats.fresh}</strong>
          </article>
          <article className="stat">
            <p>Expiring</p>
            <strong>{stats.expiring}</strong>
          </article>
          <article className="stat">
            <p>Expired</p>
            <strong>{stats.expired}</strong>
          </article>
        </div>

        <div className="row">
          <label>
            Search (EN/DE)
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="milk or Milch"
            />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">All</option>
              <option value="fresh">Fresh</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <button type="button" onClick={() => loadItems()} disabled={loading || !householdId}>
            Apply
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Use-by</th>
                <th>Status</th>
                <th>Aliases</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.primaryName}
                      {item.location ? <span className="muted">{item.location}</span> : null}
                    </td>
                    <td>
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td>{item.category}</td>
                    <td>{formatDate(item.useByDate)}</td>
                    <td>
                      <span className={`badge ${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.names.map((name) => `${name.locale}:${name.text}`).join(", ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
