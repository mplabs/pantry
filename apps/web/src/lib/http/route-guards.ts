import { HouseholdRole } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getHouseholdMembership,
  hasAnyHouseholdRole,
  type HouseholdMembershipSummary,
} from "@/lib/auth/household-policy";
import { requireCurrentUser, type CurrentUser } from "@/lib/auth/current-user";

type GuardResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireRequestUser(): Promise<GuardResult<CurrentUser>> {
  const currentUser = await requireCurrentUser();

  if (!currentUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, value: currentUser };
}

export async function requireHouseholdMembership(
  householdId: string,
  userId: string,
): Promise<GuardResult<HouseholdMembershipSummary>> {
  const membership = await getHouseholdMembership(householdId, userId);

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, value: membership };
}

export async function requireHouseholdRoles(
  householdId: string,
  userId: string,
  allowedRoles: HouseholdRole[],
): Promise<GuardResult<HouseholdMembershipSummary>> {
  const membershipResult = await requireHouseholdMembership(householdId, userId);

  if (!membershipResult.ok) {
    return membershipResult;
  }

  if (!hasAnyHouseholdRole(membershipResult.value, allowedRoles)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return membershipResult;
}
