import { beforeEach, describe, expect, it } from "vitest";
import { entitlementsForPlan } from "../saas/entitlements";
import {
  clearOrgPriceBook,
  createOrgPriceBook,
  persistOrgPriceBook,
  readOrgPriceBook,
  resolveOrgPriceBookForSeat,
} from "../priceBook";
import { assertCompanyCapability, gateSharedOrgPriceBook } from "./gate";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("shared org price book (Phase D)", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    clearOrgPriceBook(storage);
  });

  it("activates a real org book (no deferred stub)", () => {
    const record = createOrgPriceBook("org-1");
    expect(record.scope).toBe("org");
    expect(record.book.scope).toBe("org");
    expect(record.seatOverrides).toEqual([]);
    expect(record.book.labour.workshopPercent).toBeGreaterThan(0);
  });

  it("persists org book and applies seat labour overrides", () => {
    let record = createOrgPriceBook("org-1");
    record = {
      ...record,
      book: {
        ...record.book,
        labour: { ...record.book.labour, workshopPercent: 42 },
      },
      seatOverrides: [
        {
          seatId: "seat-d",
          labour: { workshopPercent: 38 },
        },
      ],
    };
    persistOrgPriceBook(record, storage);
    const loaded = readOrgPriceBook("org-1", storage);
    expect(loaded.book.labour.workshopPercent).toBe(42);
    const forSeat = resolveOrgPriceBookForSeat(loaded, "seat-d");
    expect(forSeat.labour.workshopPercent).toBe(38);
    const forOther = resolveOrgPriceBookForSeat(loaded, "seat-other");
    expect(forOther.labour.workshopPercent).toBe(42);
  });

  it("gates org book behind Company entitlement", () => {
    expect(gateSharedOrgPriceBook(entitlementsForPlan("company"))).toBe(true);
    expect(gateSharedOrgPriceBook(entitlementsForPlan("professional"))).toBe(false);
    expect(() =>
      assertCompanyCapability(entitlementsForPlan("designer"), "sharedOrgPriceBook"),
    ).toThrow(/Company/);
  });
});
