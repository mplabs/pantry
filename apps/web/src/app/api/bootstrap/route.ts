import { HouseholdRole, PantryCategory } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST() {
  const existing = await prisma.household.findFirst({
    where: { name: "Shared Pantry Demo" },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      household: existing,
      users: existing.memberships.map((membership) => membership.user),
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const owner = await tx.user.create({
      data: {
        displayName: "Mila",
        email: "mila@example.com",
        preferredLocales: "de,en",
      },
    });

    const member = await tx.user.create({
      data: {
        displayName: "Alex",
        email: "alex@example.com",
        preferredLocales: "en,de",
      },
    });

    const household = await tx.household.create({
      data: {
        name: "Shared Pantry Demo",
        defaultLocale: "de",
        memberships: {
          create: [
            { userId: owner.id, role: HouseholdRole.OWNER },
            { userId: member.id, role: HouseholdRole.MEMBER },
          ],
        },
      },
    });

    await tx.pantryItem.createMany({
      data: [
        {
          householdId: household.id,
          addedByUserId: owner.id,
          primaryName: "Milch",
          normalizedPrimaryName: "milch",
          canonicalName: "milk",
          quantity: 2,
          unit: "L",
          category: PantryCategory.DAIRY,
          shelfLifeDays: 7,
          notes: "Semi-skimmed",
        },
        {
          householdId: household.id,
          addedByUserId: member.id,
          primaryName: "Rice",
          normalizedPrimaryName: "rice",
          canonicalName: "rice",
          quantity: 1,
          unit: "kg",
          category: PantryCategory.GRAINS,
          shelfLifeDays: 180,
        },
      ],
    });

    return { household, users: [owner, member] };
  });

  return NextResponse.json(result, { status: 201 });
}
