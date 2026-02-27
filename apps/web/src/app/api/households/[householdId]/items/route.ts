import { PantryCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { defaultShelfLifeDays } from "@/lib/inventory/category-defaults";
import { addDays, statusForUseByDate } from "@/lib/inventory/freshness";
import { normalizeTerm } from "@/lib/inventory/name-lexicon";
import { normalizeIngredient } from "@/lib/language/ingredient-normalizer";
import { prisma } from "@/lib/prisma";

const createItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive(),
  unit: z.string().trim().max(40).optional(),
  category: z.nativeEnum(PantryCategory).default(PantryCategory.OTHER),
  location: z.string().trim().max(120).optional(),
  purchaseDate: z.string().date().optional(),
  useByDate: z.string().date().optional(),
  shelfLifeDays: z.number().int().positive().max(3650).optional(),
  notes: z.string().trim().max(1000).optional(),
  localizedNames: z
    .record(z.string().trim().min(2).max(8), z.string().trim().min(1).max(120))
    .optional(),
});

function parseDate(input: string): Date {
  return new Date(`${input}T00:00:00.000Z`);
}

async function assertMembership(householdId: string, userId: string) {
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ householdId: string }> },
) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { householdId } = await context.params;
  const membership = await assertMembership(householdId, currentUser.id);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = normalizeTerm(request.nextUrl.searchParams.get("q") ?? "");
  const statusFilter = request.nextUrl.searchParams.get("status");

  const items = await prisma.pantryItem.findMany({
    where: {
      householdId,
      OR: query
        ? [
            { canonicalName: { contains: query } },
            { normalizedPrimaryName: { contains: query } },
            { names: { some: { normalizedText: { contains: query } } } },
          ]
        : undefined,
    },
    include: {
      names: {
        orderBy: { locale: "asc" },
      },
      addedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ useByDate: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const withStatus = items.map((item) => {
    const status = statusForUseByDate(item.useByDate);
    return {
      ...item,
      status,
    };
  });

  const filtered =
    statusFilter && ["fresh", "expiring", "expired"].includes(statusFilter)
      ? withStatus.filter((item) => item.status === statusFilter)
      : withStatus;

  return NextResponse.json({ items: filtered });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ householdId: string }> },
) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { householdId } = await context.params;
  const membership = await assertMembership(householdId, currentUser.id);

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const purchaseDate = data.purchaseDate ? parseDate(data.purchaseDate) : new Date();
  const effectiveShelfLife = data.shelfLifeDays ?? defaultShelfLifeDays(data.category);
  const effectiveUseByDate = data.useByDate
    ? parseDate(data.useByDate)
    : addDays(purchaseDate, effectiveShelfLife);

  const normalizedIngredient = await normalizeIngredient(data.name, data.localizedNames);

  const dedupedRows = normalizedIngredient.aliases.map((alias) => ({
    locale: alias.locale,
    text: alias.text,
    normalizedText: normalizeTerm(alias.text),
  }));

  const item = await prisma.pantryItem.create({
    data: {
      householdId,
      addedByUserId: currentUser.id,
      primaryName: data.name,
      normalizedPrimaryName: normalizeTerm(data.name),
      canonicalName: normalizedIngredient.canonical,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      location: data.location,
      purchaseDate,
      useByDate: effectiveUseByDate,
      shelfLifeDays: effectiveShelfLife,
      notes: data.notes,
      names: {
        create: dedupedRows,
      },
    },
    include: {
      names: {
        orderBy: { locale: "asc" },
      },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
