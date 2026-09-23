import { describe, expect, it } from "vitest";
import type { BoqLine } from "../boq";
import { applyBoqQuantities, boqWorksheetTotals, scaleBoqLine } from "./boqWorksheet";

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
  });
});
