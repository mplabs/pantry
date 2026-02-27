export type LocalizedTerm = {
  locale: string;
  text: string;
};

export type TranslationResult = {
  canonical: string;
  aliases: LocalizedTerm[];
};

export interface IngredientTranslator {
  normalize(term: string, localeHint?: string): Promise<TranslationResult>;
}

export function defaultCanonical(term: string): string {
  return term.trim().toLowerCase();
}

export function parseJsonObject(input: string): Record<string, unknown> | null {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(input.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parseTranslationResultFromUnknown(
  term: string,
  parsed: Record<string, unknown> | null,
): TranslationResult {
  if (!parsed) {
    return {
      canonical: defaultCanonical(term),
      aliases: [],
    };
  }

  const canonical =
    typeof parsed.canonical === "string" && parsed.canonical.trim().length > 0
      ? parsed.canonical.trim().toLowerCase()
      : defaultCanonical(term);

  const aliases = Array.isArray(parsed.aliases)
    ? parsed.aliases
        .map((candidate) => {
          if (!candidate || typeof candidate !== "object") {
            return null;
          }

          const locale = (candidate as { locale?: unknown }).locale;
          const text = (candidate as { text?: unknown }).text;

          if (typeof locale !== "string" || typeof text !== "string") {
            return null;
          }

          return {
            locale: locale.trim().toLowerCase(),
            text: text.trim(),
          } satisfies LocalizedTerm;
        })
        .filter((candidate): candidate is LocalizedTerm => Boolean(candidate))
    : [];

  return { canonical, aliases };
}
