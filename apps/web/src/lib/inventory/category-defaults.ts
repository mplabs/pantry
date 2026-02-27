import { PantryCategory } from "@prisma/client";

export const CATEGORY_DEFAULT_SHELF_LIFE_DAYS: Record<PantryCategory, number> = {
  DAIRY: 7,
  PRODUCE: 5,
  MEAT: 3,
  FROZEN: 120,
  CANNED: 365,
  GRAINS: 180,
  LEGUMES: 180,
  SPICES: 365,
  BEVERAGES: 30,
  BAKING: 240,
  SNACKS: 45,
  OTHER: 14,
};

export function defaultShelfLifeDays(category: PantryCategory): number {
  return CATEGORY_DEFAULT_SHELF_LIFE_DAYS[category];
}
