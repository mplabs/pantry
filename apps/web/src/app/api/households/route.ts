import { HouseholdRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createHouseholdSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    defaultLocale: z.string().trim().min(2).max(8).default("de"),
    ownerUserId: z.string().trim().min(1).optional(),
    owner: z
      .object({
        displayName: z.string().trim().min(1).max(120),
        email: z.string().email().optional(),
        preferredLocales: z.array(z.string().trim().min(2).max(8)).default(["en", "de"]),
      })
      .optional(),
  })
  .refine((value) => Boolean(value.ownerUserId || value.owner), {
    message: "ownerUserId or owner is required",
    path: ["ownerUserId"],
  });

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  const households = await prisma.household.findMany({
    where: userId
      ? {
          memberships: {
            some: { userId },
          },
        }
      : undefined,
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ households });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, defaultLocale, ownerUserId, owner } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const resolvedOwnerUserId = ownerUserId
      ? ownerUserId
      : (
          await tx.user.create({
            data: {
              displayName: owner!.displayName,
              email: owner!.email,
              preferredLocales: owner!.preferredLocales.join(","),
            },
          })
        ).id;

    const ownerExists = await tx.user.findUnique({
      where: { id: resolvedOwnerUserId },
      select: { id: true },
    });

    if (!ownerExists) {
      throw new Error("Owner user does not exist");
    }

    const household = await tx.household.create({
      data: {
        name,
        defaultLocale,
        memberships: {
          create: {
            userId: resolvedOwnerUserId,
            role: HouseholdRole.OWNER,
          },
        },
      },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return { household, ownerUserId: resolvedOwnerUserId };
  });

  return NextResponse.json(result, { status: 201 });
}
