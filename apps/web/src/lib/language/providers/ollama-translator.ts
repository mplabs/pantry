import {
  defaultCanonical,
  parseJsonObject,
  parseTranslationResultFromUnknown,
  type IngredientTranslator,
  type TranslationResult,
} from "@/lib/language/provider-types";

type OllamaGenerateResponse = {
  response?: string;
};

export class OllamaIngredientTranslator implements IngredientTranslator {
  constructor(
    private readonly baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    private readonly model = process.env.OLLAMA_MODEL ?? "llama3.1",
  ) {}

  async normalize(term: string, localeHint?: string): Promise<TranslationResult> {
    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/api/generate`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: "json",
        prompt: [
          "Normalize ingredient names to a canonical shopping term and return concise EN/DE aliases as JSON.",
          `Ingredient: ${term}`,
          `Locale hint: ${localeHint ?? "unknown"}`,
          'Return exactly this JSON shape: {"canonical": string, "aliases": [{"locale":"en|de","text":string}]}',
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      return {
        canonical: defaultCanonical(term),
        aliases: [],
      };
    }

    const payload = (await response.json()) as OllamaGenerateResponse;

    return parseTranslationResultFromUnknown(
      term,
      parseJsonObject(payload.response ?? ""),
    );
  }
}
