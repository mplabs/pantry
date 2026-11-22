import { NextResponse } from "next/server";

import { requireHouseholdMembership, requireRequestUser } from "@/lib/http/route-guards";
import { activeProviderName, getPurchasingProvider, listProviderNames } from "@/lib/purchasing/registry";

export async function GET(
  _request: Request,
  context: { params: Promise<{ householdId: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) return userResult.response;

  const { householdId } = await context.params;
  const membership = await requireHouseholdMembership(householdId, userResult.value.id);
  if (!membership.ok) return membership.response;

  const active = activeProviderName();
  const providers = await Promise.all(
    listProviderNames().map(async (name) => ({
      name,
      active: name === active,
      healthy: await getPurchasingProvider(name).isHealthy(),
    })),
  );
  return NextResponse.json({ providers });
}
