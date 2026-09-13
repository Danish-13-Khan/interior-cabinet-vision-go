import { describe, expect, it } from "vitest";
import { createLivingRoomStarterProject } from "../livingRoom/preset";
import { collectRateCategories, objectRateCategory, rateCategoryLabel } from "./categories";
import { interiorEstimateSummary, measureInteriorEstimate } from "./measure";
import {
  patchEstimateLine,
  readInteriorEstimate,
  setEstimateCategoryRate,
  writeInteriorEstimate,
} from "./state";

function enabled() {
  const project = createLivingRoomStarterProject();
  return writeInteriorEstimate(project, { ...readInteriorEstimate(project), enabled: true });
}

describe("objectRateCategory", () => {
  it("groups by catalogue category so one rate covers the group", () => {
    expect(objectRateCategory({ category: "Tables And Desks", kind: "furniture" } as never))
      .toBe("object.tables-and-desks");
    expect(objectRateCategory({ category: "", kind: "furniture" } as never)).toBe("object.furniture");
  });
});

describe("category rates", () => {
  it("reports missing rates before any rate is entered", () => {
    const lines = measureInteriorEstimate(enabled());
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => line.rateSource === "missing" || line.category === "manual")).toBe(true);
  });

  it("resolves every line in a category from one entered rate", () => {
    const project = setEstimateCategoryRate(enabled(), "surface.wall", 60);
    const walls = measureInteriorEstimate(project).filter((line) => line.category === "surface.wall");
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((line) => line.rate === 60 && line.rateSource === "category")).toBe(true);
    expect(walls.every((line) => line.amount === Math.round(line.quantity * 60))).toBe(true);
  });

  it("lets a line rate override its category rate", () => {
    const withCategory = setEstimateCategoryRate(enabled(), "surface.wall", 60);
    const target = measureInteriorEstimate(withCategory).find((line) => line.category === "surface.wall")!;
    const withOverride = patchEstimateLine(withCategory, target.id, { rate: 95 });
    const line = measureInteriorEstimate(withOverride).find((item) => item.id === target.id)!;
    expect(line.rate).toBe(95);
    expect(line.rateSource).toBe("line");
  });

  it("clearing a category rate returns its lines to missing rather than charging zero", () => {
    const cleared = setEstimateCategoryRate(setEstimateCategoryRate(enabled(), "surface.wall", 60), "surface.wall", null);
    const walls = measureInteriorEstimate(cleared).filter((line) => line.category === "surface.wall");
    expect(walls.every((line) => line.rate === null && line.rateSource === "missing")).toBe(true);
    expect(interiorEstimateSummary(cleared).missing.length).toBeGreaterThan(0);
  });

  it("survives save and reopen through project extensions", () => {
    const project = setEstimateCategoryRate(enabled(), "surface.floor", 350);
    expect(readInteriorEstimate(project).categoryRates["surface.floor"]).toBe(350);
    expect(readInteriorEstimate(JSON.parse(JSON.stringify(project))).categoryRates["surface.floor"]).toBe(350);
  });

  it("rejects a negative or non-numeric stored rate on read", () => {
    const project = enabled();
    const poisoned = { ...project, extensions: { ...project.extensions,
      interiorEstimate: { enabled: true, overrides: {}, manual: [], categoryRates: { "surface.wall": -5, "surface.floor": "x" } } } };
    expect(readInteriorEstimate(poisoned as never).categoryRates).toEqual({});
  });
});

describe("collectRateCategories", () => {
  it("summarises only the categories the project needs and skips manual lines", () => {
    const lines = measureInteriorEstimate(setEstimateCategoryRate(enabled(), "surface.wall", 60));
    const categories = collectRateCategories(lines);
    expect(categories.some((entry) => entry.category === "manual")).toBe(false);
    const wall = categories.find((entry) => entry.category === "surface.wall")!;
    expect(wall.rate).toBe(60);
    expect(wall.needsRate).toBe(false);
    expect(wall.unit).toBe("m2");
    expect(rateCategoryLabel("surface.wall")).toBe("Wall finish");
  });
});
