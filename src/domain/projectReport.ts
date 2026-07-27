import type { CabinetProject } from "./cabinetDimensions";
import { cabinetTypeLabels } from "./cabinetDimensions";
import {
  createCabinetConstruction,
  getConstructionFlatParts,
} from "./cabinetConstruction";
import {
  createCabinetCutlist,
  createProjectCutlist,
  type CabinetCutlistItem,
} from "./cabinetGeometry";
import {
  calculateCabinetCost,
  calculateProjectCost,
  type CabinetCost,
  type ProjectCost,
} from "./costing";
import { computeMaterialSummary, type MaterialSummaryRow } from "./manufacturing";
import type { RoomConfig } from "./roomModel";

export type ProjectPartRow = {
  cabinetId: string;
  cabinetName: string;
  part: ReturnType<typeof getConstructionFlatParts>[number];
};

export type GroupedCutlistSection = {
  title: string;
  items: ProjectPartRow[];
};

export type ProjectReport = {
  summary: {
    itemCount: number;
    cabinetCount: number;
    roomSizeLabel: string;
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
    items: CabinetCutlistItem[];
    parts: ProjectPartRow[];
    cost: CabinetCost;
  }>;
  projectCutlist: CabinetCutlistItem[];
  materialSummary: MaterialSummaryRow[];
  groupedByMaterial: GroupedCutlistSection[];
  groupedByThickness: GroupedCutlistSection[];
  projectCost: ProjectCost;
};

function buildPartRows(project: CabinetProject): ProjectPartRow[] {
  return project.cabinets.flatMap((cabinet) => {
    const construction = createCabinetConstruction(cabinet.config);
    return getConstructionFlatParts(construction).map((part) => ({
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      part,
    }));
  });
}

function groupRows(
  rows: ProjectPartRow[],
  getKey: (row: ProjectPartRow) => string,
  getTitle: (key: string) => string,
): GroupedCutlistSection[] {
  const map = new Map<string, ProjectPartRow[]>();

  for (const row of rows) {
    const key = getKey(row);
    const group = map.get(key) ?? [];
    group.push(row);
    map.set(key, group);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, items]) => ({
      title: getTitle(key),
      items: items.sort((left, right) =>
        left.cabinetName.localeCompare(right.cabinetName) ||
        left.part.label.localeCompare(right.part.label),
      ),
    }));
}

export function createProjectReport(
  project: CabinetProject,
  room: RoomConfig,
): ProjectReport {
  const projectCutlist = createProjectCutlist(project);
  const partRows = buildPartRows(project);
  const constructionMap = new Map(
    project.cabinets.map((cabinet) => [cabinet.id, createCabinetConstruction(cabinet.config)] as const),
  );
  const cutlistMap = new Map(
    project.cabinets.map((cabinet) => [cabinet.id, createCabinetCutlist(cabinet.config)] as const),
  );
  const projectCost = calculateProjectCost(project.cabinets, constructionMap, cutlistMap);
  const cabinetCosts = new Map(projectCost.cabinets.map((cost) => [cost.cabinetId, cost] as const));

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
    perItemCutlists: project.cabinets.map((cabinet) => ({
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      items: cutlistMap.get(cabinet.id) ?? [],
      parts: partRows.filter((row) => row.cabinetId === cabinet.id),
      cost: cabinetCosts.get(cabinet.id) ?? calculateCabinetCost(
        cabinet,
        constructionMap.get(cabinet.id)!,
        cutlistMap.get(cabinet.id) ?? [],
      ),
    })),
    projectCutlist,
    materialSummary: computeMaterialSummary(projectCutlist),
    groupedByMaterial: groupRows(
      partRows,
      (row) => row.part.material,
      (key) => key,
    ),
    groupedByThickness: groupRows(
      partRows,
      (row) => `${row.part.thicknessMm}`,
      (key) => `${key} mm`,
    ),
    projectCost,
  };
}
