type LexiconEntry = {
  canonical: string;
  locale: "en" | "de";
  term: string;
};

const LEXICON_ENTRIES: LexiconEntry[] = [
  { canonical: "milk", locale: "en", term: "milk" },
  { canonical: "milk", locale: "de", term: "milch" },
  { canonical: "butter", locale: "en", term: "butter" },
  { canonical: "butter", locale: "de", term: "butter" },
  { canonical: "eggs", locale: "en", term: "eggs" },
  { canonical: "eggs", locale: "de", term: "eier" },
  { canonical: "flour", locale: "en", term: "flour" },
  { canonical: "flour", locale: "de", term: "mehl" },
  { canonical: "sugar", locale: "en", term: "sugar" },
  { canonical: "sugar", locale: "de", term: "zucker" },
  { canonical: "rice", locale: "en", term: "rice" },
  { canonical: "rice", locale: "de", term: "reis" },
  { canonical: "bread", locale: "en", term: "bread" },
  { canonical: "bread", locale: "de", term: "brot" },
  { canonical: "apple", locale: "en", term: "apple" },
  { canonical: "apple", locale: "de", term: "apfel" },
  { canonical: "banana", locale: "en", term: "banana" },
  { canonical: "banana", locale: "de", term: "banane" },
];

const NORMALIZED_TO_CANONICAL = new Map<string, string>();
const CANONICAL_TO_ENTRIES = new Map<string, LexiconEntry[]>();

for (const entry of LEXICON_ENTRIES) {
  const normalized = normalizeTerm(entry.term);
  NORMALIZED_TO_CANONICAL.set(normalized, entry.canonical);

  const existing = CANONICAL_TO_ENTRIES.get(entry.canonical) ?? [];
  existing.push(entry);
  CANONICAL_TO_ENTRIES.set(entry.canonical, existing);
}

export function normalizeTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function canonicalizeName(value: string): string {
  const normalized = normalizeTerm(value);
  return NORMALIZED_TO_CANONICAL.get(normalized) ?? normalized;
}

export function aliasesForCanonicalName(canonicalName: string): LexiconEntry[] {
  return CANONICAL_TO_ENTRIES.get(canonicalName) ?? [];
}
