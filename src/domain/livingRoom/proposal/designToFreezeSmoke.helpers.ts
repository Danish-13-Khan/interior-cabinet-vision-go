import {
  readInteriorEstimate,
  setEstimateCategoryRate,
  writeInteriorEstimate,
} from "../../interiorEstimate/state";
import { measureInteriorEstimate } from "../../interiorEstimate/measure";
import { createDefaultPriceBook, interiorRateLookup, type PriceBook } from "../../priceBook";
import { createDefaultJobMeta } from "../../jobMeta";
import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import { ensureCabinetLedgerProjectId } from "../../paymentLedger";
import type { InteriorProject } from "../../interiorProject";
import { addLivingRoomObject } from "../planCommands";
import { createLivingRoomObject } from "../catalog";
import { createLivingRoomStarterProject } from "../preset";
import { writeProposalCommercial } from "./commercialState";

export const SMOKE_NOW = "2026-09-13T12:00:00.000Z";

export function withInteriorRates(book: PriceBook, byId: Record<string, number>): PriceBook {
  return {
    ...book,
    interiorRates: book.interiorRates.map((row) =>
      byId[row.id] !== undefined ? { ...row, costPerUnit: byId[row.id]! } : row,
    ),
    updatedAt: SMOKE_NOW,
  };
}

export function fillMissingCategoryRates(project: InteriorProject, book: PriceBook): InteriorProject {
  const lookup = interiorRateLookup(book.interiorRates);
  let next = project;
  for (const line of measureInteriorEstimate(next, lookup)) {
    if (line.rate !== null || line.category === "manual") continue;
    next = setEstimateCategoryRate(next, line.category, line.unit === "each" ? 1200 : 80);
  }
  return next;
}

/** Living-room starter with estimate on and rates for every measured category. */
export function designedAndRated(projectId = "smoke-design-freeze") {
  let project = createLivingRoomStarterProject({
    now: SMOKE_NOW,
    projectId,
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
  project = writeInteriorEstimate(project, { ...readInteriorEstimate(project), enabled: true });
  project = setEstimateCategoryRate(project, "surface.wall", 60);
  project = setEstimateCategoryRate(project, "surface.floor", 350);
  const book = withInteriorRates(createDefaultPriceBook("smoke-freeze"), {
    paint: 55,
    flooring: 400,
  });
  return { project: fillMissingCategoryRates(project, book), book };
}

export function placeSmokeMillwork(project: InteriorProject): InteriorProject {
  const roomId = project.activeRoomId;
  const wardrobe = createLivingRoomObject("living:wardrobe-wall", {
    id: "smoke-wardrobe",
    roomId,
    position: { x: 0, y: 0, z: 0 },
  });
  const base = createLivingRoomObject("living:base-cabinet-900", {
    id: "smoke-base",
    roomId,
    position: { x: 1200, y: 0, z: 0 },
  });
  return addLivingRoomObject(addLivingRoomObject(project, wardrobe), base);
}

/** Dual-doc rule: ledger key is InteriorProject.id after the adapter seam. */
export function ledgerIdAfterAdapter(project: InteriorProject) {
  const adapted = cabinetProjectFromInteriorProject(project);
  const ledger = ensureCabinetLedgerProjectId(adapted.project);
  return { adapted, ledger };
}
