import { describe, expect, it } from "vitest";

import {
  canManageHouseholdInvites,
  getHouseholdMembership,
  hasAnyHouseholdRole,
} from "@/lib/auth/household-policy";
import { makeHousehold, makeUser } from "./db";

describe("household policy", () => {
  it("only owners and admins manage invites", () => {
    expect(canManageHouseholdInvites({ id: "m", role: "OWNER" })).toBe(true);
    expect(canManageHouseholdInvites({ id: "m", role: "ADMIN" })).toBe(true);
    expect(canManageHouseholdInvites({ id: "m", role: "MEMBER" })).toBe(false);
    expect(hasAnyHouseholdRole({ id: "m", role: "MEMBER" }, [])).toBe(false);
  });

  it("looks up membership by household and user", async () => {
    const user = await makeUser();
    const other = await makeUser();
    const household = await makeHousehold(user.id);
    expect(await getHouseholdMembership(household.id, user.id)).toMatchObject({ role: "OWNER" });
    expect(await getHouseholdMembership(household.id, other.id)).toBeNull();
  });
});
