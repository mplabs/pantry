import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  preferredLocales: z.array(z.string().trim().min(2).max(8)).default(["en", "de"]),
});

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      preferredLocales: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await prisma.user.create({
    data: {
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      preferredLocales: parsed.data.preferredLocales.join(","),
    },
    select: {
      id: true,
      displayName: true,
      email: true,
      preferredLocales: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
