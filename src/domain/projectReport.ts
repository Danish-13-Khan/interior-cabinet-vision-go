import type { CabinetProject } from "./cabinetDimensions";
import { cabinetTypeLabels } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import {
  calculateCabinetCost,
  calculateProjectCost,
  clampCostingSettings,
  DEFAULT_COSTING_SETTINGS,
  type CabinetCost,
  type ProjectCost,
} from "./costing";
import {
  computeProductionMaterialSummary,
  createCabinetProductionCutlist,
  createProjectProductionCutlist,
  groupCutlistByCabinet,
  groupCutlistByMaterial,
  groupCutlistByThickness,
  type MaterialBoardEstimate,
  type ProductionCutlistGroup,
  type ProductionCutlistLine,
} from "./productionCutlist";
import type { RoomConfig } from "./roomModel";

export type ProjectReport = {
  summary: {
    itemCount: number;
    cabinetCount: number;
    roomSizeLabel: string;
    partLineCount: number;
  };
  itemList: Array<{
    id: string;
    name: string;
    typeLabel: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    x: number;
    z: number;
    rotation: number;
  }>;
  perItemCutlists: Array<{
    cabinetId: string;
    cabinetName: string;
    lines: ProductionCutlistLine[];
    cost: CabinetCost;
  }>;
  productionCutlist: ProductionCutlistLine[];
  materialSummary: MaterialBoardEstimate[];
  groupedByMaterial: ProductionCutlistGroup[];
  groupedByThickness: ProductionCutlistGroup[];
  groupedByCabinet: ProductionCutlistGroup[];
  projectCost: ProjectCost;
};

export function createProjectReport(
  project: CabinetProject,
  room: RoomConfig,
): ProjectReport {
  const settings = clampCostingSettings(
    project.preferences?.costing ?? DEFAULT_COSTING_SETTINGS,
  );
  const productionCutlist = createProjectProductionCutlist(project);
  const constructionMap = new Map(
    project.cabinets.map(
      (cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const,
    ),
  );
  const cutlistMap = new Map(
    project.cabinets.map(
      (cabinet) => [cabinet.id, createCabinetProductionCutlist(cabinet)] as const,
    ),
  );
  const projectCost = calculateProjectCost(
    project.cabinets,
    constructionMap,
    cutlistMap,
    undefined,
    settings,
  );
  const cabinetCosts = new Map(
    projectCost.cabinets.map((cost) => [cost.cabinetId, cost] as const),
  );

  return {
    summary: {
      itemCount: project.cabinets.length,
      cabinetCount: project.cabinets.filter((cabinet) =>
        cabinet.config.type === "base" ||
        cabinet.config.type === "wall" ||
        cabinet.config.type === "tall" ||
        cabinet.config.type === "drawer" ||
        cabinet.config.type === "sink" ||
        cabinet.config.type === "corner" ||
        cabinet.config.type === "open-shelf" ||
        cabinet.config.type === "almirah",
      ).length,
      roomSizeLabel: `${room.dimensions.widthMm} x ${room.dimensions.depthMm} x ${room.dimensions.heightMm} mm`,
      partLineCount: productionCutlist.length,
    },
    itemList: project.cabinets.map((cabinet) => ({
      id: cabinet.id,
      name: cabinet.name,
      typeLabel: cabinetTypeLabels[cabinet.config.type],
      widthMm: cabinet.config.dimensions.width,
      heightMm: cabinet.config.dimensions.height,
      depthMm: cabinet.config.dimensions.depth,
      x: Math.round(cabinet.placement.x),
      z: Math.round(cabinet.placement.z),
      rotation: cabinet.placement.rotation,
    })),
    perItemCutlists: project.cabinets.map((cabinet) => {
      const lines = cutlistMap.get(cabinet.id) ?? [];
      const construction = constructionMap.get(cabinet.id)!;
      return {
        cabinetId: cabinet.id,
        cabinetName: cabinet.name,
        lines,
        cost:
          cabinetCosts.get(cabinet.id) ??
          calculateCabinetCost(cabinet, construction, lines, undefined, settings),
      };
    }),
    productionCutlist,
    materialSummary: computeProductionMaterialSummary(productionCutlist),
    groupedByMaterial: groupCutlistByMaterial(productionCutlist),
    groupedByThickness: groupCutlistByThickness(productionCutlist),
    groupedByCabinet: groupCutlistByCabinet(productionCutlist),
    projectCost,
  };
}
