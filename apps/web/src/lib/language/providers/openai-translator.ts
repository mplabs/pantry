import {
  defaultCanonical,
  parseJsonObject,
  parseTranslationResultFromUnknown,
  type IngredientTranslator,
  type TranslationResult,
} from "@/lib/language/provider-types";

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

    return parseTranslationResultFromUnknown(
      term,
      parseJsonObject(payload.output_text ?? ""),
    );
  }
}
