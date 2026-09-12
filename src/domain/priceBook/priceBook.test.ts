import { describe, expect, it } from "vitest";
import { BOARD_MATERIALS, FINISHES } from "../materialSystem";
import { HARDWARE_CATALOG } from "../hardwareSystem";
import {
  clampPriceBook,
  clampPriceBookLabour,
  createDefaultPriceBook,
  createOrgPriceBookStub,
  FUTURE_CATALOG_SLOTS,
  persistPersonalPriceBook,
  PRICE_BOOK_STORAGE_KEY,
  readOrgPriceBookStub,
  readPersonalPriceBook,
} from "./index";

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

describe("price book defaults + clamp (Phase A)", () => {
  it("seeds board / finish / hardware rates from the existing catalogs", () => {
    const book = createDefaultPriceBook();
    const ply18 = book.boards.find((row) => row.materialId === "ply" && row.thicknessMm === 18);
    const catalogPly = BOARD_MATERIALS.find((item) => item.id === "ply")!.costPerM2[18];
    expect(ply18?.costPerM2).toBe(catalogPly);
    expect(book.finishes).toHaveLength(FINISHES.length);
    expect(book.hardware).toHaveLength(HARDWARE_CATALOG.length);
  });

  it("defaults labour to workshop % + zero allowances (Indian shop band)", () => {
    const labour = createDefaultPriceBook().labour;
    expect(labour.workshopPercent).toBe(40);
    expect(labour.workshopAllowance).toBe(0);
    expect(labour.quoteAllowance).toBe(0);
  });

  it("clamps labour fields with the same bounds as costing / quote", () => {
    expect(clampPriceBookLabour({ workshopPercent: -5, workshopAllowance: -10 }).workshopPercent).toBe(0);
    expect(clampPriceBookLabour({ workshopPercent: 200 }).workshopPercent).toBe(100);
    const book = clampPriceBook({
      labour: { workshopPercent: 45, workshopAllowance: 1500, quoteAllowance: 800 },
      quoteDefaults: { taxPercent: 99, markupPercent: -4, discountPercent: 12 },
      shopThickness: { carcassMm: 16, shutterMm: 18, backMm: 9 },
    });
    expect(book.labour.workshopPercent).toBe(45);
    expect(book.labour.workshopAllowance).toBe(1500);
    expect(book.labour.quoteAllowance).toBe(800);
    expect(book.quoteDefaults.taxPercent).toBe(40);
    expect(book.quoteDefaults.markupPercent).toBe(0);
    expect(book.quoteDefaults.discountPercent).toBe(12);
    expect(book.shopThickness.backMm).toBe(9);
  });

  it("drops unknown catalog ids and overlays known rates", () => {
    const book = clampPriceBook({
      boards: [
        { materialId: "ply", thicknessMm: 18, costPerM2: 90 },
        { materialId: "unobtanium" as never, thicknessMm: 18, costPerM2: 1 },
      ],
      hardware: [
        { hardwareId: "hinge-soft", costPerUnit: 120 },
        { hardwareId: "mystery-clip", costPerUnit: 9 },
      ],
    });
    expect(
      book.boards.find((row) => row.materialId === "ply" && row.thicknessMm === 18)?.costPerM2,
    ).toBe(90);
    expect(book.boards.some((row) => String(row.materialId) === "unobtanium")).toBe(false);
    expect(book.hardware.find((row) => row.hardwareId === "hinge-soft")?.costPerUnit).toBe(120);
    expect(book.hardware.some((row) => row.hardwareId === "mystery-clip")).toBe(false);
  });

  it("keeps shop thickness on the allowed Indian-norm set", () => {
    const bad = clampPriceBook({ shopThickness: { carcassMm: 7, shutterMm: 40, backMm: 3 } });
    expect(bad.shopThickness).toEqual({ carcassMm: 16, shutterMm: 18, backMm: 9 });
  });

  it("reserves blockboard / pine / laminate grades as typed TODO slots", () => {
    const ids = FUTURE_CATALOG_SLOTS.map((slot) => slot.id);
    expect(ids).toEqual(
      expect.arrayContaining(["blockboard", "pine", "laminate-hg", "laminate-acrylic", "laminate-matt", "laminate-inner"]),
    );
    expect(FUTURE_CATALOG_SLOTS.every((slot) => slot.status === "todo")).toBe(true);
  });

  it("persists a personal book and stubs the org book for Phase D", () => {
    const storage = memoryStorage();
    const saved = persistPersonalPriceBook(
      clampPriceBook({ labour: { workshopPercent: 42 } }),
      storage,
    );
    expect(storage.getItem(PRICE_BOOK_STORAGE_KEY)).toBeTruthy();
    expect(readPersonalPriceBook(storage).labour.workshopPercent).toBe(42);
    expect(saved.scope).toBe("personal");
    const stub = readOrgPriceBookStub();
    expect(stub).toEqual(createOrgPriceBookStub());
    expect(stub.status).toBe("deferred-phase-d");
  });
});
