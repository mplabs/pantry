import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimit, tooManyRequests } from "@/lib/http/rate-limit";
import { requireRequestUser } from "@/lib/http/route-guards";
import { prisma } from "@/lib/prisma";

const acceptInviteSchema = z.object({
  token: z.string().min(10).max(256),
});

export async function POST(request: NextRequest) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return userResult.response;
  }
  const currentUser = userResult.value;

  // Per-user cap slows invite-token guessing.
  const limit = rateLimit(`invite:${currentUser.id}`, 10, 60_000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const body = await request.json();
  const parsed = acceptInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { token } = parsed.data;

  const invite = await prisma.householdInvite.findUnique({
    where: { token },
    include: {
      household: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 409 });
  }

  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.householdMembership.upsert({
      where: {
        householdId_userId: {
          householdId: invite.householdId,
          userId: currentUser.id,
        },
      },
      create: {
        householdId: invite.householdId,
        userId: currentUser.id,
        role: "MEMBER",
      },
      update: {},
    });

    await tx.householdInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        acceptedByUserId: currentUser.id,
      },
    });
  });

  return NextResponse.json({
    household: invite.household,
  });
}
