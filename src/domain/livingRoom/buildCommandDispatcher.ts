import {
  reduceBuildCommand,
  type BuildCommand,
  type BuildCommandHandlers,
  type BuildCommandState,
} from "./buildToolCommands";

function committed(state: BuildCommandState) {
  return reduceBuildCommand(state, { type: "commitDraft" });
}

/** Route committed Build mutations through the Phase A command boundary. */
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
    case "resizeRoom": handlers.resizeRoom(command.dimensions); return next;
    case "createWall": handlers.createWall(); return committed(next);
    case "createWallSegment":
      if (command.wallKind) handlers.createWallSegment(command.start, command.end, command.wallKind);
      else handlers.createWallSegment(command.start, command.end);
      return next;
    case "createRoom": handlers.createRoom(command.drawing); return committed(next);
    case "createSurface":
      handlers.createSurface(command.drawing, command.materialId); return committed(next);
    case "updateSurface":
      handlers.updateSurface(command.surfaceId, command.materialId); return committed(next);
    case "deleteSurface": handlers.deleteSurface(command.surfaceId); return committed(next);
    case "placeColumn": handlers.placeColumn(command.position); return committed(next);
    case "splitWall": handlers.splitWall(command.wallId, command.offsetMm); return committed(next);
    case "deleteWall": handlers.deleteWall(command.wallId); return committed(next);
    case "updateWall": handlers.updateWall(command.wallId, command.patch); return committed(next);
    case "joinCoincidentNodes": handlers.joinCoincidentNodes(); return committed(next);
    case "moveNode": handlers.moveNode(command.nodeId, command.position); return committed(next);
    case "moveWall": handlers.moveWall(command.wallId, command.delta); return committed(next);
    case "placeOpening":
      handlers.placeOpening(command.wallId, command.kind, command.offsetMm, command.catalogItemId);
      return committed(next);
    case "moveOpening":
      handlers.updateOpening(command.openingId, { offsetMm: command.offsetMm }); return committed(next);
    case "resizeOpening":
      handlers.updateOpening(command.openingId, { widthMm: command.widthMm,
        ...(command.offsetMm !== undefined ? { offsetMm: command.offsetMm } : {}) });
      return committed(next);
    case "updateOpening": handlers.updateOpening(command.openingId, command.patch); return committed(next);
    case "deleteOpening": handlers.deleteOpening(command.openingId); return committed(next);
    case "requestUnderlayUpload": handlers.requestUnderlayUpload(); return next;
    default: return next;
  }
}
