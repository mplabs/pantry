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

function defaultCanonical(term: string): string {
  return term.trim().toLowerCase();
}

function parseJsonObject(input: string): Record<string, unknown> | null {
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

export class OpenAiIngredientTranslator implements IngredientTranslator {
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  ) {}

  async normalize(term: string, localeHint?: string): Promise<TranslationResult> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "Normalize ingredient names to a canonical shopping term and return concise EN/DE aliases as JSON.",
          },
          {
            role: "user",
            content: `Ingredient: ${term}\nLocale hint: ${localeHint ?? "unknown"}\nReturn JSON only with shape {\"canonical\": string, \"aliases\": [{\"locale\":\"en|de\",\"text\":string}]}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        canonical: defaultCanonical(term),
        aliases: [],
      };
    }

    const payload = (await response.json()) as {
      output_text?: string;
    };

    const parsed = parseJsonObject(payload.output_text ?? "");

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
}

export class NoopIngredientTranslator implements IngredientTranslator {
  async normalize(term: string): Promise<TranslationResult> {
    return {
      canonical: defaultCanonical(term),
      aliases: [],
    };
  }
}

export function buildIngredientTranslator(): IngredientTranslator {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return new OpenAiIngredientTranslator(apiKey);
  }
  return new NoopIngredientTranslator();
}
