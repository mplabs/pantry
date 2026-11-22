import type {
  ProductOffer,
  PurchaseOrderDraft,
  PurchaseOrderResult,
  PurchasingProvider,
} from "./provider";

// Deterministic hash so the same term always yields the same offers (tests, demos).
function hash(input: string): number {
  let h = 0;
  for (const ch of input) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Fake provider: no network, no ordering. Replace with REWE / Ökomarktgemeinschaft adapters later. */
export class MockPurchasingProvider implements PurchasingProvider {
  providerName = "mock";

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async searchOffers(term: string): Promise<ProductOffer[]> {
    const key = term.trim().toLowerCase();
    const base = 99 + (hash(key) % 400);
    return [
      { provider: this.providerName, offerId: `mock-${key}-eco`, title: `${term} (Bio)`, priceCents: base + 100, currency: "EUR", packageLabel: "500 g" },
      { provider: this.providerName, offerId: `mock-${key}-std`, title: term, priceCents: base, currency: "EUR", packageLabel: "500 g" },
    ];
  }

  async submitOrder(): Promise<PurchaseOrderResult> {
    // ponytail: orders are out of scope for this step; the API never calls this.
    throw new Error("Mock provider does not place orders");
  }
}

export type { PurchaseOrderDraft };
