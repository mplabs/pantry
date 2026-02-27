import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRequestUser } from "@/lib/http/route-guards";
import { normalizeIngredient } from "@/lib/language/ingredient-normalizer";

const resolveSchema = z.object({
  ingredients: z.array(z.string().trim().min(1).max(120)).min(1).max(50),
});

export async function POST(request: NextRequest) {
  const userResult = await requireRequestUser();
  if (!userResult.ok) {
    return userResult.response;
  }

  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const normalized = await Promise.all(
    parsed.data.ingredients.map(async (ingredient) => {
      const result = await normalizeIngredient(ingredient);
      return {
        input: ingredient,
        canonical: result.canonical,
        aliases: result.aliases,
      };
    }),
  );

  return NextResponse.json({
    normalized,
    llmEnabled: Boolean(process.env.OPENAI_API_KEY),
  });
}
