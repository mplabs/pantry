import { PantryCategory } from "@prisma/client";

import { normalizeTerm } from "@/lib/inventory/name-lexicon";
import { prisma } from "@/lib/prisma";

import { lookupOpenFoodFacts } from "./openfoodfacts";

export type BarcodeProductLookup = {
  barcode: string;
  source: string;
  productName: string;
  normalizedProductName: string;
  brand?: string;
  quantityLabel?: string;
  imageUrl?: string;
  category: PantryCategory;
  fromCache: boolean;
};

function cacheTtlMs(): number {
  const days = Number(process.env.BARCODE_PRODUCT_CACHE_DAYS ?? "14");
  return Number.isFinite(days) && days > 0 ? days * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000;
}

function parseQuantityAsUnit(quantityLabel: string | undefined): string | undefined {
  if (!quantityLabel) {
    return undefined;
  }

  const normalized = quantityLabel.toLowerCase();
  if (normalized.includes("ml")) return "ml";
  if (normalized.includes("l")) return "L";
  if (normalized.includes("kg")) return "kg";
  if (normalized.includes("g")) return "g";
  return undefined;
}

function toLookupFromCache(row: {
  barcode: string;
  source: string;
  productName: string | null;
  normalizedProductName: string | null;
  brand: string | null;
  quantityLabel: string | null;
  imageUrl: string | null;
  category: PantryCategory;
}): BarcodeProductLookup | null {
  if (!row.productName || !row.normalizedProductName) {
    return null;
  }

  return {
    barcode: row.barcode,
    source: row.source,
    productName: row.productName,
    normalizedProductName: row.normalizedProductName,
    brand: row.brand ?? undefined,
    quantityLabel: row.quantityLabel ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    category: row.category,
    fromCache: true,
  };
}

export function barcodeToUnitHint(quantityLabel?: string): string | undefined {
  return parseQuantityAsUnit(quantityLabel);
}

export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeProductLookup | null> {
  const cached = await prisma.productCatalogItem.findUnique({
    where: { barcode },
    select: {
      barcode: true,
      source: true,
      productName: true,
      normalizedProductName: true,
      brand: true,
      quantityLabel: true,
      imageUrl: true,
      category: true,
      lastSyncedAt: true,
    },
  });

  if (cached && Date.now() - cached.lastSyncedAt.getTime() < cacheTtlMs()) {
    return toLookupFromCache(cached);
  }

  const fresh = await lookupOpenFoodFacts(barcode);

  if (!fresh) {
    return toLookupFromCache(cached ?? {
      barcode,
      source: "openfoodfacts",
      productName: null,
      normalizedProductName: null,
      brand: null,
      quantityLabel: null,
      imageUrl: null,
      category: PantryCategory.OTHER,
    });
  }

  const normalizedProductName = normalizeTerm(fresh.productName);

  await prisma.productCatalogItem.upsert({
    where: { barcode },
    create: {
      barcode,
      source: fresh.source,
      productName: fresh.productName,
      normalizedProductName,
      brand: fresh.brand,
      quantityLabel: fresh.quantityLabel,
      category: fresh.category,
      imageUrl: fresh.imageUrl,
      rawPayloadJson: fresh.rawPayloadJson,
      lastSyncedAt: new Date(),
    },
    update: {
      source: fresh.source,
      productName: fresh.productName,
      normalizedProductName,
      brand: fresh.brand,
      quantityLabel: fresh.quantityLabel,
      category: fresh.category,
      imageUrl: fresh.imageUrl,
      rawPayloadJson: fresh.rawPayloadJson,
      lastSyncedAt: new Date(),
    },
  });

  return {
    barcode,
    source: fresh.source,
    productName: fresh.productName,
    normalizedProductName,
    brand: fresh.brand,
    quantityLabel: fresh.quantityLabel,
    imageUrl: fresh.imageUrl,
    category: fresh.category,
    fromCache: false,
  };
}
