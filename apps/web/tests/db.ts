import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

export const uid = () => randomUUID();

export function makeUser() {
  const id = uid();
  return prisma.user.create({ data: { id, email: `${id}@test.local`, name: "Test" } });
}

export function makeHousehold(ownerId: string) {
  return prisma.household.create({
    data: { name: "Home", memberships: { create: { userId: ownerId, role: "OWNER" } } },
  });
}
