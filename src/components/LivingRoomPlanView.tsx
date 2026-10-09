import { planCanvasFitBounds, planSiteBoundsForCanvas, planUnderlayFitKey } from "../domain/livingRoom/planUnderlayBounds";
import { useEffect, useMemo, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm, Point3Mm, RoomDrawingRequest, Size3Mm } from "../domain/interiorProject";
import { orientWallForRoom, roomPlanViewBounds } from "../domain/interiorProject";
import {
  PLAN_MARQUEE_CLICK_SCREEN_PX,
  PLAN_POINTER_SNAP_SCREEN_PX,
  PLAN_WALL_MOVE_SCREEN_PX,
  boundsFromPoints,
  collectReferenceDimensions,
  expandBounds,
  getLivingRoomPlanUnderlay,
  getObjectPlanBounds,
  getOpeningCatalogItem,
  openingCentreAtPoint,
  snapOpeningOffset,
  type BuildTool,
  type LivingRoomPlanIssue,
  type LivingRoomPlanUnderlay,
  cabinetRunForObject,
  previewCabinetRunPlacement,
  type PlanReadabilitySettings,
  type WallLengthAnchor,
} from "../domain/livingRoom";
import { shouldShowAutoCenterLine } from "../domain/livingRoom/planGuides";
import { CalibrateUnderlayDialog } from "./livingRoomPlan/CalibrateUnderlayDialog";
import { useDwgPlanSnap } from "./livingRoomPlan/useDwgPlanSnap";
import { usePlanCanvasNavigation } from "../hooks/usePlanCanvasNavigation";
import { PlanArchitectureLayer } from "./livingRoomPlan/PlanArchitectureLayer";
import { PlanCeilingLayer, cutoutHostedLightIds } from "./livingRoomPlan/PlanCeilingLayer";
import { PlanDimensionsLayer } from "./livingRoomPlan/PlanDimensionsLayer";
import { PlanGuidesLayer } from "./livingRoomPlan/PlanGuidesLayer";
import { PlanMeasureOverlay } from "./livingRoomPlan/PlanMeasureOverlay";
import { PlanLightsLayer } from "./livingRoomPlan/PlanLightsLayer";
import { PlanObjectsLayer } from "./livingRoomPlan/PlanObjectsLayer";
import { PlanOpeningsLayer, usePlanOpeningInteraction } from "./livingRoomPlan/PlanOpeningsLayer";
import { PlanSurfaceZonesLayer } from "./livingRoomPlan/PlanSurfaceZonesLayer";
import { PlanWallNodesLayer } from "./livingRoomPlan/PlanWallNodesLayer";
import { DraftFeedbackOverlay } from "./livingRoomPlan/DraftFeedbackOverlay";
import { RoomDrawingOverlay } from "./livingRoomPlan/RoomDrawingOverlay";
import { WallDrawingOverlay } from "./livingRoomPlan/WallDrawingOverlay";
import { usePlanGuideInteraction } from "./livingRoomPlan/usePlanGuideInteraction";
import { usePlanMarquee } from "./livingRoomPlan/usePlanMarquee";
import { usePlanMeasureTool } from "./livingRoomPlan/usePlanMeasureTool";
import { usePlanObjectInteraction } from "./livingRoomPlan/usePlanObjectInteraction";
import { usePlanUnderlayDrag } from "./livingRoomPlan/usePlanUnderlayDrag";
import { usePlanWallInteraction } from "./livingRoomPlan/usePlanWallInteraction";
import { useRoomDrawing } from "./livingRoomPlan/useRoomDrawing";
import { useWallDrawing } from "./livingRoomPlan/useWallDrawing";

