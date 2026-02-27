import {
  defaultCanonical,
  type IngredientTranslator,
  type TranslationResult,
} from "@/lib/language/provider-types";

export class NoopIngredientTranslator implements IngredientTranslator {
  async normalize(term: string): Promise<TranslationResult> {
    return {
      canonical: defaultCanonical(term),
      aliases: [],
    };
  }
}
