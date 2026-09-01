import { readCabinetIdentity } from "../../cabinetIdentity";
import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorProject } from "../../interiorProject";
import { createExportableProjectCutlist } from "../../productionOutputs";
import { buildHandoffSummary } from "../handoff";
import { buildLiveInteriorQuote } from "../proposal/liveQuote";
import { readProposalCommercial } from "../proposal/commercialState";
import { GOLDEN_RUN_OBJECT_IDS } from "./types";
import { readGoldenRunCountertop } from "./countertops";

export type GoldenRunMetrics = {
  revision: string;
  projectNumber: string;
  customerName: string;
  sellTotal: number;
  fingerprint: string;
  cutlistPartCount: number;
  cutlistWidthSum: number;
  countertopId: string;
  countertopWidthMm: number;
  countertopCabinetIds: string[];
  revisedCabinetWidthMm: number;
  cabinetIds: string[];
  engineeringIds: string[];
  familyIds: string[];
};

function cutlistWidthSum(document: InteriorProject) {
  const adapted = cabinetProjectFromInteriorProject(document);
  const lines = createExportableProjectCutlist(adapted.project);
  return {
    partCount: lines.length,
    widthSum: lines.reduce((sum, line) => sum + line.widthMm, 0),
  };
}

/** Quote, cutlist, identity, and job snapshot used by P0-E assertions. */
export function measureGoldenRun(document: InteriorProject): GoldenRunMetrics {
  const commercial = readProposalCommercial(document);
  const live = buildLiveInteriorQuote(document);
  const cutlist = cutlistWidthSum(document);
  const top = readGoldenRunCountertop(document);
  const handoff = buildHandoffSummary(document);
  const revised = document.objects.find((item) => item.id === GOLDEN_RUN_OBJECT_IDS.baseA);
  const cabinets = document.objects.filter((item) => readCabinetIdentity(item));
  return {
    revision: commercial.job.revision,
    projectNumber: commercial.job.projectNumber,
    customerName: commercial.job.customerName,
    sellTotal: live.quote.sellTotal,
    fingerprint: live.fingerprint,
    cutlistPartCount: cutlist.partCount,
    cutlistWidthSum: cutlist.widthSum,
    countertopId: top.id,
    countertopWidthMm: top.widthMm,
    countertopCabinetIds: [...top.cabinetIds],
    revisedCabinetWidthMm: revised?.dimensions.widthMm ?? 0,
    cabinetIds: cabinets.map((item) => item.id).sort(),
    engineeringIds: handoff.cabinets
      .filter((line) => line.golden)
      .map((line) => line.cabinetId)
      .sort(),
    familyIds: cabinets
      .map((item) => readCabinetIdentity(item)?.familyId ?? "")
      .filter(Boolean)
      .sort(),
  };
}
