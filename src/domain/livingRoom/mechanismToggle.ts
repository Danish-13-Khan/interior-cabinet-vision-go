import type { InteriorProject } from "../interiorProject";
import { getCabinetMechanismState, mechanismFrontIndex, mechanismPanelPatch } from "./cabinetMechanisms";

/** Parameter patch that flips the clicked door/drawer front, or null when the click is not a front. */
export function mechanismTogglePatch(
  project: InteriorProject,
  objectId: string,
  primitiveId: string,
): Record<string, string | number | boolean> | null {
  const object = project.objects.find((item) => item.id === objectId);
  const state = object ? getCabinetMechanismState(object) : null;
  const index = mechanismFrontIndex(primitiveId);
  if (!state || index === null || index >= state.count) return null;
  return mechanismPanelPatch(index, !state.open[index]);
}
