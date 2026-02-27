import { PantryCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { defaultShelfLifeDays } from "@/lib/inventory/category-defaults";
import { addDays, statusForUseByDate } from "@/lib/inventory/freshness";
import {
  aliasesForCanonicalName,
  canonicalizeName,
  normalizeTerm,
} from "@/lib/inventory/name-lexicon";
import { prisma } from "@/lib/prisma";

const createItemSchema = z.object({
  addedByUserId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(120),
  quantity: z.number().positive(),
  unit: z.string().trim().max(40).optional(),
  category: z.nativeEnum(PantryCategory).default(PantryCategory.OTHER),
  location: z.string().trim().max(120).optional(),
  purchaseDate: z.string().date().optional(),
  useByDate: z.string().date().optional(),
  shelfLifeDays: z.number().int().positive().max(3650).optional(),
  notes: z.string().trim().max(1000).optional(),
  localizedNames: z.record(z.string().trim().min(2).max(8), z.string().trim().min(1).max(120)).optional(),
});

function parseDate(input: string): Date {
  return new Date(`${input}T00:00:00.000Z`);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ householdId: string }> },
) {
  const { householdId } = await context.params;
  const query = normalizeTerm(request.nextUrl.searchParams.get("q") ?? "");
  const statusFilter = request.nextUrl.searchParams.get("status");

  const canonicalQuery = query ? canonicalizeName(query) : null;

  const items = await prisma.pantryItem.findMany({
    where: {
      householdId,
      OR: query
        ? [
            { canonicalName: canonicalQuery ?? undefined },
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
          displayName: true,
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
  const { householdId } = await context.params;
  const body = await request.json();
  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const membership = await prisma.householdMembership.findUnique({
    where: {
      householdId_userId: {
        householdId,
        userId: data.addedByUserId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "User is not a member of this household" },
      { status: 403 },
    );
  }

  const purchaseDate = data.purchaseDate ? parseDate(data.purchaseDate) : new Date();
  const canonicalName = canonicalizeName(data.name);
  const effectiveShelfLife = data.shelfLifeDays ?? defaultShelfLifeDays(data.category);
  const effectiveUseByDate = data.useByDate
    ? parseDate(data.useByDate)
    : addDays(purchaseDate, effectiveShelfLife);

  const localizedRows = Object.entries(data.localizedNames ?? {}).map(([locale, text]) => ({
    locale,
    text,
    normalizedText: normalizeTerm(text),
  }));

  const lexiconRows = aliasesForCanonicalName(canonicalName).map((entry) => ({
    locale: entry.locale,
    text: entry.term,
    normalizedText: normalizeTerm(entry.term),
  }));

  const primaryRow = {
    locale: "und",
    text: data.name,
    normalizedText: normalizeTerm(data.name),
  };

  const dedupedRows = [...localizedRows, ...lexiconRows, primaryRow].filter((row, index, rows) => {
    return rows.findIndex((candidate) => candidate.normalizedText === row.normalizedText) === index;
  });

  const item = await prisma.pantryItem.create({
    data: {
      householdId,
      addedByUserId: data.addedByUserId,
      primaryName: data.name,
      normalizedPrimaryName: normalizeTerm(data.name),
      canonicalName,
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
