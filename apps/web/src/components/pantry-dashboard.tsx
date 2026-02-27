"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type HouseholdMember = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type HouseholdInvite = {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  createdByUserId: string;
};

type Household = {
  id: string;
  name: string;
  defaultLocale: string;
  memberships: HouseholdMember[];
  invites: HouseholdInvite[];
};

type PantryItem = {
  id: string;
  primaryName: string;
  quantity: number;
  unit: string | null;
  category: string;
  location: string | null;
  useByDate: string | null;
  status: "fresh" | "expiring" | "expired";
  names: Array<{
    id: string;
    locale: string;
    text: string;
  }>;
};

type IngredientResolution = {
  input: string;
  canonical: string;
  aliases: Array<{
    locale: string;
    text: string;
  }>;
};

type StatusFilter = "all" | "fresh" | "expiring" | "expired";

type PantryDashboardProps = {
  user: {
    email: string;
    name?: string | null;
  };
};

const CATEGORIES = [
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
] as const;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Auto from category";
  }

  return new Date(value).toLocaleDateString();
}

export function PantryDashboard({ user }: PantryDashboardProps) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState("");
  const [items, setItems] = useState<PantryItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [resolvedIngredients, setResolvedIngredients] = useState<IngredientResolution[]>([]);
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeHousehold = households.find((household) => household.id === activeHouseholdId) ?? null;

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

  async function loadHouseholds() {
    const payload = await parseResponse<{
      households: Household[];
    }>(await fetch("/api/households"));

    setHouseholds(payload.households);

    if (!activeHouseholdId && payload.households.length > 0) {
      setActiveHouseholdId(payload.households[0].id);
    }

    if (
      activeHouseholdId &&
      !payload.households.some((household) => household.id === activeHouseholdId)
    ) {
      setActiveHouseholdId(payload.households[0]?.id ?? "");
    }
  }

  async function loadItems(nextHouseholdId?: string) {
    const resolvedHouseholdId = nextHouseholdId ?? activeHouseholdId;
    if (!resolvedHouseholdId) {
      setItems([]);
      return;
    }

    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    const payload = await parseResponse<{ items: PantryItem[] }>(
      await fetch(`/api/households/${resolvedHouseholdId}/items?${params.toString()}`),
    );

    setItems(payload.items);
  }

  useEffect(() => {
    setBusy(true);
    setError("");

    loadHouseholds()
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load households.");
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    setBusy(true);
    setError("");

    loadItems(activeHouseholdId)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load inventory.");
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHouseholdId]);

  async function createHousehold() {
    if (newHouseholdName.trim().length < 2) {
      setError("Household name must be at least 2 characters.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = await parseResponse<{ household: Household }>(
        await fetch("/api/households", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newHouseholdName,
            defaultLocale: "de",
          }),
        }),
      );

      setNewHouseholdName("");
      setSuccess(`Created household \"${payload.household.name}\".`);
      await loadHouseholds();
      setActiveHouseholdId(payload.household.id);
      await loadItems(payload.household.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create household.");
    } finally {
      setBusy(false);
    }
  }

  async function createInviteLink() {
    if (!activeHouseholdId) {
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = await parseResponse<{ inviteUrl: string }>(
        await fetch(`/api/households/${activeHouseholdId}/invites`, {
          method: "POST",
        }),
      );

      setInviteUrl(payload.inviteUrl);
      setSuccess("Invite link generated.");
      await loadHouseholds();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create invite link.");
    } finally {
      setBusy(false);
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeHouseholdId) {
      setError("Select a household first.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const localizedNames = {
      en: String(formData.get("nameEn") ?? "").trim(),
      de: String(formData.get("nameDe") ?? "").trim(),
    };

    const payload: {
      name: string;
      quantity: number;
      unit?: string;
      category: string;
      location?: string;
      purchaseDate?: string;
      useByDate?: string;
      shelfLifeDays?: number;
      notes?: string;
      localizedNames?: Record<string, string>;
    } = {
      name: String(formData.get("name") ?? "").trim(),
      quantity: Number(formData.get("quantity") ?? 0),
      unit: String(formData.get("unit") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "OTHER"),
      location: String(formData.get("location") ?? "").trim() || undefined,
      purchaseDate: String(formData.get("purchaseDate") ?? "").trim() || undefined,
      useByDate: String(formData.get("useByDate") ?? "").trim() || undefined,
      shelfLifeDays: String(formData.get("shelfLifeDays") ?? "").trim()
        ? Number(formData.get("shelfLifeDays"))
        : undefined,
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    };

    if (!payload.name || payload.quantity <= 0) {
      setError("Item name and quantity are required.");
      return;
    }

    const nextLocalizedNames = Object.fromEntries(
      Object.entries(localizedNames).filter(([, value]) => value.trim().length > 0),
    );

    if (Object.keys(nextLocalizedNames).length > 0) {
      payload.localizedNames = nextLocalizedNames;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await parseResponse(
        await fetch(`/api/households/${activeHouseholdId}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }),
      );

      setSuccess("Item added.");
      form.reset();
      await loadItems(activeHouseholdId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to add item.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveRecipeIngredients() {
    const ingredients = recipeText
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (ingredients.length === 0) {
      setResolvedIngredients([]);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const payload = await parseResponse<{ normalized: IngredientResolution[]; llmEnabled: boolean }>(
        await fetch("/api/language/ingredients/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ingredients }),
        }),
      );

      setResolvedIngredients(payload.normalized);
      setLlmEnabled(payload.llmEnabled);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to normalize ingredient names.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Pantry OS</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as {user.name ?? user.email}. Select a household, share it via invite link, and manage shared
              inventory.
            </p>
          </div>
          <p className="rounded-lg bg-slate-100 px-3 py-1 text-xs text-slate-700">UI language: English</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Households</h2>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Create a new household"
              value={newHouseholdName}
              onChange={(event) => setNewHouseholdName(event.target.value)}
            />
            <button
              type="button"
              onClick={createHousehold}
              disabled={busy}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              Create
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-sm">
              Selected household
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={activeHouseholdId}
                onChange={(event) => {
                  setActiveHouseholdId(event.target.value);
                  setInviteUrl("");
                }}
              >
                <option value="">Select</option>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>
                    {household.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={createInviteLink}
              disabled={busy || !activeHouseholdId}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Generate invite link
            </button>

            {inviteUrl ? (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                <p className="font-semibold">Share this link:</p>
                <p className="break-all">{inviteUrl}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Shared with</h3>
            {activeHousehold ? (
              <ul className="grid gap-2">
                {activeHousehold.memberships.map((membership) => (
                  <li key={membership.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold">{membership.user.name ?? membership.user.email}</span>
                    <span className="ml-2 text-xs uppercase text-slate-500">{membership.role}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No household selected.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Add inventory item</h2>

          <form className="mt-3 grid gap-3" onSubmit={addItem}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Name
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="name" required />
              </label>
              <label className="grid gap-1 text-sm">
                Category
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2" name="category">
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Quantity
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue="1"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm">
                Unit
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="unit" placeholder="kg, L, pcs" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Name (EN)
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="nameEn" placeholder="milk" />
              </label>
              <label className="grid gap-1 text-sm">
                Name (DE)
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="nameDe" placeholder="Milch" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Purchase date
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="purchaseDate" type="date" />
              </label>
              <label className="grid gap-1 text-sm">
                Use-by date
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="useByDate" type="date" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Shelf life days
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  name="shelfLifeDays"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="category default"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Location
                <input className="rounded-lg border border-slate-300 px-3 py-2" name="location" />
              </label>
            </div>

            <label className="grid gap-1 text-sm">
              Notes
              <input className="rounded-lg border border-slate-300 px-3 py-2" name="notes" />
            </label>

            <button
              type="submit"
              disabled={busy || !activeHouseholdId}
              className="w-fit rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              Add item
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Inventory</h2>
          <button
            type="button"
            onClick={() => loadItems()}
            disabled={busy || !activeHouseholdId}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Refresh
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_240px_auto]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search milk, Milch, butter..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="fresh">Fresh</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
          <button
            type="button"
            onClick={() => loadItems()}
            disabled={busy || !activeHouseholdId}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Apply
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Fresh</p>
            <p className="text-2xl font-semibold">{stats.fresh}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Expiring</p>
            <p className="text-2xl font-semibold">{stats.expiring}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <p className="text-slate-500">Expired</p>
            <p className="text-2xl font-semibold">{stats.expired}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[860px] table-auto border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Item</th>
                <th className="px-2 py-2">Quantity</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Use-by</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Aliases</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <p className="font-semibold">{item.primaryName}</p>
                      {item.location ? <p className="text-xs text-slate-500">{item.location}</p> : null}
                    </td>
                    <td className="px-2 py-2">
                      {item.quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </td>
                    <td className="px-2 py-2">{item.category}</td>
                    <td className="px-2 py-2">{formatDate(item.useByDate)}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                          item.status === "fresh"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "expiring"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-slate-600">
                      {item.names.map((alias) => `${alias.locale}:${alias.text}`).join(", ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Recipe language bridge</h2>
        <p className="mt-1 text-sm text-slate-600">
          Paste ingredient names from an English recipe and normalize to language-independent canonical terms plus
          German aliases for shopping.
        </p>

        <textarea
          className="mt-3 min-h-32 w-full rounded-lg border border-slate-300 p-3 text-sm"
          value={recipeText}
          onChange={(event) => setRecipeText(event.target.value)}
          placeholder={"milk\nflour\nbutter"}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resolveRecipeIngredients}
            disabled={busy}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Normalize ingredients
          </button>
          <span className="text-xs text-slate-500">
            LLM translation: {llmEnabled ? "enabled" : "disabled (fallback lexicon)"}
          </span>
        </div>

        {resolvedIngredients.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[680px] table-auto border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="px-2 py-2">Input</th>
                  <th className="px-2 py-2">Canonical</th>
                  <th className="px-2 py-2">Aliases</th>
                </tr>
              </thead>
              <tbody>
                {resolvedIngredients.map((ingredient) => (
                  <tr key={`${ingredient.input}-${ingredient.canonical}`} className="border-b border-slate-100">
                    <td className="px-2 py-2">{ingredient.input}</td>
                    <td className="px-2 py-2 font-semibold">{ingredient.canonical}</td>
                    <td className="px-2 py-2 text-xs text-slate-600">
                      {ingredient.aliases.map((alias) => `${alias.locale}:${alias.text}`).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {error ? <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}
    </main>
  );
}
