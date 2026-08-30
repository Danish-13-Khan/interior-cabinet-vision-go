import type { CabinetInstance, CabinetProject } from "../../cabinetDimensions";
import { listCurrentProjectCabinets } from "../../cabinetIdentity";
import { cabinetProjectFromInteriorProject } from "../../interiorProject";
import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";

export function adaptHandoffProject(document: InteriorProject) {
  return cabinetProjectFromInteriorProject(document);
}

export function listHandoffCabinets(project: CabinetProject): CabinetInstance[] {
  return listCurrentProjectCabinets(project);
}

export function cabinetForInteriorObject(
  project: CabinetProject,
  object: InteriorObjectEntity,
): CabinetInstance | undefined {
  return listHandoffCabinets(project).find((cabinet) =>
    cabinet.interiorObjectId === object.id || cabinet.id === object.id,
  );
}

export function expectedCabinetId(object: InteriorObjectEntity): string {
  const planning = object.extensions?.cabinetPlanning;
  if (planning && typeof planning === "object" && !Array.isArray(planning)) {
    const sourceId = (planning as { sourceId?: unknown }).sourceId;
    if (typeof sourceId === "string" && sourceId) return sourceId;
  }
  return object.id;
}
