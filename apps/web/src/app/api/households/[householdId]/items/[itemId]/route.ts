import { PantryCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  requireHouseholdMembership,
  requireRequestUser,
} from "@/lib/http/route-guards";
import { normalizeTerm } from "@/lib/inventory/name-lexicon";
import { normalizeIngredient } from "@/lib/language/ingredient-normalizer";
import { prisma } from "@/lib/prisma";

const updateItemSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    quantity: z.number().positive(),
    unit: z.string().trim().max(40).nullable(),
    category: z.nativeEnum(PantryCategory),
    location: z.string().trim().max(120).nullable(),
    useByDate: z.string().date().nullable(),
    notes: z.string().trim().max(1000).nullable(),
    localizedNames: z.record(z.string().trim().min(2).max(8), z.string().trim().min(1).max(120)),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No fields to update");

type Context = { params: Promise<{ householdId: string; itemId: string }> };

// Auth + membership + item-belongs-to-household (404 otherwise, so ids don't leak across households).
async function loadItem(context: Context) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return { response: userResult.response };
  }

  const { householdId, itemId } = await context.params;
  const membershipResult = await requireHouseholdMembership(householdId, userResult.value.id);
  if (!membershipResult.ok) {
    return { response: membershipResult.response };
  }

  const item = await prisma.pantryItem.findFirst({ where: { id: itemId, householdId } });
  if (!item) {
    return { response: NextResponse.json({ error: "Item not found" }, { status: 404 }) };
  }

  return { item };
}

export async function PATCH(request: NextRequest, context: Context) {
  const loaded = await loadItem(context);
  if (!loaded.item) {
    return loaded.response;
  }

  const parsed = updateItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, localizedNames, useByDate, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (useByDate !== undefined) {
    data.useByDate = useByDate ? new Date(`${useByDate}T00:00:00.000Z`) : null;
  }

  // Name or aliases changed: re-derive canonical name and replace alias rows.
  if (name !== undefined || localizedNames !== undefined) {
    const primaryName = name ?? loaded.item.primaryName;
    const normalized = await normalizeIngredient(primaryName, localizedNames);
    data.primaryName = primaryName;
    data.normalizedPrimaryName = normalizeTerm(primaryName);
    data.canonicalName = normalized.canonical;
    data.names = {
      deleteMany: {},
      create: normalized.aliases.map((alias) => ({
        locale: alias.locale,
        text: alias.text,
        normalizedText: normalizeTerm(alias.text),
      })),
    };
  }

  const item = await prisma.pantryItem.update({
    where: { id: loaded.item.id },
    data,
    include: { names: { orderBy: { locale: "asc" } } },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_request: NextRequest, context: Context) {
  const loaded = await loadItem(context);
  if (!loaded.item) {
    return loaded.response;
  }

  await prisma.pantryItem.delete({ where: { id: loaded.item.id } });
  return new NextResponse(null, { status: 204 });
}
