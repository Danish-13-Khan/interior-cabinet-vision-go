import type { BuildTool } from "../livingRoom/buildToolCommands";
import type { JobStatus } from "../jobMeta";

export const INTERIORS_CHROME_TOOLS = [
  { id: "select", label: "Select", group: "room" },
  { id: "room", label: "Room", group: "room" },
  { id: "wall", label: "Wall", group: "room" },
  { id: "door", label: "Door", group: "room" },
  { id: "window", label: "Window", group: "room" },
  { id: "import", label: "Import plan", group: "room" },
  { id: "cabinet", label: "Cabinet", group: "design" },
  { id: "run", label: "Run", group: "design", ready: false },
  { id: "shelf", label: "Open shelf", group: "design", ready: false },
  { id: "material", label: "Material", group: "design" },
] as const;

export type InteriorsChromeTool = (typeof INTERIORS_CHROME_TOOLS)[number]["id"];
export type InteriorsChromePlannerMode = "build" | "design" | "render";
export type InteriorsChromeStudioPanel =
  | "build"
  | "cabinets"
  | "furniture"
  | "materials"
  | "layers";

export type InteriorsChromeTarget = {
  plannerMode?: InteriorsChromePlannerMode;
  studioPanel?: InteriorsChromeStudioPanel;
  buildTool: BuildTool;
};

const CHROME_TARGETS: Record<InteriorsChromeTool, InteriorsChromeTarget> = {
  select: { buildTool: "select" },
  room: { plannerMode: "build", studioPanel: "build", buildTool: "draw-room" },
  wall: { plannerMode: "build", studioPanel: "build", buildTool: "draw-wall" },
  door: { plannerMode: "build", studioPanel: "build", buildTool: "place-door" },
  window: { plannerMode: "build", studioPanel: "build", buildTool: "place-window" },
  import: { plannerMode: "build", studioPanel: "build", buildTool: "upload-underlay" },
  cabinet: { plannerMode: "design", studioPanel: "cabinets", buildTool: "select" },
  run: { plannerMode: "design", studioPanel: "cabinets", buildTool: "select" },
  shelf: { plannerMode: "design", studioPanel: "cabinets", buildTool: "select" },
  material: { plannerMode: "design", studioPanel: "materials", buildTool: "select" },
};

export function mapInteriorsChromeTool(tool: InteriorsChromeTool): InteriorsChromeTarget {
  return CHROME_TARGETS[tool];
}

export function isInteriorsChromeToolReady(tool: InteriorsChromeTool): boolean {
  const item = INTERIORS_CHROME_TOOLS.find((entry) => entry.id === tool);
  return Boolean(item && !("ready" in item && item.ready === false));
}

export function interiorsJobStatusLabel(
  status: JobStatus,
  hasCabinets: boolean,
): string {
  if (status === "quoted") return "Quote Frozen";
  if (status === "approved") return "Approved";
  if (status === "production") return "Sent";
  return hasCabinets ? "Design" : "Room";
}

export function interiorsSaveLabel(
  isDirty: boolean,
  autosaveState: "idle" | "saving" | "saved" | "error",
): string {
  if (autosaveState === "saving") return "Saving";
  if (autosaveState === "error") return "Save failed";
  return isDirty ? "Unsaved" : "Saved";
}

export function interiorsSelectionTitle(input: {
  openingName?: string | null;
  objectName?: string | null;
  wallLabel?: string | null;
  surfaceName?: string | null;
  roomName?: string | null;
  selectedCount: number;
}): string {
  if (input.openingName) return input.openingName;
  if (input.objectName) return input.objectName;
  if (input.wallLabel) return input.wallLabel;
  if (input.surfaceName) return input.surfaceName;
  if (input.roomName) return input.roomName;
  if (input.selectedCount > 1) return `${input.selectedCount} selected`;
  return "Nothing selected";
}

export function hasInteriorsInspectorSelection(input: {
  objectSelected?: boolean;
  openingSelected?: boolean;
  wallSelected?: boolean;
  surfaceSelected?: boolean;
  roomSelected?: boolean;
}): boolean {
  return Boolean(
    input.objectSelected || input.openingSelected || input.wallSelected
    || input.surfaceSelected || input.roomSelected,
  );
}
