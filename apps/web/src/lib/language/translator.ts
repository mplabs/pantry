import {
  type IngredientTranslator,
  type LocalizedTerm,
  type TranslationResult,
} from "@/lib/language/provider-types";
import { NoopIngredientTranslator } from "@/lib/language/providers/noop-translator";
import { OllamaIngredientTranslator } from "@/lib/language/providers/ollama-translator";
import { OpenAiIngredientTranslator } from "@/lib/language/providers/openai-translator";

type TranslatorProvider = "auto" | "openai" | "ollama" | "noop";

function resolveProvider(): TranslatorProvider {
  const raw = process.env.INGREDIENT_TRANSLATOR_PROVIDER?.trim().toLowerCase();

  if (raw === "openai" || raw === "ollama" || raw === "noop" || raw === "auto") {
    return raw;
  }

  return "auto";
}

function autoProvider(): IngredientTranslator {
  const hasOllamaConfig = Boolean(process.env.OLLAMA_MODEL || process.env.OLLAMA_BASE_URL);

  if (hasOllamaConfig) {
    return new OllamaIngredientTranslator();
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAiIngredientTranslator(process.env.OPENAI_API_KEY);
  }

  return new NoopIngredientTranslator();
}

export function buildIngredientTranslator(): IngredientTranslator {
  const provider = resolveProvider();

  if (provider === "openai") {
    return process.env.OPENAI_API_KEY
      ? new OpenAiIngredientTranslator(process.env.OPENAI_API_KEY)
      : new NoopIngredientTranslator();
  }

  if (provider === "ollama") {
    return new OllamaIngredientTranslator();
  }

  if (provider === "noop") {
    return new NoopIngredientTranslator();
  }

  return autoProvider();
}

export type { IngredientTranslator, LocalizedTerm, TranslationResult };
