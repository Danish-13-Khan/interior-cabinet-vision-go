/** Unnumbered free design areas for the Interiors shared shell (Step 3–4). */

import type { InteriorsChromeTool } from "./interiorsChrome";
import { INTERIORS_CHROME_TOOLS } from "./interiorsChrome";

export const INTERIORS_WORKFLOW_AREAS = [
  { id: "room", label: "Room" },
  { id: "cabinets", label: "Cabinets" },
  { id: "materials", label: "Materials" },
  { id: "review", label: "Review" },
  { id: "present", label: "Present" },
] as const;

export type InteriorsWorkflowArea = (typeof INTERIORS_WORKFLOW_AREAS)[number]["id"];

export type InteriorsWorkflowChrome = {
  plannerMode: "build" | "design" | "render";
  studioPanel: "build" | "cabinets" | "furniture" | "materials" | "layers";
  chromeTool: "select" | "cabinet" | "material";
  /** plan/model force a view; preserve keeps the current canvas. */
  workspaceView: "plan" | "model" | "preserve";
};

const AREA_TARGETS: Record<InteriorsWorkflowArea, InteriorsWorkflowChrome> = {
  room: {
    plannerMode: "build",
    studioPanel: "build",
    chromeTool: "select",
    workspaceView: "plan",
  },
  cabinets: {
    plannerMode: "design",
    studioPanel: "cabinets",
    chromeTool: "cabinet",
    workspaceView: "preserve",
  },
  materials: {
    plannerMode: "design",
    studioPanel: "materials",
    chromeTool: "material",
    workspaceView: "preserve",
  },
  review: {
    plannerMode: "design",
    studioPanel: "cabinets",
    chromeTool: "select",
    workspaceView: "preserve",
  },
  present: {
    plannerMode: "render",
    studioPanel: "cabinets",
    chromeTool: "select",
    workspaceView: "model",
  },
};

export function applyInteriorsWorkflowArea(area: InteriorsWorkflowArea): InteriorsWorkflowChrome {
  return AREA_TARGETS[area];
}

export function interiorsWorkflowAreaFromChrome(input: {
  plannerMode: "project" | "build" | "design" | "render";
  studioPanel: InteriorsWorkflowChrome["studioPanel"];
  workflowArea?: InteriorsWorkflowArea;
}): InteriorsWorkflowArea {
  if (input.plannerMode === "render") return "present";
  if (input.workflowArea === "review" && input.plannerMode === "design") return "review";
  if (input.plannerMode === "build" || input.studioPanel === "build") return "room";
  if (input.studioPanel === "materials") return "materials";
  return "cabinets";
}

export function interiorsWorkflowAreaLabel(area: InteriorsWorkflowArea): string {
  return INTERIORS_WORKFLOW_AREAS.find((entry) => entry.id === area)?.label ?? area;
}

const AREA_TOOLS: Record<InteriorsWorkflowArea, readonly InteriorsChromeTool[]> = {
  room: ["select", "room", "wall", "door", "window", "import"],
  cabinets: ["select", "cabinet", "run", "shelf", "objects"],
  materials: ["select", "material"],
  review: ["select"],
  present: ["select"],
};

export function interiorsWorkflowToolsForArea(area: InteriorsWorkflowArea): InteriorsChromeTool[] {
  return [...AREA_TOOLS[area]];
}

export function interiorsWorkflowAreaForChromeTool(tool: InteriorsChromeTool): InteriorsWorkflowArea {
  const group = INTERIORS_CHROME_TOOLS.find((entry) => entry.id === tool)?.group;
  if (group === "room") return "room";
  if (tool === "material") return "materials";
  if (group === "design" || group === "objects") return "cabinets";
  return "room";
}

export function interiorsWorkflowShowsToolRail(area: InteriorsWorkflowArea): boolean {
  return area !== "present";
}

export type InteriorsWorkflowCatalogView =
  | "room-build"
  | "cabinet-library"
  | "cabinet-run"
  | "object-browser"
  | "materials"
  | "review";

export function interiorsWorkflowCatalogView(input: {
  area: InteriorsWorkflowArea;
  chromeTool: InteriorsChromeTool;
}): InteriorsWorkflowCatalogView | null {
  if (input.area === "present") return null;
  if (input.area === "review") return "review";
  if (input.area === "materials") return "materials";
  if (input.area === "room") return "room-build";
  if (input.chromeTool === "objects") return "object-browser";
  if (input.chromeTool === "material") return "materials";
  return input.chromeTool === "cabinet" || input.chromeTool === "run" || input.chromeTool === "shelf"
    ? "cabinet-run"
    : "cabinet-library";
}
