import { MockPurchasingProvider } from "./mock-provider";
import { StubPurchasingProvider, type PurchasingProvider } from "./provider";

const providers: Record<string, () => PurchasingProvider> = {
  mock: () => new MockPurchasingProvider(),
  stub: () => new StubPurchasingProvider(),
};

export const DEFAULT_PROVIDER = "mock";

export function activeProviderName(): string {
  return process.env.PURCHASING_PROVIDER?.trim() || DEFAULT_PROVIDER;
}

export function listProviderNames(): string[] {
  return Object.keys(providers);
}

export function getPurchasingProvider(name = activeProviderName()): PurchasingProvider {
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown purchasing provider: ${name}`);
  return factory();
}
