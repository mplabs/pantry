import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/current-user", () => ({ requireCurrentUser: vi.fn() }));

import { GET as listHouseholds, POST as createHousehold } from "@/app/api/households/route";
import { POST as createInvite } from "@/app/api/households/[householdId]/invites/route";
import { GET as listItems, POST as createItem } from "@/app/api/households/[householdId]/items/route";
import { POST as acceptInvite } from "@/app/api/invites/accept/route";
import { POST as resolveIngredients } from "@/app/api/language/ingredients/resolve/route";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { makeHousehold, makeUser, uid } from "./db";

const mockedUser = vi.mocked(requireCurrentUser);
type User = Awaited<ReturnType<typeof makeUser>>;
const loginAs = (u: User | null) => mockedUser.mockResolvedValue(u as never);

const req = (url: string, body?: unknown, method = "POST") =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (householdId: string) => ({ params: Promise.resolve({ householdId }) });

beforeEach(() => mockedUser.mockReset());

describe("401 without a session", () => {
  it("rejects every route", async () => {
    loginAs(null);
    const responses = await Promise.all([
      listHouseholds(),
      createHousehold(req("/api/households", { name: "Home" })),
      listItems(req("/x", undefined, "GET"), ctx("x")),
      createItem(req("/x", {}), ctx("x")),
      createInvite(req("/x"), ctx("x")),
      acceptInvite(req("/x", { token: "x".repeat(12) })),
      resolveIngredients(req("/x", { ingredients: ["milk"] })),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(7).fill(401));
  });
});

describe("households", () => {
  it("creates a household with the caller as owner, then lists it", async () => {
    const user = await makeUser();
    loginAs(user);
    const res = await createHousehold(req("/api/households", { name: "  Flat  " }));
    expect(res.status).toBe(201);
    const { household } = await res.json();
    expect(household).toMatchObject({ name: "Flat", defaultLocale: "de" });
    expect(household.memberships[0]).toMatchObject({ userId: user.id, role: "OWNER" });

    const list = await (await listHouseholds()).json();
    expect(list.households.map((h: { id: string }) => h.id)).toEqual([household.id]);
    expect(list.currentUser.id).toBe(user.id);
  });

  it("400s on an invalid payload", async () => {
    loginAs(await makeUser());
    const res = await createHousehold(req("/api/households", { name: "x" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid request payload");
  });
});

describe("items", () => {
  it("forbids non-members", async () => {
    const owner = await makeUser();
    const household = await makeHousehold(owner.id);
    loginAs(await makeUser());
    const res = await listItems(req("/x", undefined, "GET"), ctx(household.id));
    expect(res.status).toBe(403);
  });

  it("creates an item with category-default shelf life and canonical name, and filters by q/status", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    loginAs(user);

    const res = await createItem(
      req("/x", { name: "Quark", quantity: 2, category: "DAIRY", purchaseDate: "2026-01-01" }),
      ctx(household.id),
    );
    expect(res.status).toBe(201);
    const { item } = await res.json();
    expect(item).toMatchObject({ canonicalName: "quark", shelfLifeDays: 7, category: "DAIRY" });
    expect(item.useByDate).toBe("2026-01-08T00:00:00.000Z");

    // explicit shelf life override beats the category default
    const override = await (
      await createItem(
        req("/x", { name: "Hirse", quantity: 1, category: "GRAINS", shelfLifeDays: 10, purchaseDate: "2026-01-01" }),
        ctx(household.id),
      )
    ).json();
    expect(override.item.useByDate).toBe("2026-01-11T00:00:00.000Z");

    const search = await (await listItems(req("/x?q=quark", undefined, "GET"), ctx(household.id))).json();
    expect(search.items).toHaveLength(1);
    expect(search.items[0].status).toBe("expired");

    const expired = await (await listItems(req("/x?status=expired", undefined, "GET"), ctx(household.id))).json();
    expect(expired.items).toHaveLength(2);
    const fresh = await (await listItems(req("/x?status=fresh", undefined, "GET"), ctx(household.id))).json();
    expect(fresh.items).toHaveLength(0);
  });

  // Regression: aliases must dedupe on text alone, since the DB unique index ignores locale.
  it("creates an item whose name is a lexicon term", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    loginAs(user);
    const res = await createItem(req("/x", { name: "Milk", quantity: 1 }), ctx(household.id));
    expect(res.status).toBe(201);
  });

  it("400s on invalid body", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    loginAs(user);
    const res = await createItem(req("/x", { name: "Milk", quantity: -1 }), ctx(household.id));
    expect(res.status).toBe(400);
  });
});

describe("invites", () => {
  it("only owner/admin can create; member gets 403, owner gets a join url", async () => {
    const owner = await makeUser();
    const member = await makeUser();
    const household = await makeHousehold(owner.id);
    await prisma.householdMembership.create({
      data: { householdId: household.id, userId: member.id, role: "MEMBER" },
    });

    loginAs(member);
    expect((await createInvite(req("/x"), ctx(household.id))).status).toBe(403);

    loginAs(owner);
    const res = await createInvite(req("/x"), ctx(household.id));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.inviteUrl).toBe(`http://localhost/join/${body.invite.token}`);
  });

  it("accepts once, then 409; unknown 404; expired 410; short token 400", async () => {
    const owner = await makeUser();
    const joiner = await makeUser();
    const household = await makeHousehold(owner.id);
    const make = (expiresAt: Date) =>
      prisma.householdInvite.create({
        data: { householdId: household.id, token: uid(), createdByUserId: owner.id, expiresAt },
      });
    const valid = await make(new Date(Date.now() + 60_000));
    const expired = await make(new Date(Date.now() - 60_000));

    loginAs(joiner);
    const accept = (token: string) => acceptInvite(req("/x", { token }));

    const ok = await accept(valid.token);
    expect(ok.status).toBe(200);
    expect((await ok.json()).household.id).toBe(household.id);
    expect(
      await prisma.householdMembership.findFirst({ where: { householdId: household.id, userId: joiner.id } }),
    ).toMatchObject({ role: "MEMBER" });

    expect((await accept(valid.token)).status).toBe(409);
    expect((await accept(uid())).status).toBe(404);
    expect((await accept(expired.token)).status).toBe(410);
    expect((await accept("short")).status).toBe(400);
  });
});

describe("ingredient resolve", () => {
  it("returns one entry per input and reports llmEnabled", async () => {
    loginAs(await makeUser());
    const res = await resolveIngredients(req("/x", { ingredients: ["Eier", "Mehl"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.normalized.map((n: { input: string }) => n.input)).toEqual(["Eier", "Mehl"]);
    expect(typeof body.llmEnabled).toBe("boolean");
  });

  it("maps German lexicon terms to the English canonical without an LLM", async () => {
    loginAs(await makeUser());
    const res = await resolveIngredients(req("/x", { ingredients: ["Eier"] }));
    expect((await res.json()).normalized[0].canonical).toBe("eggs");
  });

  it("400s on empty list", async () => {
    loginAs(await makeUser());
    const res = await resolveIngredients(req("/x", { ingredients: [] }));
    expect(res.status).toBe(400);
  });
});
