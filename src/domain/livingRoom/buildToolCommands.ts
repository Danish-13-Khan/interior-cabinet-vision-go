import type { Size3Mm } from "../interiorProject";

export type BuildTool =
  | "select"
  | "upload-underlay"
  | "draw-room"
  | "draw-wall"
  | "draw-surface"
  | "place-door"
  | "place-window"
  | "place-structural";

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
  | { type: "placeOpening"; wallId: string; kind: "door" | "window" }
  | { type: "updateSelection"; wallId?: string | null; openingId?: string | null }
  | { type: "requestUnderlayUpload" };

export type BuildCommandHandlers = {
  resizeRoom: (dimensions: Size3Mm) => void;
  createWall: () => void;
  placeOpening: (wallId: string, kind: "door" | "window") => void;
  requestUnderlayUpload: () => void;
};

const DRAFT_TOOLS: ReadonlySet<BuildTool> = new Set([
  "upload-underlay",
  "draw-room",
  "draw-wall",
  "draw-surface",
  "place-door",
  "place-window",
  "place-structural",
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

/**
 * Apply a Build command: update tool/draft state, then run rectangular adapters.
 * Draft updates never call handlers; only explicit commits/mutations do.
 */
export function applyBuildCommand(
  state: BuildCommandState,
  command: BuildCommand,
  handlers: BuildCommandHandlers,
): BuildCommandState {
  const next = reduceBuildCommand(state, command);
  switch (command.type) {
    case "beginDraft":
      if (command.tool === "upload-underlay") handlers.requestUnderlayUpload();
      return next;
    case "resizeRoom":
      handlers.resizeRoom(command.dimensions);
      return next;
    case "createWall":
      handlers.createWall();
      return reduceBuildCommand(next, { type: "commitDraft" });
    case "placeOpening":
      handlers.placeOpening(command.wallId, command.kind);
      return reduceBuildCommand(next, { type: "commitDraft" });
    case "requestUnderlayUpload":
      handlers.requestUnderlayUpload();
      return next;
    default:
      return next;
  }
}

export function isArmedPlacementTool(tool: BuildTool): boolean {
  return tool === "place-door" || tool === "place-window" || tool === "place-structural";
}
