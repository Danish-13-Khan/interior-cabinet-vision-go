import { isGoldenCabinetFamilyId, readCabinetIdentity } from "../../cabinetIdentity";
import { createProjectReport } from "../../projectReport";
import type { InteriorProject } from "../../interiorProject";
import { readProposalCommercial } from "../proposal/commercialState";
import {
  adaptHandoffProject,
  cabinetForInteriorObject,
  expectedCabinetId,
} from "./handoffCabinets";
import { diagnoseHandoffLoss, lossyGoldenObjectIds } from "./handoffLossy";
import { mapHandoffSelection } from "./handoffSelection";
import type { HandoffCabinetLine, HandoffSummary } from "./types";

export function buildHandoffSummary(
  document: InteriorProject,
  selectedInteriorObjectIds: string[] = [],
): HandoffSummary {
  const commercial = readProposalCommercial(document);
  const adapted = adaptHandoffProject(document);
  const warnings = diagnoseHandoffLoss(document);
  const lossyGoldenIds = lossyGoldenObjectIds(document);
  const cabinets: HandoffCabinetLine[] = document.objects
    .filter((object) => object.kind === "cabinet")
    .map((object) => {
      const identity = readCabinetIdentity(object);
      const cabinet = cabinetForInteriorObject(adapted.project, object);
      const familyId = identity?.familyId ?? cabinet?.config.familyId ?? "";
      return {
        objectId: object.id,
        cabinetId: cabinet?.id ?? expectedCabinetId(object),
        name: object.name,
        cabinetType: identity?.cabinetType ?? cabinet?.config.type ?? "unknown",
        familyId,
        widthMm: object.dimensions.widthMm,
        heightMm: object.dimensions.heightMm,
        depthMm: object.dimensions.depthMm,
        golden: Boolean(familyId && isGoldenCabinetFamilyId(familyId)),
        lossy: lossyGoldenIds.includes(object.id),
      };
    });
  const report = createProjectReport(adapted.project, adapted.room);
  const room = document.rooms.find((item) => item.id === document.activeRoomId)
    ?? document.rooms[0];
  return {
    revision: commercial.job.revision,
    roomId: room?.id ?? "",
    roomName: room?.name ?? "Room",
    cabinetCount: cabinets.length,
    goldenCount: cabinets.filter((line) => line.golden).length,
    cabinets,
    diagnostics: adapted.diagnostics,
    warnings,
    lossyGoldenIds,
    selectedCabinetIds: mapHandoffSelection(adapted.project, selectedInteriorObjectIds),
    productionBlocked: report.productionBlocked,
  };
}
