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
  { id: "run", label: "Run", group: "design" },
  { id: "shelf", label: "Open shelf", group: "design" },
  { id: "material", label: "Material", group: "design" },
  { id: "objects", label: "Objects", group: "objects" },
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
  objects: { plannerMode: "design", studioPanel: "furniture", buildTool: "select" },
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

export function savedAgeLabel(savedAt: string | null, now = Date.now()): string {
  if (!savedAt) return "just now";
  const elapsed = now - Date.parse(savedAt);
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "just now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

export function interiorsSaveLabel(
  isDirty: boolean,
  autosaveState: "idle" | "saving" | "saved" | "error",
  savedAt: string | null = null,
  now = Date.now(),
): string {
  if (autosaveState === "saving") return "Saving…";
  if (autosaveState === "error") return "Save failed";
  if (autosaveState === "saved" || !isDirty) return `Saved · ${savedAgeLabel(savedAt, now)}`;
  return "Unsaved changes";
}

/** Cut uses kind "opening"; other kinds stay "<kind> opening". */
export function openingInspectorTitle(kind: string): string {
  if (kind === "opening") return "Wall opening";
  return `${kind} opening`;
}

export function interiorsSelectionTitle(input: {
  openingName?: string | null;
  lightName?: string | null;
  objectName?: string | null;
  wallLabel?: string | null;
  surfaceName?: string | null;
  roomName?: string | null;
  selectedCount: number;
}): string {
  if (input.openingName) return input.openingName;
  if (input.lightName) return input.lightName;
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
  lightSelected?: boolean;
}): boolean {
  return Boolean(
    input.objectSelected || input.openingSelected || input.wallSelected
    || input.surfaceSelected || input.roomSelected || input.lightSelected,
  );
}
