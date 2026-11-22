import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireHouseholdMembership, requireRequestUser } from "@/lib/http/route-guards";
import { getPurchasingProvider } from "@/lib/purchasing/registry";
import { searchShopping } from "@/lib/purchasing/shopping";

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(120),
        quantity: z.number().int().positive().max(99),
      }),
    )
    .min(1)
    .max(50),
});

// Preview only: picks the cheapest offer per line. No order is placed, no money moves.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ householdId: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) return userResult.response;

  const { householdId } = await context.params;
  const membership = await requireHouseholdMembership(householdId, userResult.value.id);
  if (!membership.ok) return membership.response;

  const parsed = cartSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const provider = getPurchasingProvider();
  const lines = await Promise.all(
    parsed.data.items.map(async ({ term, quantity }) => {
      const { canonical, shoppingTerm, offers } = await searchShopping(provider, term);
      const offer = [...offers].sort((a, b) => a.priceCents - b.priceCents)[0] ?? null;
      return {
        term,
        canonical,
        shoppingTerm,
        quantity,
        offer,
        lineTotalCents: offer ? offer.priceCents * quantity : 0,
      };
    }),
  );

  return NextResponse.json({
    provider: provider.providerName,
    currency: "EUR",
    lines,
    totalCents: lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
    unmatched: lines.filter((l) => !l.offer).map((l) => l.term),
  });
}
