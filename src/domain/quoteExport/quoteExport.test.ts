import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetProject } from "../cabinetDimensions";
import { createDefaultJobMeta } from "../jobMeta";
import { createDefaultPriceBook } from "../priceBook";
import { createProjectReport } from "../projectReport";
import { DEFAULT_QUOTE_SETTINGS } from "../quoteSettings";
import type { RoomConfig } from "../roomModel";
import { UNAVAILABLE_ENTITLEMENTS, entitlementsForPlan } from "../saas/entitlements";
import {
  buildCommercialExportBundle,
  buildInvoiceTemplateDocument,
  clampInvoiceBranding,
  freezeCabinetProjectQuote,
  gateFreezeQuotes,
  ratesFingerprintFromBook,
} from ".";

const room: RoomConfig = {
  dimensions: {
    widthMm: 6000,
    depthMm: 4000,
    heightMm: 2800,
    wallThicknessMm: 120,
    showBackWall: true,
    showLeftWall: true,
    showRightWall: true,
  },
  doors: [],
  windows: [],
};

function makeProject(): CabinetProject {
  return {
    version: 1,
    cabinets: [
      {
        id: "cab-1",
        name: "Base Cabinet",
        placement: { x: 900, y: 0, z: 300, rotation: 0, attachment: "floor" },
        config: getDefaultCabinetConfig("base"),
      },
    ],
    job: createDefaultJobMeta({
      customerName: "Rivera",
      projectNumber: "JOB-317",
      revision: "A",
      status: "draft",
    }),
    preferences: {
      snapSizeMm: 50,
      showGrid: true,
      autoSaveToBrowser: true,
      quote: { ...DEFAULT_QUOTE_SETTINGS },
    },
  };
}

describe("quote export + freeze gate (Phase B)", () => {
  it("blocks freeze when entitlements deny canFreezeQuotes", () => {
    expect(gateFreezeQuotes(UNAVAILABLE_ENTITLEMENTS).ok).toBe(false);
    expect(gateFreezeQuotes(entitlementsForPlan("designer")).ok).toBe(true);
  });

  it("captures rates fingerprint on cabinet freeze and bumps revision when stale", () => {
    const project = makeProject();
    const book = createDefaultPriceBook("test-owner");
    const report = createProjectReport(project, room, undefined, { priceBook: book });
    const first = freezeCabinetProjectQuote({
      project,
      quote: report.quote,
      priceBook: book,
    });
    expect(first.snapshot.ratesFingerprint).toBeTruthy();
    expect(first.snapshot.revision).toBe("A");
    expect(first.project.quoteHistory).toHaveLength(1);

    const changedQuote = {
      ...report.quote,
      sellTotal: report.quote.sellTotal + 500,
    };
    const second = freezeCabinetProjectQuote({
      project: first.project,
      quote: changedQuote,
      priceBook: book,
    });
    expect(second.snapshot.revision).toBe("B");
    expect(second.project.quoteHistory).toHaveLength(2);
    expect(second.project.quoteHistory[1]?.id).toBe(first.snapshot.id);
    expect(second.project.quoteHistory[1]?.sellTotal).toBe(first.snapshot.sellTotal);
  });

  it("builds CSV / Excel / JSON export bundle and invoice template fields", () => {
    const project = makeProject();
    const report = createProjectReport(project, room);
    const frozen = freezeCabinetProjectQuote({
      project,
      quote: report.quote,
      priceBook: null,
    });
    const bundle = buildCommercialExportBundle({
      report: { ...report, quoteHistory: frozen.project.quoteHistory },
      frozen: frozen.snapshot,
      branding: { legalName: "Acme Interiors", gstin: "29AAAAA0000A1Z5" },
      exportedAt: "2026-09-13T00:00:00.000Z",
    });
    expect(bundle.quoteCsv).toContain("Quote total");
    expect(bundle.boqCsv).toContain("Thickness mm");
    expect(bundle.excelXml).toContain("Worksheet");
    expect(bundle.quoteJson).toContain('"kind": "quote-export"');
    expect(bundle.invoiceJson).toContain('"kind": "invoice-template"');
    expect(bundle.invoiceJson).toContain("Acme Interiors");

    const invoice = buildInvoiceTemplateDocument({
      branding: clampInvoiceBranding({
        legalName: "Acme Interiors",
        gstin: "29AAAAA0000A1Z5",
        invoiceNumber: "INV-100",
      }),
      frozen: frozen.snapshot,
    });
    expect(invoice.sellerName).toBe("Acme Interiors");
    expect(invoice.invoiceNumber).toBe("INV-100");
    expect(invoice.sellTotal).toBe(frozen.snapshot.sellTotal);
    expect(invoice.disclaimer).toMatch(/Template export only/i);
  });

  it("changes rates fingerprint when the price book rates change", () => {
    const project = makeProject();
    const book = createDefaultPriceBook("owner");
    const a = ratesFingerprintFromBook(project.preferences, book);
    const next = {
      ...book,
      boards: book.boards.map((row, index) =>
        index === 0 ? { ...row, costPerM2: row.costPerM2 + 100 } : row,
      ),
      updatedAt: "2026-09-13T01:00:00.000Z",
    };
    const b = ratesFingerprintFromBook(project.preferences, next);
    expect(a).not.toBe(b);
  });
});
