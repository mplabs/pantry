export type PurchaseListItem = {
  canonicalName: string;
  displayName: string;
  quantity: number;
  unit?: string | null;
};

export type PurchaseOrderDraft = {
  householdId: string;
  items: PurchaseListItem[];
  locale: string;
};

export type PurchaseOrderResult = {
  provider: string;
  externalOrderId: string;
  status: "submitted" | "queued";
};

export type ProductOffer = {
  provider: string;
  offerId: string;
  title: string;
  priceCents: number;
  currency: string;
  packageLabel?: string;
};

export interface PurchasingProvider {
  providerName: string;
  isHealthy(): Promise<boolean>;
  /** Offers for a shopping term already in the provider's language (e.g. German). */
  searchOffers(term: string): Promise<ProductOffer[]>;
  submitOrder(draft: PurchaseOrderDraft): Promise<PurchaseOrderResult>;
}

export class StubPurchasingProvider implements PurchasingProvider {
  providerName = "stub";

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async searchOffers(): Promise<ProductOffer[]> {
    return [];
  }

  async submitOrder(draft: PurchaseOrderDraft): Promise<PurchaseOrderResult> {
    return {
      provider: this.providerName,
      externalOrderId: `stub-${draft.householdId}-${Date.now()}`,
      status: "queued",
    };
  }
}
