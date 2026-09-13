/**
 * Domain smoke: design → rates → freeze → frozen CSV, plus millwork through the adapter.
 */
import { describe, expect, it } from "vitest";
import { measureInteriorEstimate } from "../../interiorEstimate/measure";
import { interiorRateLookup } from "../../priceBook";
import { csvFromFrozenSnapshot } from "../../quoteExport/csvRows";
import {
  appendFrozenQuote,
  buildLiveInteriorQuote,
  freezeLiveQuote,
  readProposalCommercial,
} from ".";
import {
  designedAndRated,
  fillMissingCategoryRates,
  ledgerIdAfterAdapter,
  placeSmokeMillwork,
  SMOKE_NOW,
} from "./designToFreezeSmoke.helpers";

function expectIssuedFreeze(
  project: ReturnType<typeof designedAndRated>["project"],
  book: ReturnType<typeof designedAndRated>["book"],
  snapshotId: string,
) {
  const live = buildLiveInteriorQuote(project, SMOKE_NOW, { priceBook: book });
  expect(live.missingRate).toBe(false);
  expect(live.quote.sellTotal).toBeGreaterThan(0);

  const snapshot = freezeLiveQuote(project, SMOKE_NOW, snapshotId, { priceBook: book });
  expect(snapshot.detailLines?.length).toBeGreaterThan(0);
  expect(snapshot.sellTotal).toBe(live.quote.sellTotal);

  const csv = csvFromFrozenSnapshot(snapshot);
  expect(csv).toContain("Issued line");
  expect(csv).not.toContain("Not captured on this revision");

  const issued = readProposalCommercial(appendFrozenQuote(project, snapshot)).quoteHistory[0];
  expect(issued?.id).toBe(snapshotId);
  expect(issued?.detailLines?.length).toBeGreaterThan(0);
  return { live, snapshot, csv };
}

function expectLedgerPrefersInteriorId(project: ReturnType<typeof designedAndRated>["project"]) {
  const { adapted, ledger } = ledgerIdAfterAdapter(project);
  expect(adapted.project.interiorDocument?.id).toBe(project.id);
  expect(ledger.ok).toBe(true);
  if (!ledger.ok) return;
  expect(ledger.projectId).toBe(project.id);
  expect(ledger.project.ledgerProjectId).toBe(project.id);
  expect(ledger.projectId).not.toBe("cabinet-project");
  expect(ledger.projectId).not.toBe("SMOKE-1");
}

describe("design → rates → freeze → frozen CSV detail (smoke)", () => {
  it("issues detail lines on freeze and keys the ledger to the interior id", () => {
    const { project, book } = designedAndRated();
    const bookLookup = interiorRateLookup(book.interiorRates);
    const walls = measureInteriorEstimate(project, bookLookup).filter(
      (line) => line.category === "surface.wall",
    );
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((line) => line.rate === 60 && line.rateSource === "category")).toBe(true);

    const { csv } = expectIssuedFreeze(project, book, "smoke-snap-1");
    expect(csv).toMatch(/Wall finish|Floor finish/i);
    expectLedgerPrefersInteriorId(project);
  });

  it("freezes after placing wardrobe and kitchen millwork through the adapter", () => {
    const started = designedAndRated("smoke-millwork-freeze");
    const project = fillMissingCategoryRates(placeSmokeMillwork(started.project), started.book);
    expect(project.objects.some((object) => object.catalogItemId === "living:wardrobe-wall")).toBe(true);
    expect(project.objects.some((object) => object.catalogItemId === "living:base-cabinet-900")).toBe(true);

    const { adapted } = ledgerIdAfterAdapter(project);
    const cabinets = (adapted.project.rooms ?? []).flatMap((room) => room.cabinets);
    expect(cabinets.some((cabinet) => cabinet.config.catalogItemId === "living:wardrobe-wall"
      && cabinet.config.type === "almirah")).toBe(true);
    expect(cabinets.some((cabinet) => cabinet.config.catalogItemId === "living:base-cabinet-900"
      && cabinet.config.type === "base")).toBe(true);

    expectIssuedFreeze(project, started.book, "smoke-snap-millwork");
    expectLedgerPrefersInteriorId(project);
  });
});
