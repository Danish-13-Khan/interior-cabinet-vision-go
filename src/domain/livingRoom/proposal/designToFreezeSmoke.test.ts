/**
 * One domain smoke: design → category/interior rates → freeze → frozen CSV detail lines.
 */
import { describe, expect, it } from "vitest";
import {
  readInteriorEstimate,
  setEstimateCategoryRate,
  writeInteriorEstimate,
} from "../../interiorEstimate/state";
import { measureInteriorEstimate } from "../../interiorEstimate/measure";
import { createDefaultPriceBook, interiorRateLookup, type PriceBook } from "../../priceBook";
import { csvFromFrozenSnapshot } from "../../quoteExport/csvRows";
import { createLivingRoomStarterProject } from "../preset";
import {
  appendFrozenQuote,
  buildLiveInteriorQuote,
  freezeLiveQuote,
  readProposalCommercial,
  writeProposalCommercial,
} from ".";
import { createDefaultJobMeta } from "../../jobMeta";

const NOW = "2026-09-13T12:00:00.000Z";

function withInteriorRates(book: PriceBook, byId: Record<string, number>): PriceBook {
  return {
    ...book,
    interiorRates: book.interiorRates.map((row) =>
      byId[row.id] !== undefined ? { ...row, costPerUnit: byId[row.id]! } : row,
    ),
    updatedAt: NOW,
  };
}

/** Minimal interiors design with estimate on and rates for every measured category. */
function designedAndRated() {
  let project = createLivingRoomStarterProject({
    now: NOW,
    projectId: "smoke-design-freeze",
    projectName: "Smoke Living Room",
  });
  project = writeProposalCommercial(project, {
    job: createDefaultJobMeta({
      customerName: "Smoke Client",
      projectNumber: "SMOKE-1",
      revision: "A",
      status: "draft",
    }),
  });
  project = writeInteriorEstimate(project, {
    ...readInteriorEstimate(project),
    enabled: true,
  });
  // Explicit category rates (journey step).
  project = setEstimateCategoryRate(project, "surface.wall", 60);
  project = setEstimateCategoryRate(project, "surface.floor", 350);
  const book = withInteriorRates(createDefaultPriceBook("smoke-freeze"), {
    paint: 55,
    flooring: 400,
  });
  const bookLookup = interiorRateLookup(book.interiorRates);
  // Cover remaining measured categories so freeze is not blocked by missing rates.
  for (const line of measureInteriorEstimate(project, bookLookup)) {
    if (line.rate !== null || line.category === "manual") continue;
    project = setEstimateCategoryRate(project, line.category, line.unit === "each" ? 1200 : 80);
  }
  return { project, book };
}

describe("design → rates → freeze → frozen CSV detail (smoke)", () => {
  it("issues detail lines on freeze and exports them in the frozen CSV", () => {
    const { project, book } = designedAndRated();
    const bookLookup = interiorRateLookup(book.interiorRates);

    const walls = measureInteriorEstimate(project, bookLookup).filter(
      (line) => line.category === "surface.wall",
    );
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((line) => line.rate === 60 && line.rateSource === "category")).toBe(true);

    const live = buildLiveInteriorQuote(project, NOW, { priceBook: book });
    expect(live.quote.estimateLines.length).toBeGreaterThan(0);
    expect(live.quote.sellTotal).toBeGreaterThan(0);
    expect(live.missingRate).toBe(false);

    const snapshot = freezeLiveQuote(project, NOW, "smoke-snap-1", { priceBook: book });
    expect(snapshot.detailLines?.length).toBeGreaterThan(0);
    expect(snapshot.sellTotal).toBe(live.quote.sellTotal);
    expect(
      snapshot.detailLines!.some((line) => /Wall finish|Floor finish/i.test(line.label)),
    ).toBe(true);

    const csv = csvFromFrozenSnapshot(snapshot);
    expect(csv).toContain("Issued line");
    expect(csv).not.toContain("Not captured on this revision");
    expect(csv).toMatch(/Wall finish|Floor finish/i);

    const frozenDoc = appendFrozenQuote(project, snapshot);
    const issued = readProposalCommercial(frozenDoc).quoteHistory[0];
    expect(issued?.id).toBe("smoke-snap-1");
    expect(issued?.detailLines?.length).toBeGreaterThan(0);
  });
});
