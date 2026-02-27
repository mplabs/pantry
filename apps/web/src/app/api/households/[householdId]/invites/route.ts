import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ householdId: string }> },
) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { householdId } = await context.params;

  const membership = await prisma.householdMembership.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId: currentUser.id,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const token = crypto.randomBytes(24).toString("base64url");

  const invite = await prisma.householdInvite.create({
    data: {
      householdId,
      token,
      createdByUserId: currentUser.id,
      expiresAt,
    },
  });

  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/join/${invite.token}`;

  return NextResponse.json(
    {
      invite: {
        token: invite.token,
        expiresAt: invite.expiresAt,
      },
      inviteUrl,
    },
    { status: 201 },
  );
}
