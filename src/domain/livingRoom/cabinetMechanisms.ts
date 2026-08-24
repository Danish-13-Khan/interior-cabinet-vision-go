import type { InteriorObjectEntity, ParameterValue } from "../interiorProject";

export type CabinetMechanismMode = "drawer" | "door";
export type CabinetMechanismState = { mode: CabinetMechanismMode; count: number; pullDepthMm: number; softClose: boolean; open: boolean[] };
const openKey = (index: number) => `mechanismOpen${index + 1}`;

/** Compact persisted state for interactive fronts; values live on the object parameters. */
export function getCabinetMechanismState(object: InteriorObjectEntity): CabinetMechanismState | null {
  if (object.catalogItemId !== "living:tv-unit" && object.kind !== "cabinet") return null;
  const count = Math.max(1, Math.min(8, Math.round(Number(object.parameters.drawerCount ?? object.parameters.doorCount ?? 1))));
  return { mode: object.parameters.frontMode === "door" ? "door" : "drawer", count, pullDepthMm: Math.max(80, Math.min(object.dimensions.depthMm * 0.9, Number(object.parameters.pullDepthMm) || 280)), softClose: object.parameters.softClose === true, open: Array.from({ length: count }, (_, index) => object.parameters[openKey(index)] === true) };
}
export function mechanismPanelPatch(index: number, open: boolean): Record<string, ParameterValue> { return { [openKey(index)]: open }; }
export function mechanismAllPatch(state: CabinetMechanismState, open: boolean): Record<string, ParameterValue> { return Object.fromEntries(state.open.map((_, index) => [openKey(index), open])); }
export function mechanismFrontIndex(primitiveId: string): number | null { const match = /^front-(\d+)$/.exec(primitiveId); return match ? Number(match[1]) - 1 : null; }
