import { HouseholdRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type HouseholdMembershipSummary = {
  id: string;
  role: HouseholdRole;
};

export async function getHouseholdMembership(
  householdId: string,
  userId: string,
): Promise<HouseholdMembershipSummary | null> {
  return prisma.householdMembership.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });
}

export function hasAnyHouseholdRole(
  membership: HouseholdMembershipSummary,
  allowedRoles: HouseholdRole[],
): boolean {
  return allowedRoles.includes(membership.role);
}

export function canManageHouseholdInvites(membership: HouseholdMembershipSummary): boolean {
  return hasAnyHouseholdRole(membership, [HouseholdRole.OWNER, HouseholdRole.ADMIN]);
}
