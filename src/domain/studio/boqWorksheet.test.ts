import { describe, expect, it } from "vitest";
import type { BoqLine } from "../boq";
import { applyBoqDeltaToQuote, applyBoqQuantities, boqSellDelta, boqWorksheetTotals, clampBoqQuantities, scaleBoqLine } from "./boqWorksheet";
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

  it("moves the quote total by the quantity sell delta", () => {
    const quote = {
      sellTotal: 1000,
      estimateLines: [],
      summaryCards: [{ label: "Quote total", amount: 1000 }],
    } as ProjectQuote;
    const adjusted = applyBoqDeltaToQuote(quote, -80);
    expect(adjusted.sellTotal).toBe(920);
    expect(adjusted.estimateLines[0]?.label).toBe("BOQ quantity adjustment");
    expect(adjusted.summaryCards[0]?.amount).toBe(920);
    expect(applyBoqDeltaToQuote(adjusted, 0)).toBe(adjusted);
    expect(clampBoqQuantities({ "cab:door": 2.4, bad: -1, "": 3 })).toEqual({ "cab:door": 2 });
  });
});
