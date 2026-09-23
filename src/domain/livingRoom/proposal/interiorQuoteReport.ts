import { cabinetProjectFromInteriorProject, type InteriorProject } from "../../interiorProject";
import { interiorEstimateSummary } from "../../interiorEstimate/measure";
import { interiorRateLookup } from "../../priceBook";
import { createProjectReport, type ProjectReport } from "../../projectReport";
import { readProposalCommercial } from "./commercialState";
import type { LiveQuoteOptions } from "./liveQuoteOptions";

/** Same report inputs as the live quote, including the price book. */
export function createInteriorQuoteReport(
  document: InteriorProject,
  now = new Date().toISOString(),
  options: LiveQuoteOptions = {},
): ProjectReport {
  const commercial = readProposalCommercial(document);
  const compatible = cabinetProjectFromInteriorProject(document);
  const interior = interiorEstimateSummary(
    document,
    interiorRateLookup(options.priceBook?.interiorRates ?? []),
  );
  return createProjectReport(
    {
      ...compatible.project,
      ...(interior.enabled
        ? { cabinets: compatible.project.rooms?.flatMap((room) => room.cabinets) ?? compatible.project.cabinets }
        : {}),
      job: { ...commercial.job, quotedAt: commercial.job.quotedAt ?? now },
      preferences: {
        ...compatible.project.preferences,
        snapSizeMm: compatible.project.preferences?.snapSizeMm ?? 50,
        showGrid: compatible.project.preferences?.showGrid ?? true,
        autoSaveToBrowser: compatible.project.preferences?.autoSaveToBrowser ?? true,
        quote: commercial.quote,
      },
      quoteHistory: commercial.quoteHistory,
    },
    compatible.room,
    undefined,
    { priceBook: options.priceBook ?? null },
  );
}
