import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireHouseholdMembership, requireRequestUser } from "@/lib/http/route-guards";
import { getPurchasingProvider } from "@/lib/purchasing/registry";
import { searchShopping } from "@/lib/purchasing/shopping";

const searchSchema = z.object({ term: z.string().trim().min(1).max(120) });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ householdId: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) return userResult.response;

  const { householdId } = await context.params;
  const membership = await requireHouseholdMembership(householdId, userResult.value.id);
  if (!membership.ok) return membership.response;

  const parsed = searchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const provider = getPurchasingProvider();
  const match = await searchShopping(provider, parsed.data.term);
  return NextResponse.json({ provider: provider.providerName, ...match });
}
