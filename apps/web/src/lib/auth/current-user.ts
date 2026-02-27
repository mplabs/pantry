import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      preferredLocales: true,
    },
  });
}