type Props = {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  snapSizeMm: number; showGrid: boolean; activeWallId: string | null; activeOpeningId: string | null;
  /** Toolbar Snap toggle; off means every tool reads the raw pointer. */
  snapEnabled?: boolean;
  activeSurfaceId: string | null; activeLightId?: string | null; surfaceMaterialId: string;
  onSelectLight?: (lightId: string) => void;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectMany?: (objectIds: string[]) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onMovePreview?: (objectId: string, position: Point3Mm, thresholdMm?: number) => import("./livingRoomPlan/usePlanObjectInteraction").SnappedMovePose | null | void;
  onDragEnd?: (info: { committed: boolean; mode: "move" | "resize" }) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  onSelectWall: (wallId: string) => void; onSelectOpening: (openingId: string) => void;
  onSelectSurface: (surfaceId: string | null) => void;
  onSelectRoom?: () => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  onMoveNode: (nodeId: string, position: Point2Mm) => void;
  onTranslateWall: (wallId: string, delta: Point2Mm) => void;
  activeBuildTool?: BuildTool; openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
  onCreateRoom: (drawing: RoomDrawingRequest) => void;
  onDrawSurface: (drawing: RoomDrawingRequest, materialId: string) => void;
  onDrawCeilingCutout: (drawing: RoomDrawingRequest) => void;
  onDrawWallSegment: (start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") => void;
  onPlaceColumn: (position: Point2Mm) => void;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
  readability: PlanReadabilitySettings;
  onSetWallLength?: (wallId: string, lengthMm: number, anchor: WallLengthAnchor) => void;
  onRegisterViewControls?: (controls: { fitPlan: () => void; fitSelection: () => void; zoomIn: () => void; zoomOut: () => void } | null) => void;
  onSetPlanUnderlay?: (underlay: LivingRoomPlanUnderlay | null) => void;
  onPatchDocument?: (update: (current: InteriorProject) => InteriorProject, status: string) => void;
  onCalibrateComplete?: () => void;
  onSetCabinetInlineDims?: (objectId: string, dims: { widthMm?: number; depthMm?: number }) => void;
  preDropReason?: string | null;
};

export function LivingRoomPlanView(props: Props) {
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId) ?? null;
  const underlay = getLivingRoomPlanUnderlay(props.project);
  const roomBounds = room ? roomPlanViewBounds(props.project, room.id) : null;
  const bounds = planSiteBoundsForCanvas(roomBounds, underlay);
  const fitBounds = useMemo(
    () => planCanvasFitBounds(roomBounds, underlay),
    [roomBounds, underlay],
  );
  const fitKey = `${props.project.id}:${props.project.activeRoomId}:${planUnderlayFitKey(underlay)}`;
  const nav = usePlanCanvasNavigation({ fitBounds, fitKey });
  const pointerSnapMm = nav.screenToWorldMm(PLAN_POINTER_SNAP_SCREEN_PX);
  const marqueeClickMm = nav.screenToWorldMm(PLAN_MARQUEE_CLICK_SCREEN_PX);
  const wallMoveMm = nav.screenToWorldMm(PLAN_WALL_MOVE_SCREEN_PX);

  const tool = props.activeBuildTool ?? "select";
  const selectedRunId = useMemo(() => {
    for (const id of props.selectedIds) {
      const object = props.project.objects.find((item) => item.id === id);
      if (!object) continue;
      const run = cabinetRunForObject(object);
      if (run) return run.runId;
    }
    return null;
  }, [props.project.objects, props.selectedIds]);
  const previewWallId = props.activeWallId
    ?? (selectedRunId
      ? props.project.objects.map(cabinetRunForObject).find((meta) => meta?.runId === selectedRunId)?.wallId ?? null
      : null);
  const placementPreview = previewWallId
    ? previewCabinetRunPlacement(props.project, previewWallId, { runId: selectedRunId, roomId: props.project.activeRoomId })
    : null;
  const freeSegmentWallPose = useMemo(() => {
    if (!previewWallId || !room) return null;
    const stored = props.project.walls.find((wall) => wall.id === previewWallId);
    if (!stored) return null;
    const wall = orientWallForRoom(props.project, room.id, stored);
    const lengthMm = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    return { x1: wall.start.x, z1: wall.start.z, x2: wall.end.x, z2: wall.end.z, lengthMm };
  }, [previewWallId, props.project, room]);

  const drawRoom = tool === "draw-room";
  const drawSurface = tool === "draw-surface"; const drawCutout = tool === "draw-ceiling-cutout";
  const ceilingVisible = props.readability.showCeiling === true || drawCutout;
  const drawWall = tool === "draw-wall";
  const drawPartition = tool === "draw-partition";
  const placeColumn = tool === "place-column";
  const movingUnderlay = tool === "move-underlay";
  const editWalls = tool === "select";

  useEffect(() => {
    function fitSelection() {
      if (props.selectedIds.length === 0) {
        nav.fitPlan();
        return;
      }
      const points = props.project.objects
        .filter((object) => props.selectedIds.includes(object.id))
        .flatMap((object) => {
          const b = getObjectPlanBounds(object);
          return [
            { x: b.minX, z: b.minZ },
            { x: b.maxX, z: b.maxZ },
          ];
        });
      const selectionBounds = boundsFromPoints(points);
      nav.fitSelectionBounds(selectionBounds ? expandBounds(selectionBounds, 200) : null);
    }
    props.onRegisterViewControls?.({ fitPlan: nav.fitPlan, fitSelection, zoomIn: nav.zoomIn, zoomOut: nav.zoomOut });
    return () => props.onRegisterViewControls?.(null);
  }, [nav.fitPlan, nav.fitSelectionBounds, nav.zoomIn, nav.zoomOut, props, props.project.objects, props.selectedIds]);

  function worldPoint(event: ReactPointerEvent<SVGSVGElement>) {
    return nav.worldFromClient(event.clientX, event.clientY);
  }

  const dwgSnap = useDwgPlanSnap(underlay);
  const planGuides = usePlanGuideInteraction({
    project: props.project, tool, snapSizeMm: props.snapSizeMm, worldPoint,
    onPatchDocument: props.onPatchDocument, onClearSelection: () => props.onSelect(null),
    otherSelectionKey: [...props.selectedIds, props.activeWallId, props.activeOpeningId, props.activeSurfaceId, props.activeLightId]
      .filter(Boolean).join("|"),
  });
  /** One snap engine input for every plan tool (roadmap S1). */
  const snapInput = {
    project: props.project, dwgEndpoints: dwgSnap.endpoints, guides: planGuides.stored,
    gridMm: props.snapSizeMm, thresholdMm: pointerSnapMm, snapEnabled: props.snapEnabled,
  };

  const openings = usePlanOpeningInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, thresholdMm: props.snapEnabled === false ? 0 : pointerSnapMm, worldPoint,
    onSelectOpening: props.onSelectOpening, onMoveOpening: props.onMoveOpening,
    onResizeOpening: props.onResizeOpening,
  });
  const objects = usePlanObjectInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, snapThresholdMm: pointerSnapMm, snapEnabled: props.snapEnabled, worldPoint,
    onSelect: props.onSelect, onMove: props.onMove, onMovePreview: props.onMovePreview, onResize: props.onResize,
    onDragEnd: props.onDragEnd,
  });
  const walls = usePlanWallInteraction({
    ...snapInput, active: editWalls, moveThresholdMm: wallMoveMm, worldPoint,
    onSelectWall: props.onSelectWall, onMoveNode: props.onMoveNode, onTranslateWall: props.onTranslateWall,
  });
  const marquee = usePlanMarquee({
    project: props.project, room, selectedIds: props.selectedIds, clickThresholdMm: marqueeClickMm,
    onSelect: props.onSelect, onSelectMany: props.onSelectMany, onSelectSurface: props.onSelectSurface,
    onSelectRoom: props.onSelectRoom,
  });
  const underlayDrag = usePlanUnderlayDrag({
    active: movingUnderlay, underlay, worldPoint, onCommit: props.onSetPlanUnderlay,
  });
  const measure = usePlanMeasureTool({
    ...snapInput, tool, underlay, snapSizeMm: props.snapSizeMm, worldPoint,
    onSetPlanUnderlay: props.onSetPlanUnderlay, onCalibrateComplete: props.onCalibrateComplete,
  });
  const measureLike = measure.active;
  const roomDrawing = useRoomDrawing({
    ...snapInput, active: drawRoom || drawSurface || drawCutout,
    closeRequest: props.roomPolygonCloseRequest, worldPoint,
    onCommit: (drawing) => (drawSurface ? props.onDrawSurface(drawing, props.surfaceMaterialId)
      : drawCutout ? props.onDrawCeilingCutout(drawing) : props.onCreateRoom(drawing)),
    onPointCount: props.onRoomPolygonPointCount,
  });
  const wallDrawing = useWallDrawing({
    ...snapInput, active: drawWall || drawPartition, worldPoint,
    onCommit: (start, end) => props.onDrawWallSegment(start, end, drawPartition ? "partition" : "wall"),
  });

  const referenceDims = useMemo(
    () => collectReferenceDimensions(props.project),
    [props.project],
  );

  function handleWall(event: ReactPointerEvent<SVGLineElement>, wallId: string) {
    if (measure.awaitingWall) { event.stopPropagation(); measure.pickWall(wallId); return; }
    if (measureLike || nav.spaceDown) return;
    if (drawWall || drawPartition) { wallDrawing.begin(event); return; }
    if (editWalls && walls.beginWall(event, wallId)) return;
    event.stopPropagation();
    if (tool !== "place-door" && tool !== "place-window") {
      props.onSelectWall(wallId); return;
    }
    const wall = props.project.walls.find((item) => item.id === wallId);
    if (!wall) return;
    const kind = tool === "place-door" ? "door" : "window";
    const catalog = getOpeningCatalogItem(props.openingCatalogItemId);
    const widthMm = catalog.kind === kind ? catalog.defaults.widthMm : kind === "door" ? 900 : 1200;
    const point = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    const { offsetMm } = snapOpeningOffset(props.project, wall, {
      centreMm: openingCentreAtPoint(wall, point), widthMm,
      thresholdMm: props.snapEnabled === false ? 0 : pointerSnapMm, gridMm: props.snapSizeMm,
    });
    props.onSelectWall(wallId); props.onPlaceOpening(wallId, kind, offsetMm);
  }

  function snapPoint(point: Point2Mm): Point2Mm {
    const grid = props.snapSizeMm;
    return { x: Math.round(point.x / grid) * grid, z: Math.round(point.z / grid) * grid };
  }

  function placeColumnAt(event: ReactPointerEvent<SVGElement>) {
    const target = event.target as Element;
    if (target.closest("[data-object-id]")) return;
    event.preventDefault();
    event.stopPropagation();
    props.onPlaceColumn(snapPoint(worldPoint(event as ReactPointerEvent<SVGSVGElement>)));
  }

  function paperDown(event: ReactPointerEvent<SVGRectElement>) {
    if (nav.beginPan(event as unknown as ReactPointerEvent<SVGSVGElement>)) return;
    if (measureLike) { if (event.button === 0) measure.click(event); return; }
    if (placeColumn) { placeColumnAt(event); return; }
    if (roomDrawing.start(event)) return;
    if (wallDrawing.begin(event)) return;
    if (editWalls && event.button === 0) {
      marquee.begin(event, worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>), false);
      return;
    }
    props.onSelect(null);
    props.onSelectSurface(null);
  }

  function floorDown(event: ReactPointerEvent<SVGPathElement>) {
    if (nav.beginPan(event as unknown as ReactPointerEvent<SVGSVGElement>)) return;
    if (measureLike) { if (event.button === 0) measure.click(event); return; }
    if (placeColumn) { placeColumnAt(event); return; }
    if (!editWalls || event.button !== 0) return;
    // Potential marquee from inside the room; click without drag selects the room.
    event.preventDefault();
    event.stopPropagation();
    marquee.begin(event, worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>), true);
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (nav.movePan(event)) return;
    if (measureLike) { measure.hover(event); return; }
    if (planGuides.move(event)) return;
    if (underlayDrag.move(event)) return;
    if (marquee.active) { marquee.update(worldPoint(event)); return; }
    if (roomDrawing.move(event)) return;
    if (wallDrawing.move(event)) return;
    if (walls.move(event)) return;
    if (!openings.openingDragMove(event)) objects.move(event);
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    if (nav.endPan(event)) return;
    if (planGuides.finish()) return;
    if (underlayDrag.finish()) return;
    if (marquee.finish()) return;
    if (roomDrawing.finish(event)) return;
    if (wallDrawing.finish(event)) return;
    if (walls.finish()) return;
    objects.finish(); openings.finishOpeningDrag();
  }

  const marqueeRect = marquee.rect;

  return <>
  <CalibrateUnderlayDialog
    open={Boolean(measure.prompt)}
    canAlignToWall={props.project.walls.some((wall) => wall.visible)}
    error={measure.error}
    onClearError={measure.clearError}
    onConfirm={measure.applyKnownLength}
    onAlignToWall={measure.startAlignToWall}
    onCancel={measure.cancelPrompt}
  />
  <svg ref={nav.svgRef}
    className={`lr-plan-svg is-${props.readability.visualStyle}-style ${objects.dragging || walls.dragging || underlayDrag.dragging || planGuides.dragging || nav.panning ? "is-dragging" : ""} ${nav.spaceDown ? "is-pan-ready" : ""} ${measure.measuring ? "is-measure" : ""} ${measure.calibrating ? "is-calibrate" : ""} ${planGuides.placing ? "is-placing-guide" : ""}`}
    viewBox={nav.viewBox} role="application" aria-label="Living room plan editor"
    data-testid="lr-plan-svg"
    onWheel={nav.onWheel}
    onPointerDownCapture={(event) => {
      if (nav.beginPan(event)) return;
      planGuides.deselectUnlessGuide(event);
      if (measureLike) {
        // Capture before cabinet/opening drag handlers steal the gesture.
        // Primary button only — right/middle must not add measure points.
        if (event.button === 0) measure.click(event);
        return;
      }
      if (drawWall || drawPartition) { wallDrawing.begin(event); return; }
      if (planGuides.place(event)) return;
      if (placeColumn) placeColumnAt(event);
    }}
    onPointerDown={(event) => {
      if (nav.beginPan(event)) return;
      if (measureLike) { if (event.button === 0) measure.click(event); return; }
      if (event.target === event.currentTarget) { props.onSelect(null); props.onSelectSurface(null); }
    }}
    onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={finish}
    onContextMenu={(event) => event.preventDefault()}>
    <PlanArchitectureLayer project={props.project} room={room} snapSizeMm={props.snapSizeMm}
      showGrid={props.showGrid} activeWallId={props.activeWallId} visualStyle={props.readability.visualStyle}
      previewNodes={walls.previewNodes} onPaper={paperDown} onWall={handleWall}
      onFloor={editWalls || measureLike || placeColumn ? floorDown : undefined}
      underlayOffset={underlayDrag.preview} onUnderlayPointerDown={underlayDrag.movable ? underlayDrag.start : undefined}
      showCenterLine={shouldShowAutoCenterLine(planGuides.stored, props.readability.showCenterLine)} />
    <PlanGuidesLayer guides={planGuides.guides} extent={bounds} selectedId={planGuides.selectedId}
      interactive={planGuides.interactive} lineHit={planGuides.placing} hitWidthMm={pointerSnapMm} onStart={planGuides.start} />
    <PlanSurfaceZonesLayer project={props.project} roomId={room?.id ?? ""} selectable={tool === "select" || tool === "draw-surface"}
      activeSurfaceId={props.activeSurfaceId} onSelectSurface={props.onSelectSurface} />
    <RoomDrawingOverlay polygon={roomDrawing.polygon} rectangle={roomDrawing.rectangle} cursor={roomDrawing.cursor} snap={roomDrawing.snap} markerMm={pointerSnapMm} active={drawRoom || drawSurface || drawCutout} unit={props.readability.unit} showHint={!underlay} />
    <WallDrawingOverlay preview={wallDrawing.preview} snap={wallDrawing.snap} markerMm={pointerSnapMm} active={drawWall || drawPartition} unit={props.readability.unit} />
    <PlanWallNodesLayer project={props.project} activeWallId={props.activeWallId} editable={editWalls}
      previewNodes={walls.previewNodes} translatePreview={walls.translatePreview}
      onNodePointerDown={(event, nodeId) => walls.beginNode(event, nodeId)} />
    {walls.feedback ? <DraftFeedbackOverlay start={walls.feedback.start} end={walls.feedback.end}
      snap={walls.feedback.snap} markerMm={pointerSnapMm} unit={props.readability.unit} /> : null}
    <PlanOpeningsLayer project={props.project} activeOpeningId={props.activeOpeningId}
      openingPreview={openings.openingPreview} snap={openings.openingSnap} markerMm={pointerSnapMm} onSelectOpening={props.onSelectOpening}
      onStartDrag={openings.startOpeningDrag} unit={props.readability.unit}
      interactive={!measureLike} />
    <PlanObjectsLayer project={props.project} selectedIds={props.selectedIds} issues={props.issues}
      preview={objects.preview} guides={objects.guides} snapMarker={objects.wallSnap} markerMm={pointerSnapMm} unit={props.readability.unit}
      selectedRunId={selectedRunId}
      freeSegments={placementPreview?.freeSegments}
      freeSegmentWallPose={freeSegmentWallPose}
      onSetCabinetDims={props.onSetCabinetInlineDims}
      onStart={objects.start} interactive={!measureLike && !underlayDrag.movable} />
    <PlanCeilingLayer project={props.project} room={room} unit={props.readability.unit} visible={ceilingVisible} onSelectLight={props.onSelectLight}
      snapSizeMm={props.snapSizeMm} interactive={editWalls} onPatchDocument={props.onPatchDocument} />
    {props.onSelectLight ? (
      <PlanLightsLayer project={props.project} activeLightId={props.activeLightId ?? null} passThroughLightIds={ceilingVisible ? cutoutHostedLightIds(props.project) : undefined}
        hidden={measureLike} onSelectLight={props.onSelectLight} />
    ) : null}
    {room ? <PlanDimensionsLayer project={props.project} room={room} activeWallId={props.activeWallId}
      settings={props.readability} referenceDims={referenceDims} selectedIds={props.selectedIds}
      onSetWallLength={props.onSetWallLength} /> : null}
    <PlanMeasureOverlay active={measureLike} points={measure.points} cursor={measure.cursor} snap={measure.snap} markerMm={pointerSnapMm} mode={measure.calibrating ? "calibrate" : "measure"} />
    {measure.blockedReason ? (
      <text className="lr-empty-plan-hint" data-testid="lr-calibrate-blocked" x={bounds.centerX} y={bounds.centerZ} textAnchor="middle">
        {measure.blockedReason}
      </text>
    ) : null}
    {measure.awaitingWall ? (
      <text className="lr-empty-plan-hint" data-testid="lr-calibrate-pick-wall" x={bounds.centerX} y={bounds.minZ + 120} textAnchor="middle">
        Now click the drawn wall these two points belong to. Esc cancels.
      </text>
    ) : null}
    {!measure.prompt && measure.error ? (
      <text className="lr-empty-plan-hint" data-testid="lr-calibrate-error" x={bounds.centerX} y={bounds.centerZ + 180} textAnchor="middle">
        {measure.error}
      </text>
    ) : null}
    {marqueeRect ? (
      <rect
        className="lr-plan-marquee"
        x={marqueeRect.x} y={marqueeRect.z} width={marqueeRect.width} height={marqueeRect.height}
        data-testid="lr-plan-marquee"
      />
    ) : null}
    {!room && !underlay ? (
      <text className="lr-empty-plan-hint" x={bounds.centerX} y={bounds.centerZ} textAnchor="middle">
        Drag a rectangle to draw the room, then use Draw Wall to add or split walls.
      </text>
    ) : null}
    {props.preDropReason ? (
      <text
        className="lr-empty-plan-hint lr-predrop-reason"
        data-testid="lr-predrop-reason"
        x={bounds.centerX}
        y={bounds.minZ + 120}
        textAnchor="middle"
      >
        {props.preDropReason}
      </text>
    ) : null}
  </svg>
  </>;
}
