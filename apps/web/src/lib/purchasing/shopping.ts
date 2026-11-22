import { normalizeIngredient } from "@/lib/language/ingredient-normalizer";

import type { ProductOffer, PurchasingProvider } from "./provider";

export type ShoppingMatch = {
  term: string;
  canonical: string;
  shoppingTerm: string;
  offers: ProductOffer[];
};

/** Maps a (possibly English) term to its German shopping term, then asks the provider. */
export async function searchShopping(
  provider: PurchasingProvider,
  term: string,
): Promise<ShoppingMatch> {
  const normalized = await normalizeIngredient(term);
  const german = normalized.aliases.find((a) => a.locale === "de")?.text;
  const shoppingTerm = german ?? term;
  return {
    term,
    canonical: normalized.canonical,
    shoppingTerm,
    offers: await provider.searchOffers(shoppingTerm),
  };
}
