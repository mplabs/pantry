import { HouseholdRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const createHouseholdSchema = z.object({
  name: z.string().trim().min(2).max(120),
  defaultLocale: z.string().trim().min(2).max(8).default("de"),
});

export async function GET() {
  const currentUser = await requireCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const households = await prisma.household.findMany({
    where: {
      memberships: {
        some: {
          userId: currentUser.id,
        },
      },
    },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      invites: {
        where: {
          acceptedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          token: true,
          createdAt: true,
          expiresAt: true,
          createdByUserId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({
    households,
    currentUser,
  });
}

export async function POST(request: NextRequest) {
  const currentUser = await requireCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createHouseholdSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, defaultLocale } = parsed.data;

  const household = await prisma.household.create({
    data: {
      name,
      defaultLocale,
      memberships: {
        create: {
          userId: currentUser.id,
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
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ household }, { status: 201 });
}
