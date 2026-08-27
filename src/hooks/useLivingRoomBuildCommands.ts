import { useEffect, useRef, useState } from "react";
import type { InteriorProject, Point2Mm } from "../domain/interiorProject";
import {
  applyBuildCommand,
  createBuildCommandState,
  getOpeningCatalogItem,
  type BuildCommand,
  type BuildCommandHandlers,
  type BuildCommandState,
  type BuildTool,
} from "../domain/livingRoom";
import type { LivingRoomPlanWorkspaceProps } from "../components/livingRoomPlan/workspaceProps";

type BuildBridgeInput = Pick<
  LivingRoomPlanWorkspaceProps,
  | "onRoomDimensions"
  | "onAddPartitionWall"
  | "onCreateRoom"
  | "onDrawWallSegment"
  | "onDrawSurface"
  | "onUpdateSurface"
  | "onDeleteSurface"
  | "onPlaceColumn"
  | "onSplitWall"
  | "onDeleteWall"
  | "onUpdateWall"
  | "onJoinCoincidentNodes"
  | "onAddOpening"
  | "onUpdateOpening"
  | "onDeleteOpening"
> & {
  project: InteriorProject | null;
  underlayPickerRef: React.RefObject<(() => void) | null>;
  setActiveWallId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveOpeningId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveSurfaceId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useLivingRoomBuildCommands(input: BuildBridgeInput) {
  const [buildCommandState, setBuildCommandState] = useState(createBuildCommandState);
  const buildCommandStateRef = useRef(buildCommandState);
  const [pendingOpeningWallId, setPendingOpeningWallId] = useState<string | null>(null);
  const [pendingPartition, setPendingPartition] = useState(false);
  const [pendingWallDraw, setPendingWallDraw] = useState(false);
  const [pendingSurfaceDraw, setPendingSurfaceDraw] = useState(false);
  const [openingCatalogItemId, setOpeningCatalogItemId] = useState("opening:door-single");
  const [surfaceMaterialId, setSurfaceMaterialId] = useState(input.project?.materials[0]?.id ?? "");
  buildCommandStateRef.current = buildCommandState;

  const buildHandlersRef = useRef<BuildCommandHandlers>({
    resizeRoom: input.onRoomDimensions,
    createWall: () => { setPendingPartition(true); input.onAddPartitionWall(); },
    createWallSegment: (start: Point2Mm, end: Point2Mm, kind) => { setPendingWallDraw(true); input.onDrawWallSegment(start, end, kind); },
    createRoom: input.onCreateRoom,
    createSurface: (drawing, materialId) => { setPendingSurfaceDraw(true); input.onDrawSurface(drawing, materialId); },
    updateSurface: input.onUpdateSurface,
    deleteSurface: input.onDeleteSurface,
    placeColumn: input.onPlaceColumn,
    splitWall: (wallId, offsetMm) => {
      const firstWallId = input.onSplitWall(wallId, offsetMm);
      if (firstWallId) input.setActiveWallId(firstWallId);
    },
    deleteWall: input.onDeleteWall,
    updateWall: input.onUpdateWall,
    joinCoincidentNodes: input.onJoinCoincidentNodes,
    placeOpening: (wallId, kind, offsetMm, catalogItemId) => {
      setPendingOpeningWallId(wallId);
      input.onAddOpening(wallId, kind, offsetMm, catalogItemId);
      input.setActiveWallId(wallId);
    },
    requestUnderlayUpload: () => input.underlayPickerRef.current?.(),
    updateOpening: input.onUpdateOpening,
    deleteOpening: input.onDeleteOpening,
  });
  buildHandlersRef.current = {
    resizeRoom: input.onRoomDimensions,
    createWall: () => { setPendingPartition(true); input.onAddPartitionWall(); },
    createWallSegment: (start, end, kind) => { setPendingWallDraw(true); input.onDrawWallSegment(start, end, kind); },
    createRoom: input.onCreateRoom,
    createSurface: (drawing, materialId) => { setPendingSurfaceDraw(true); input.onDrawSurface(drawing, materialId); },
    updateSurface: input.onUpdateSurface,
    deleteSurface: input.onDeleteSurface,
    placeColumn: input.onPlaceColumn,
    splitWall: (wallId, offsetMm) => {
      const firstWallId = input.onSplitWall(wallId, offsetMm);
      if (firstWallId) input.setActiveWallId(firstWallId);
    },
    deleteWall: input.onDeleteWall,
    updateWall: input.onUpdateWall,
    joinCoincidentNodes: input.onJoinCoincidentNodes,
    placeOpening: (wallId, kind, offsetMm, catalogItemId) => {
      setPendingOpeningWallId(wallId);
      input.onAddOpening(wallId, kind, offsetMm, catalogItemId);
      input.setActiveWallId(wallId);
    },
    requestUnderlayUpload: () => input.underlayPickerRef.current?.(),
    updateOpening: input.onUpdateOpening,
    deleteOpening: input.onDeleteOpening,
  };

  function dispatchBuildCommand(command: BuildCommand): BuildCommandState {
    const next = applyBuildCommand(buildCommandStateRef.current, command, buildHandlersRef.current);
    buildCommandStateRef.current = next;
    setBuildCommandState(next);
    return next;
  }

  function selectBuildTool(tool: BuildTool) {
    if (tool === "place-door" && getOpeningCatalogItem(openingCatalogItemId).kind !== "door") setOpeningCatalogItemId("opening:door-single");
    if (tool === "place-window" && getOpeningCatalogItem(openingCatalogItemId).kind !== "window") setOpeningCatalogItemId("opening:window-fixed");
    dispatchBuildCommand({ type: "beginDraft", tool });
  }

  useEffect(() => {
    if (!input.project || input.project.materials.some((material) => material.id === surfaceMaterialId)) return;
    setSurfaceMaterialId(input.project.materials[0]?.id ?? "");
  }, [input.project, surfaceMaterialId]);

  useEffect(() => {
    const cancelTool = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setBuildCommandState((current) => applyBuildCommand(current, { type: "cancelDraft" }, buildHandlersRef.current));
    };
    window.addEventListener("keydown", cancelTool);
    return () => window.removeEventListener("keydown", cancelTool);
  }, []);

  useEffect(() => {
    if (!input.project || !pendingOpeningWallId) return;
    const opening = [...input.project.openings].reverse().find((item) => item.wallId === pendingOpeningWallId);
    if (!opening) return;
    input.setActiveWallId(opening.wallId);
    input.setActiveOpeningId(opening.id);
    setPendingOpeningWallId(null);
  }, [pendingOpeningWallId, input.project]);

  useEffect(() => {
    if (!input.project || !pendingPartition) return;
    const wall = [...input.project.walls].reverse().find((item) => item.extensions?.isPartition === true);
    if (!wall) return;
    input.setActiveWallId(wall.id);
    setPendingPartition(false);
  }, [pendingPartition, input.project]);

  useEffect(() => {
    if (!input.project || !pendingWallDraw) return;
    const wall = [...input.project.walls].reverse().find((item) =>
      item.extensions?.createdBy === "draw-wall" || item.extensions?.createdBy === "draw-partition");
    if (!wall) return;
    input.setActiveWallId(wall.id);
    setPendingWallDraw(false);
  }, [pendingWallDraw, input.project]);

  useEffect(() => {
    if (!input.project || !pendingSurfaceDraw) return;
    const surface = [...input.project.surfaces].reverse().find((item) => item.extensions?.createdBy === "draw-surface");
    if (!surface) return;
    input.setActiveSurfaceId(surface.id);
    setPendingSurfaceDraw(false);
  }, [pendingSurfaceDraw, input.project]);

  return {
    buildCommandState,
    dispatchBuildCommand,
    selectBuildTool,
    openingCatalogItemId,
    setOpeningCatalogItemId,
    surfaceMaterialId,
    setSurfaceMaterialId,
  };
}
