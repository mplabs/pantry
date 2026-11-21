import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CATEGORY_DEFAULT_SHELF_LIFE_DAYS, defaultShelfLifeDays } from "@/lib/inventory/category-defaults";
import { addDays, statusForUseByDate } from "@/lib/inventory/freshness";

describe("statusForUseByDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 13, 30)); // local time, mid-day
  });
  afterEach(() => vi.useRealTimers());

  const inDays = (n: number) => new Date(2026, 5, 15 + n, 23, 59);

  it("treats a missing date as fresh", () => {
    expect(statusForUseByDate(null)).toBe("fresh");
  });
  it("is expired only once the day has passed", () => {
    expect(statusForUseByDate(inDays(-1))).toBe("expired");
    expect(statusForUseByDate(inDays(0))).toBe("expiring");
  });
  it("is expiring through the threshold day, fresh after", () => {
    expect(statusForUseByDate(inDays(7))).toBe("expiring");
    expect(statusForUseByDate(inDays(8))).toBe("fresh");
    expect(statusForUseByDate(inDays(3), 2)).toBe("fresh");
  });
});

describe("addDays", () => {
  it("adds days without mutating the input", () => {
    const d = new Date(2026, 0, 30);
    expect(addDays(d, 3)).toEqual(new Date(2026, 1, 2));
    expect(d).toEqual(new Date(2026, 0, 30));
  });
});

describe("category defaults", () => {
  it("returns a positive default for every category", () => {
    for (const [category, days] of Object.entries(CATEGORY_DEFAULT_SHELF_LIFE_DAYS)) {
      expect(days).toBeGreaterThan(0);
      expect(defaultShelfLifeDays(category as keyof typeof CATEGORY_DEFAULT_SHELF_LIFE_DAYS)).toBe(days);
    }
    expect(defaultShelfLifeDays("MEAT")).toBeLessThan(defaultShelfLifeDays("FROZEN"));
  });
});
