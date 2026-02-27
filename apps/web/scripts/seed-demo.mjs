import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mila = await prisma.user.upsert({
    where: { email: "mila@example.com" },
    update: {},
    create: {
      name: "Mila",
      email: "mila@example.com",
      preferredLocales: "de,en",
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      name: "Alex",
      email: "alex@example.com",
      preferredLocales: "en,de",
    },
  });

  const household = await prisma.household.create({
    data: {
      name: `Shared Pantry ${new Date().toISOString()}`,
      defaultLocale: "de",
    },
  });

  await prisma.householdMembership.createMany({
    data: [
      { householdId: household.id, userId: mila.id, role: "OWNER" },
      { householdId: household.id, userId: alex.id, role: "MEMBER" },
    ],
  });

  console.log("Demo seeded", {
    householdId: household.id,
    ownerUserId: mila.id,
    memberUserId: alex.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
