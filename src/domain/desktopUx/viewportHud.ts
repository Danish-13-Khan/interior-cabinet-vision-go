import type { DraftingWorldPoint } from "../draftingAnnotations";

export type ViewportHudDraftingTool = "select" | "note" | "leader";

export type ViewportHudState = {
  pointer: DraftingWorldPoint | null;
  snapSizeMm: number;
  showGrid: boolean;
  draftingTool: ViewportHudDraftingTool;
  workspaceTab: "plan" | "front" | "side" | "3d";
  sheetLabel?: string;
  snapGuideCount?: number;
};

export function formatHudCoordinate(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}`;
}

export function formatPointerHud(pointer: DraftingWorldPoint | null): string {
  if (!pointer) return "X —  Y —  Z —";
  return `X ${formatHudCoordinate(pointer.x)}  Y ${formatHudCoordinate(pointer.y)}  Z ${formatHudCoordinate(pointer.z)}`;
}

export function draftingToolLabel(tool: ViewportHudDraftingTool): string {
  if (tool === "note") return "Note";
  if (tool === "leader") return "Leader";
  return "Select";
}

export function workspaceTabLabel(
  tab: ViewportHudState["workspaceTab"],
): string {
  if (tab === "plan") return "Plan";
  if (tab === "front") return "Front";
  if (tab === "side") return "Side";
  return "3D";
}
