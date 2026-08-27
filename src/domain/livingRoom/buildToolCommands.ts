import type { OpeningEntity, Point2Mm, RoomDrawingRequest, Size3Mm } from "../interiorProject";

export type OpeningCommandPatch = Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "swingDirection" | "materialSlots" | "parameters">>;
export type WallCommandPatch = { thicknessMm?: number };

export type BuildTool =
  | "select"
  | "upload-underlay"
  | "draw-room"
  | "draw-wall"
  | "draw-partition"
  | "draw-surface"
  | "place-door"
  | "place-window"
  | "place-column";

export type BuildDraft = {
  tool: BuildTool;
  startedAt: number;
} | null;

export type BuildCommandState = {
  activeTool: BuildTool;
  draft: BuildDraft;
};

export type BuildCommand =
  | { type: "beginDraft"; tool: BuildTool }
  | { type: "cancelDraft" }
  | { type: "commitDraft" }
  | { type: "resizeRoom"; dimensions: Size3Mm }
  | { type: "createWall" }
  | { type: "createWallSegment"; start: Point2Mm; end: Point2Mm; wallKind?: "wall" | "partition" }
  | { type: "createRoom"; drawing: RoomDrawingRequest }
  | { type: "createSurface"; drawing: RoomDrawingRequest; materialId: string }
  | { type: "updateSurface"; surfaceId: string; materialId: string }
  | { type: "deleteSurface"; surfaceId: string }
  | { type: "placeColumn"; position: Point2Mm }
  | { type: "splitWall"; wallId: string; offsetMm?: number }
  | { type: "deleteWall"; wallId: string }
  | { type: "updateWall"; wallId: string; patch: WallCommandPatch }
  | { type: "joinCoincidentNodes" }
  | { type: "moveNode"; nodeId: string; position: Point2Mm }
  | { type: "moveWall"; wallId: string; delta: Point2Mm }
  | { type: "placeOpening"; wallId: string; kind: "door" | "window"; offsetMm?: number; catalogItemId?: string }
  | { type: "moveOpening"; openingId: string; offsetMm: number }
  | { type: "resizeOpening"; openingId: string; widthMm: number; offsetMm?: number }
  | { type: "updateOpening"; openingId: string; patch: OpeningCommandPatch }
  | { type: "deleteOpening"; openingId: string }
  | { type: "updateSelection"; wallId?: string | null; openingId?: string | null }
  | { type: "requestUnderlayUpload" };

export type BuildCommandHandlers = {
  resizeRoom: (dimensions: Size3Mm) => void;
  createWall: () => void;
  createWallSegment: (start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") => void;
  createRoom: (drawing: RoomDrawingRequest) => void;
  createSurface: (drawing: RoomDrawingRequest, materialId: string) => void;
  updateSurface: (surfaceId: string, materialId: string) => void;
  deleteSurface: (surfaceId: string) => void;
  placeColumn: (position: Point2Mm) => void;
  splitWall: (wallId: string, offsetMm?: number) => void;
  deleteWall: (wallId: string) => void;
  updateWall: (wallId: string, patch: WallCommandPatch) => void;
  joinCoincidentNodes: () => void;
  moveNode: (nodeId: string, position: Point2Mm) => void;
  moveWall: (wallId: string, delta: Point2Mm) => void;
  placeOpening: (wallId: string, kind: "door" | "window", offsetMm?: number, catalogItemId?: string) => void;
  updateOpening: (openingId: string, patch: OpeningCommandPatch) => void;
  deleteOpening: (openingId: string) => void;
  requestUnderlayUpload: () => void;
};

const DRAFT_TOOLS: ReadonlySet<BuildTool> = new Set([
  "upload-underlay",
  "draw-room",
  "draw-wall",
  "draw-partition",
  "draw-surface",
  "place-door",
  "place-window",
  "place-column",
]);

export function createBuildCommandState(tool: BuildTool = "select"): BuildCommandState {
  return { activeTool: tool, draft: null };
}

/** Pure reducer for Build tool + draft state. Mutations are applied via applyBuildCommand. */
export function reduceBuildCommand(
  state: BuildCommandState,
  command: BuildCommand,
): BuildCommandState {
  switch (command.type) {
    case "beginDraft":
      if (command.tool === "select") {
        return { activeTool: "select", draft: null };
      }
      return {
        activeTool: command.tool,
        draft: DRAFT_TOOLS.has(command.tool)
          ? { tool: command.tool, startedAt: Date.now() }
          : null,
      };
    case "cancelDraft":
      return { activeTool: "select", draft: null };
    case "commitDraft":
      return { ...state, draft: null };
    case "updateSelection":
      return state;
    default:
      return state;
  }
}

export function isArmedPlacementTool(tool: BuildTool): boolean {
  return tool === "place-door" || tool === "place-window" || tool === "place-column";
}

export { applyBuildCommand } from "./buildCommandDispatcher";
