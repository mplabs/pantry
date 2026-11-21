import { aliasesForCanonicalName, canonicalizeName, normalizeTerm } from "@/lib/inventory/name-lexicon";
import { buildIngredientTranslator, type LocalizedTerm } from "@/lib/language/translator";

export type NormalizedIngredient = {
  canonical: string;
  aliases: LocalizedTerm[];
};

function dedupeAliases(aliases: LocalizedTerm[]): LocalizedTerm[] {
  const seen = new Set<string>();

  return aliases.filter((alias) => {
    // Key on text only: the DB unique index (itemId, normalizedText) ignores locale.
    const key = normalizeTerm(alias.text);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function normalizeIngredient(
  input: string,
  localizedNames?: Record<string, string>,
): Promise<NormalizedIngredient> {
  const lexicalCanonical = canonicalizeName(input);
  const lexicalAliases = aliasesForCanonicalName(lexicalCanonical).map((entry) => ({
    locale: entry.locale,
    text: entry.term,
  }));

  const translator = buildIngredientTranslator();
  const llm = await translator.normalize(input);

  // A lexicon hit wins; the translator only decides for terms the lexicon doesn't know.
  const canonical =
    lexicalAliases.length === 0 && llm.canonical?.trim() ? normalizeTerm(llm.canonical) : lexicalCanonical;

  const manualAliases = Object.entries(localizedNames ?? {}).map(([locale, text]) => ({
    locale,
    text,
  }));

  const aliases = dedupeAliases([
    ...manualAliases,
    ...lexicalAliases,
    ...llm.aliases,
    { locale: "und", text: input },
  ]);

  return {
    canonical,
    aliases,
  };
}
