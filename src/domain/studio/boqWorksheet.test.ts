import { describe, expect, it } from "vitest";
import type { BoqLine } from "../boq";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import { applyBoqDeltaToQuote, applyBoqQuantities, boqQuantityLimitMessage, boqSellDelta, boqWorksheetTotals, clampBoqQuantities, scaleBoqLine } from "./boqWorksheet";
import type { ProjectQuote } from "../projectQuote";

const line: BoqLine = {
  key: "cab:door",
  cabinetId: "cab",
  cabinetName: "Base",
  mark: "B1",
  partLabel: "Door",
  category: "Door",
  role: "shutter",
  material: "MDF",
  finish: "white",
  thicknessMm: 18,
  quantity: 2,
  lengthMm: 700,
  widthMm: 400,
  areaM2: 0.56,
  workshopCost: 100,
  sellPrice: 160,
};

describe("BOQ worksheet", () => {
  it("scales price with quantity and leaves other lines alone", () => {
    const scaled = scaleBoqLine(line, 1);
    expect(scaled.quantity).toBe(1);
    expect(scaled.sellPrice).toBe(80);
    expect(scaled.workshopCost).toBe(50);
    const applied = applyBoqQuantities([line, { ...line, key: "cab:side", quantity: 1, sellPrice: 40 }], { "cab:door": 4 });
    expect(applied[0]?.quantity).toBe(4);
    expect(applied[0]?.sellPrice).toBe(320);
    expect(applied[1]?.quantity).toBe(1);
    expect(boqWorksheetTotals(applied).sell).toBe(360);
    const { delta } = boqSellDelta([line, { ...line, key: "cab:side", quantity: 1, sellPrice: 40 }], { "cab:door": 1 });
    expect(delta).toBe(-80);
  });

  it("recalculates markup, discount, and tax from the workshop change", () => {
    const quote = {
      settings: { ...DEFAULT_QUOTE_SETTINGS, markupPercent: 10, discountPercent: 10, taxPercent: 10 },
      workshopSubtotal: 1000,
      baseBeforeMarkup: 1000,
      markupAmount: 100,
      discountAmount: 110,
      taxableAmount: 990,
      taxAmount: 99,
      sellTotal: 1089,
      estimateLines: [
        { id: "markup", kind: "markup", label: "Markup (10%)", amount: 100 },
        { id: "discount", kind: "discount", label: "Discount (10%)", amount: -110 },
        { id: "tax", kind: "tax", label: "Tax (10%)", amount: 99 },
      ],
      summaryCards: [
        { label: "Workshop cost", amount: 1000 },
        { label: "Markup", amount: 100 },
        { label: "Discount", amount: 110 },
        { label: "Tax", amount: 99 },
        { label: "Quote total", amount: 1089 },
      ],
    } as ProjectQuote;
    const adjusted = applyBoqDeltaToQuote(quote, 100);
    expect(adjusted.markupAmount).toBe(110);
    expect(adjusted.discountAmount).toBe(121);
    expect(adjusted.taxAmount).toBe(109);
    expect(adjusted.sellTotal).toBe(1198);
    expect(adjusted.estimateLines.find((line) => line.id === "boq-quantity")?.amount).toBe(100);
    expect(adjusted.summaryCards.find((card) => card.label === "Tax")?.amount).toBe(109);
    expect(applyBoqDeltaToQuote(adjusted, 0)).toBe(adjusted);
  });

  it("keeps the first 200 quantity edits and names the rest", () => {
    expect(clampBoqQuantities({ "cab:door": 2.4, bad: -1, "": 3 })).toEqual({ "cab:door": 2 });
    const raw = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [`row-${index}`, 1]));
    expect(Object.keys(clampBoqQuantities(raw))).toHaveLength(200);
    expect(clampBoqQuantities(raw)["row-200"]).toBeUndefined();
    expect(boqQuantityLimitMessage(raw)).toBe("Only 200 quantity edits are saved. 1 more was not kept.");
    expect(boqQuantityLimitMessage({ "cab:door": 2 })).toBeNull();
  });
});
