import { selectOpeningsForRoom, selectWallsForRoom, type InteriorProject } from "../interiorProject";
import type { BuildTool } from "../livingRoom/buildToolCommands";
import type { InteriorsChromeTool } from "./interiorsChrome";
import { INTERIORS_CHROME_TOOLS, mapInteriorsChromeTool } from "./interiorsChrome";

export const INTERIORS_DRAW_ROOM_ARCHITECTURE_TOOLS = [
  { id: "draw-partition" as const, label: "Partition" },
  { id: "draw-surface" as const, label: "Surface" },
  { id: "place-column" as const, label: "Column" },
];

export function isInteriorsDrawRoomTool(tool: InteriorsChromeTool): boolean {
  return INTERIORS_CHROME_TOOLS.find((item) => item.id === tool)?.group === "room";
}

export function interiorsChromeBuildTool(tool: InteriorsChromeTool) {
  return mapInteriorsChromeTool(tool).buildTool;
}

export function interiorsDrawRoomHint(tool: InteriorsChromeTool, buildTool?: BuildTool): string {
  if (buildTool === "draw-partition") return "Drag a partition segment on the plan";
  if (buildTool === "draw-surface") return "Click points, then close the surface polygon";
  if (buildTool === "place-column") return "Click the plan to place a column";
  if (tool === "room") return "Drag a rectangle, or click points and close the polygon";
  if (tool === "wall") return "Drag a wall segment on the plan";
  if (tool === "door") return "Click a wall to place a door";
  if (tool === "window") return "Click a wall to place a window";
  if (tool === "import") return "Choose a plan image to trace";
  return "Click a wall to edit";
}

export function interiorsDrawRoomCounts(input: {
  wallCount: number;
  doorCount: number;
  windowCount: number;
}): string {
  const walls = `${input.wallCount} wall${input.wallCount === 1 ? "" : "s"}`;
  const doors = `${input.doorCount} door${input.doorCount === 1 ? "" : "s"}`;
  const windows = `${input.windowCount} window${input.windowCount === 1 ? "" : "s"}`;
  return `${walls} · ${doors} · ${windows}`;
}

export function interiorsDrawRoomRoomCounts(project: InteriorProject) {
  const walls = selectWallsForRoom(project, project.activeRoomId);
  const openings = selectOpeningsForRoom(project, project.activeRoomId);
  return {
    wallCount: walls.length,
    doorCount: openings.filter((item) => item.kind === "door").length,
    windowCount: openings.filter((item) => item.kind === "window").length,
  };
}

export function interiorsDrawRoomRoomWallIds(project: InteriorProject): string[] {
  return selectWallsForRoom(project, project.activeRoomId).map((wall) => wall.id);
}

export function interiorsDrawRoomPlacementWallId(
  activeWallId: string | null,
  roomWallIds: readonly string[],
): string | null {
  if (activeWallId && roomWallIds.includes(activeWallId)) return activeWallId;
  return roomWallIds[0] ?? null;
}

export function interiorsDrawRoomValidity(blockingCount: number): { label: string; ok: boolean } {
  if (blockingCount > 0) return { label: `${blockingCount} blocking`, ok: false };
  return { label: "Room valid", ok: true };
}

export function interiorsDrawRoomShowArchitecture(
  tool: InteriorsChromeTool,
  buildTool?: BuildTool,
): boolean {
  if (tool === "wall") return true;
  return INTERIORS_DRAW_ROOM_ARCHITECTURE_TOOLS.some((item) => item.id === buildTool);
}

export function interiorsDrawRoomShowUnderlay(tool: InteriorsChromeTool): boolean {
  return tool === "import";
}
