import { PantryCategory } from "@prisma/client";

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  image_front_small_url?: string;
  categories_tags?: string[];
};

type OpenFoodFactsLookupResponse = {
  status?: number;
  product?: OpenFoodFactsProduct;
};

export type BarcodeProductCandidate = {
  barcode: string;
  source: "openfoodfacts";
  productName: string;
  brand?: string;
  quantityLabel?: string;
  imageUrl?: string;
  category: PantryCategory;
  rawPayloadJson: string;
};

function inferCategory(tags: string[] | undefined, name: string): PantryCategory {
  const haystack = [...(tags ?? []), name.toLowerCase()].join(" ");

  if (/dairy|milk|cheese|yogurt|butter|cream/.test(haystack)) return PantryCategory.DAIRY;
  if (/fruit|vegetable|produce|apple|banana|lettuce|tomato/.test(haystack)) return PantryCategory.PRODUCE;
  if (/meat|beef|chicken|pork|sausages|ham/.test(haystack)) return PantryCategory.MEAT;
  if (/frozen/.test(haystack)) return PantryCategory.FROZEN;
  if (/canned|tin/.test(haystack)) return PantryCategory.CANNED;
  if (/grain|rice|pasta|oat|cereal/.test(haystack)) return PantryCategory.GRAINS;
  if (/lentil|bean|chickpea|legume/.test(haystack)) return PantryCategory.LEGUMES;
  if (/spice|seasoning|pepper|salt|herb/.test(haystack)) return PantryCategory.SPICES;
  if (/juice|water|soda|drink|beverage|tea|coffee/.test(haystack)) return PantryCategory.BEVERAGES;
  if (/baking|flour|sugar|yeast|powder/.test(haystack)) return PantryCategory.BAKING;
  if (/snack|chips|cracker|cookie|bar/.test(haystack)) return PantryCategory.SNACKS;
  return PantryCategory.OTHER;
}

export async function lookupOpenFoodFacts(barcode: string): Promise<BarcodeProductCandidate | null> {
  const fields = [
    "code",
    "product_name",
    "brands",
    "quantity",
    "image_front_small_url",
    "categories_tags",
  ].join(",");

  const userAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT ?? "PantryOS/0.1 (dev@local)";

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${fields}`,
    {
      headers: {
        "User-Agent": userAgent,
      },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OpenFoodFactsLookupResponse;

  if (payload.status !== 1 || !payload.product?.product_name?.trim()) {
    return null;
  }

  const productName = payload.product.product_name.trim();

  return {
    barcode,
    source: "openfoodfacts",
    productName,
    brand: payload.product.brands?.trim() || undefined,
    quantityLabel: payload.product.quantity?.trim() || undefined,
    imageUrl: payload.product.image_front_small_url?.trim() || undefined,
    category: inferCategory(payload.product.categories_tags, productName),
    rawPayloadJson: JSON.stringify(payload),
  };
}
