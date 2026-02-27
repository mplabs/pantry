import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { canManageHouseholdInvites } from "@/lib/auth/household-policy";
import {
  requireHouseholdMembership,
  requireRequestUser,
} from "@/lib/http/route-guards";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ householdId: string }> },
) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return userResult.response;
  }
  const currentUser = userResult.value;

  const { householdId } = await context.params;
  const membershipResult = await requireHouseholdMembership(
    householdId,
    currentUser.id,
  );
  if (!membershipResult.ok) {
    return membershipResult.response;
  }
  if (!canManageHouseholdInvites(membershipResult.value)) {
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
