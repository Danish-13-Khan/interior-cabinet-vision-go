import type { CabinetProject } from "../../cabinetDimensions";
import type { InteriorProject } from "../../interiorProject";
import { adaptHandoffProject, listHandoffCabinets } from "./handoffCabinets";

export function mapHandoffSelection(
  project: CabinetProject,
  interiorObjectIds: string[],
): string[] {
  const cabinets = listHandoffCabinets(project);
  const mapped: string[] = [];
  for (const objectId of interiorObjectIds) {
    const cabinet = cabinets.find((item) =>
      item.interiorObjectId === objectId || item.id === objectId,
    );
    if (cabinet && !mapped.includes(cabinet.id)) mapped.push(cabinet.id);
  }
  return mapped;
}

export function mapDocumentHandoffSelection(
  document: InteriorProject,
  interiorObjectIds: string[],
): string[] {
  return mapHandoffSelection(adaptHandoffProject(document).project, interiorObjectIds);
}
