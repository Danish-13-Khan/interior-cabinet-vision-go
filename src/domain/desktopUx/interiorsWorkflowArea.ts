/** Unnumbered free design areas for the Interiors shared shell (Step 3). */

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
