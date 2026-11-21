import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  requireHouseholdMembership,
  requireRequestUser,
} from "@/lib/http/route-guards";
import { prisma } from "@/lib/prisma";

const decrementSchema = z.object({ amount: z.number().positive().default(1) });

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ householdId: string; itemId: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return userResult.response;
  }

  const { householdId, itemId } = await context.params;
  const membershipResult = await requireHouseholdMembership(householdId, userResult.value.id);
  if (!membershipResult.ok) {
    return membershipResult.response;
  }

  const parsed = decrementSchema.safeParse((await request.json().catch(() => null)) ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { amount } = parsed.data;

  const item = await prisma.pantryItem.findFirst({ where: { id: itemId, householdId } });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Stock used up: remove the item (no zero-quantity rows to clutter the list).
  if (amount >= item.quantity) {
    await prisma.pantryItem.delete({ where: { id: item.id } });
    return NextResponse.json({ deleted: true, item: null });
  }

  // Atomic decrement so concurrent "use one" taps don't lose updates.
  const updated = await prisma.pantryItem.update({
    where: { id: item.id },
    data: { quantity: { decrement: amount } },
    include: { names: { orderBy: { locale: "asc" } } },
  });
  return NextResponse.json({ deleted: false, item: updated });
}
