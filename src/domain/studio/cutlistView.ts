import {
  groupCutlistByCabinet,
  groupCutlistByMaterial,
  groupCutlistByThickness,
  type ProductionCutlistGroup,
  type ProductionCutlistLine,
} from "../productionCutlist";

export type CutlistGroupMode = "cabinet" | "material" | "thickness";

export function cutlistGroups(lines: readonly ProductionCutlistLine[], mode: CutlistGroupMode): ProductionCutlistGroup[] {
  const rows = [...lines];
  if (mode === "material") return groupCutlistByMaterial(rows);
  if (mode === "thickness") return groupCutlistByThickness(rows);
  return groupCutlistByCabinet(rows);
}
