import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/current-user", () => ({ requireCurrentUser: vi.fn() }));

import { POST as cart } from "@/app/api/households/[householdId]/purchasing/cart/route";
import { GET as providers } from "@/app/api/households/[householdId]/purchasing/providers/route";
import { POST as search } from "@/app/api/households/[householdId]/purchasing/search/route";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { makeHousehold, makeUser } from "./db";

const mockedUser = vi.mocked(requireCurrentUser);
const req = (body?: unknown) =>
  new NextRequest("http://localhost/x", {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (householdId: string) => ({ params: Promise.resolve({ householdId }) });

beforeEach(() => mockedUser.mockReset());

describe("purchasing", () => {
  it("401s without a session and 403s for non-members", async () => {
    mockedUser.mockResolvedValue(null as never);
    expect((await providers(req(), ctx("x"))).status).toBe(401);
    expect((await search(req({ term: "milk" }), ctx("x"))).status).toBe(401);
    expect((await cart(req({ items: [] }), ctx("x"))).status).toBe(401);

    const outsider = await makeUser();
    const household = await makeHousehold((await makeUser()).id);
    mockedUser.mockResolvedValue(outsider as never);
    expect((await providers(req(), ctx(household.id))).status).toBe(403);
    expect((await search(req({ term: "milk" }), ctx(household.id))).status).toBe(403);
    expect((await cart(req({ items: [{ term: "milk", quantity: 1 }] }), ctx(household.id))).status).toBe(403);
  });

  it("lists providers with mock active by default", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    mockedUser.mockResolvedValue(user as never);
    const { providers: list } = await (await providers(req(), ctx(household.id))).json();
    expect(list).toContainEqual({ name: "mock", active: true, healthy: true });
  });

  it("maps an EN term to the DE shopping term and returns offers", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    mockedUser.mockResolvedValue(user as never);
    const res = await search(req({ term: "milk" }), ctx(household.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ provider: "mock", canonical: "milk", shoppingTerm: "milch" });
    expect(body.offers.length).toBeGreaterThan(0);
    expect(body.offers[0].title.toLowerCase()).toContain("milch");
  });

  it("builds a deterministic cart preview with cheapest offers and a total", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    mockedUser.mockResolvedValue(user as never);
    const payload = { items: [{ term: "milk", quantity: 2 }, { term: "flour", quantity: 1 }] };
    const a = await (await cart(req(payload), ctx(household.id))).json();
    const b = await (await cart(req(payload), ctx(household.id))).json();
    expect(a).toEqual(b);
    expect(a.lines).toHaveLength(2);
    expect(a.lines[0].lineTotalCents).toBe(a.lines[0].offer.priceCents * 2);
    expect(a.totalCents).toBe(a.lines[0].lineTotalCents + a.lines[1].lineTotalCents);
    expect(a.unmatched).toEqual([]);
  });

  it("400s on invalid payloads", async () => {
    const user = await makeUser();
    const household = await makeHousehold(user.id);
    mockedUser.mockResolvedValue(user as never);
    expect((await search(req({ term: " " }), ctx(household.id))).status).toBe(400);
    expect((await cart(req({ items: [] }), ctx(household.id))).status).toBe(400);
    expect((await cart(req({ items: [{ term: "milk", quantity: 0 }] }), ctx(household.id))).status).toBe(400);
  });
});
