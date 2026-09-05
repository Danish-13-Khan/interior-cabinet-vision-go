import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorProject, Point2Mm, Point3Mm, RoomDrawingRequest, Size3Mm } from "../domain/interiorProject";
import { EMPTY_PLAN_SITE_BOUNDS, roomPlanViewBounds } from "../domain/interiorProject";
import {
  PLAN_MARQUEE_CLICK_SCREEN_PX,
  PLAN_POINTER_SNAP_SCREEN_PX,
  PLAN_WALL_MOVE_SCREEN_PX,
  appendMeasurePoint,
  boundsFromPoints,
  calibrateUnderlayScale,
  parseKnownLengthMm,
  collectMeasureSnapPoints,
  collectReferenceDimensions,
  expandBounds,
  getLivingRoomPlanUnderlay,
  getObjectPlanBounds,
  getOpeningCatalogItem,
  openingOffsetAtPoint,
  rectsIntersect,
  snapMeasurePoint,
  type BuildTool,
  type LivingRoomPlanIssue,
  type LivingRoomPlanUnderlay,
  type MeasureSnapPoint,
  type PlanReadabilitySettings,
  type WallLengthAnchor,
} from "../domain/livingRoom";
import { PromptDialog } from "./PromptDialog";
import { usePlanCanvasNavigation } from "../hooks/usePlanCanvasNavigation";
import { PlanArchitectureLayer } from "./livingRoomPlan/PlanArchitectureLayer";
import { PlanDimensionsLayer } from "./livingRoomPlan/PlanDimensionsLayer";
import { PlanMeasureOverlay } from "./livingRoomPlan/PlanMeasureOverlay";
import { PlanObjectsLayer } from "./livingRoomPlan/PlanObjectsLayer";
import { PlanOpeningsLayer, usePlanOpeningInteraction } from "./livingRoomPlan/PlanOpeningsLayer";
import { PlanSurfaceZonesLayer } from "./livingRoomPlan/PlanSurfaceZonesLayer";
import { PlanWallNodesLayer } from "./livingRoomPlan/PlanWallNodesLayer";
import { DraftFeedbackOverlay } from "./livingRoomPlan/DraftFeedbackOverlay";
import { RoomDrawingOverlay } from "./livingRoomPlan/RoomDrawingOverlay";
import { WallDrawingOverlay } from "./livingRoomPlan/WallDrawingOverlay";
import { usePlanObjectInteraction } from "./livingRoomPlan/usePlanObjectInteraction";
import { usePlanWallInteraction } from "./livingRoomPlan/usePlanWallInteraction";
import { useRoomDrawing } from "./livingRoomPlan/useRoomDrawing";
import { useWallDrawing } from "./livingRoomPlan/useWallDrawing";

type Props = {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  snapSizeMm: number; showGrid: boolean; activeWallId: string | null; activeOpeningId: string | null;
  activeSurfaceId: string | null; surfaceMaterialId: string;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onSelectMany?: (objectIds: string[]) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
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
  onDrawWallSegment: (start: Point2Mm, end: Point2Mm, wallKind?: "wall" | "partition") => void;
  onPlaceColumn: (position: Point2Mm) => void;
  roomPolygonCloseRequest: number;
  onRoomPolygonPointCount: (count: number) => void;
  readability: PlanReadabilitySettings;
  onSetWallLength?: (wallId: string, lengthMm: number, anchor: WallLengthAnchor) => void;
  onRegisterViewControls?: (controls: { fitPlan: () => void; fitSelection: () => void } | null) => void;
  onSetPlanUnderlay?: (underlay: LivingRoomPlanUnderlay | null) => void;
  onCalibrateComplete?: () => void;
};

type MarqueeState = {
  start: Point2Mm;
  current: Point2Mm;
  additive: boolean;
  /** True when gesture began on room floor (click without drag → select room). */
  fromFloor: boolean;
};

export function LivingRoomPlanView(props: Props) {
  const room = props.project.rooms.find((item) => item.id === props.project.activeRoomId) ?? null;
  const bounds = room ? roomPlanViewBounds(props.project, room.id) : EMPTY_PLAN_SITE_BOUNDS;
  const fitBounds = useMemo(() => ({
    minX: bounds.minX, minZ: bounds.minZ, maxX: bounds.maxX, maxZ: bounds.maxZ,
  }), [bounds.minX, bounds.minZ, bounds.maxX, bounds.maxZ]);
  const fitKey = `${props.project.id}:${props.project.activeRoomId}`;
  const nav = usePlanCanvasNavigation({ fitBounds, fitKey });
  const pointerSnapMm = nav.screenToWorldMm(PLAN_POINTER_SNAP_SCREEN_PX);
  const marqueeClickMm = nav.screenToWorldMm(PLAN_MARQUEE_CLICK_SCREEN_PX);
  const wallMoveMm = nav.screenToWorldMm(PLAN_WALL_MOVE_SCREEN_PX);

  const tool = props.activeBuildTool ?? "select";
  const drawRoom = tool === "draw-room";
  const drawSurface = tool === "draw-surface";
  const drawWall = tool === "draw-wall";
  const drawPartition = tool === "draw-partition";
  const placeColumn = tool === "place-column";
  const measuring = tool === "measure";
  const calibrating = tool === "calibrate-underlay";
  const measureLike = measuring || calibrating;
  const editWalls = tool === "select";
  const underlay = getLivingRoomPlanUnderlay(props.project);
  const calibrateBlockedReason = !calibrating ? null
    : !underlay ? "Import a floor plan underlay before calibrating."
    : underlay.locked ? "Unlock the underlay before calibrating."
    : null;

  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [measurePoints, setMeasurePoints] = useState<Point2Mm[]>([]);
  const [measureCursor, setMeasureCursor] = useState<Point2Mm | null>(null);
  const [measureSnap, setMeasureSnap] = useState<MeasureSnapPoint | null>(null);
  const [calibratePrompt, setCalibratePrompt] = useState<{ a: Point2Mm; b: Point2Mm } | null>(null);
  const [calibrateError, setCalibrateError] = useState<string | null>(null);

  useEffect(() => {
    setMeasurePoints([]);
    setMeasureCursor(null);
    setMeasureSnap(null);
    setCalibratePrompt(null);
    setCalibrateError(null);
  }, [tool, props.project.id, props.project.activeRoomId]);

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
    props.onRegisterViewControls?.({ fitPlan: nav.fitPlan, fitSelection });
    return () => props.onRegisterViewControls?.(null);
  }, [nav.fitPlan, nav.fitSelectionBounds, props, props.project.objects, props.selectedIds]);

  function worldPoint(event: ReactPointerEvent<SVGSVGElement>) {
    return nav.worldFromClient(event.clientX, event.clientY);
  }

  const openings = usePlanOpeningInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, worldPoint,
    onSelectOpening: props.onSelectOpening, onMoveOpening: props.onMoveOpening,
    onResizeOpening: props.onResizeOpening,
  });
  const objects = usePlanObjectInteraction({
    project: props.project, snapSizeMm: props.snapSizeMm, snapThresholdMm: pointerSnapMm, worldPoint,
    onSelect: props.onSelect, onMove: props.onMove, onResize: props.onResize,
  });
  const walls = usePlanWallInteraction({
    active: editWalls, project: props.project, snapSizeMm: props.snapSizeMm, moveThresholdMm: wallMoveMm, worldPoint,
    onSelectWall: props.onSelectWall, onMoveNode: props.onMoveNode, onTranslateWall: props.onTranslateWall,
  });
  const roomDrawing = useRoomDrawing({
    active: drawRoom || drawSurface, snapSizeMm: props.snapSizeMm,
    closeRequest: props.roomPolygonCloseRequest, worldPoint,
    onCommit: (drawing) => {
      if (drawSurface) props.onDrawSurface(drawing, props.surfaceMaterialId);
      else props.onCreateRoom(drawing);
    },
    onPointCount: props.onRoomPolygonPointCount,
  });
  const wallDrawing = useWallDrawing({
    active: drawWall || drawPartition, snapSizeMm: props.snapSizeMm, nodes: props.project.nodes, worldPoint,
    onCommit: (start, end) => props.onDrawWallSegment(start, end, drawPartition ? "partition" : "wall"),
  });

  const measureCandidates = useMemo(
    () => (measureLike ? collectMeasureSnapPoints(props.project, props.snapSizeMm) : []),
    [measureLike, props.project, props.snapSizeMm],
  );
  const referenceDims = useMemo(
    () => collectReferenceDimensions(props.project),
    [props.project],
  );

  function handleWall(event: ReactPointerEvent<SVGLineElement>, wallId: string) {
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
    const offsetMm = openingOffsetAtPoint(wall, point, widthMm, props.snapSizeMm);
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

  function updateMeasureHover(event: ReactPointerEvent<SVGSVGElement>) {
    const raw = worldPoint(event);
    const snapped = snapMeasurePoint(raw, measureCandidates, pointerSnapMm, props.snapSizeMm);
    setMeasureSnap(snapped);
    setMeasureCursor(snapped);
  }

  function commitMeasureClick(event: ReactPointerEvent<SVGElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (calibrating && calibrateBlockedReason) return;
    if (calibrating && calibratePrompt) return;
    const raw = worldPoint(event as ReactPointerEvent<SVGSVGElement>);
    const snapped = snapMeasurePoint(raw, measureCandidates, pointerSnapMm, props.snapSizeMm);
    setMeasureSnap(snapped);
    setMeasureCursor(snapped);
    setMeasurePoints((current) => {
      const next = appendMeasurePoint(current, snapped);
      if (calibrating && next.length >= 2) {
        const a = next[0]!;
        const b = next[1]!;
        setCalibratePrompt({ a, b });
        return [a, b];
      }
      return next;
    });
  }

  function applyCalibrateKnownLength(rawValue: string) {
    if (!calibratePrompt || !underlay || !props.onSetPlanUnderlay) {
      setCalibratePrompt(null);
      return;
    }
    try {
      const known = parseKnownLengthMm(rawValue);
      const next = calibrateUnderlayScale(underlay, calibratePrompt.a, calibratePrompt.b, known);
      props.onSetPlanUnderlay(next);
      setCalibrateError(null);
      setCalibratePrompt(null);
      setMeasurePoints([]);
      setMeasureCursor(null);
      setMeasureSnap(null);
      props.onCalibrateComplete?.();
    } catch (error) {
      setCalibrateError(error instanceof Error ? error.message : "Calibration failed.");
    }
  }

  function paperDown(event: ReactPointerEvent<SVGRectElement>) {
    if (nav.beginPan(event as unknown as ReactPointerEvent<SVGSVGElement>)) return;
    if (measureLike) { if (event.button === 0) commitMeasureClick(event); return; }
    if (placeColumn) { placeColumnAt(event); return; }
    if (roomDrawing.start(event)) return;
    if (wallDrawing.begin(event)) return;
    if (editWalls && event.button === 0) {
      const start = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
      setMarquee({ start, current: start, additive: event.shiftKey || event.metaKey || event.ctrlKey, fromFloor: false });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    props.onSelect(null);
    props.onSelectSurface(null);
  }

  function floorDown(event: ReactPointerEvent<SVGPathElement>) {
    if (nav.beginPan(event as unknown as ReactPointerEvent<SVGSVGElement>)) return;
    if (measureLike) { if (event.button === 0) commitMeasureClick(event); return; }
    if (placeColumn) { placeColumnAt(event); return; }
    if (!editWalls || event.button !== 0) return;
    // Potential marquee from inside the room; click without drag selects the room.
    event.preventDefault();
    event.stopPropagation();
    const start = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    setMarquee({
      start,
      current: start,
      additive: event.shiftKey || event.metaKey || event.ctrlKey,
      fromFloor: true,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (nav.movePan(event)) return;
    if (measureLike) { updateMeasureHover(event); return; }
    if (marquee) {
      setMarquee({ ...marquee, current: worldPoint(event) });
      return;
    }
    if (roomDrawing.move(event)) return;
    if (wallDrawing.move(event)) return;
    if (walls.move(event)) return;
    if (!openings.openingDragMove(event)) objects.move(event);
  }

  function finishMarquee() {
    if (!marquee) return;
    const minX = Math.min(marquee.start.x, marquee.current.x);
    const maxX = Math.max(marquee.start.x, marquee.current.x);
    const minZ = Math.min(marquee.start.z, marquee.current.z);
    const maxZ = Math.max(marquee.start.z, marquee.current.z);
    const tiny = Math.hypot(maxX - minX, maxZ - minZ) < marqueeClickMm;
    if (tiny) {
      if (marquee.fromFloor && !marquee.additive) {
        props.onSelectRoom?.();
      } else if (!marquee.additive) {
        props.onSelect(null);
        props.onSelectSurface(null);
      }
      setMarquee(null);
      return;
    }
    const hit = props.project.objects.filter((object) => {
      if (room && object.roomId !== room.id) return false;
      const b = getObjectPlanBounds(object);
      return rectsIntersect(b, { minX, minZ, maxX, maxZ });
    }).map((object) => object.id);
    if (props.onSelectMany) {
      const next = marquee.additive
        ? Array.from(new Set([...props.selectedIds, ...hit]))
        : hit;
      props.onSelectMany(next);
    } else if (hit[0]) {
      props.onSelect(hit[0], marquee.additive);
    } else if (!marquee.additive) {
      props.onSelect(null);
    }
    setMarquee(null);
  }

  function finish(event: ReactPointerEvent<SVGSVGElement>) {
    if (nav.endPan(event)) return;
    if (marquee) { finishMarquee(); return; }
    if (roomDrawing.finish(event)) return;
    if (wallDrawing.finish(event)) return;
    if (walls.finish()) return;
    objects.finish(); openings.finishOpeningDrag();
  }

  const marqueeRect = marquee ? {
    x: Math.min(marquee.start.x, marquee.current.x),
    z: Math.min(marquee.start.z, marquee.current.z),
    width: Math.abs(marquee.current.x - marquee.start.x),
    height: Math.abs(marquee.current.z - marquee.start.z),
  } : null;

  return <>
  <PromptDialog
    open={Boolean(calibratePrompt)}
    title="Calibrate underlay"
    message="Enter the known real-world distance between the two points (millimetres)."
    label="Known length (mm)"
    initialValue=""
    confirmLabel="Apply scale"
    cancelLabel="Cancel"
    testId="calibrate-known-length"
    error={calibrateError}
    onClearError={() => setCalibrateError(null)}
    onConfirm={applyCalibrateKnownLength}
    onCancel={() => {
      setCalibratePrompt(null);
      setMeasurePoints([]);
      setMeasureCursor(null);
      setMeasureSnap(null);
      setCalibrateError(null);
    }}
  />
  <svg ref={nav.svgRef}
    className={`lr-plan-svg is-${props.readability.visualStyle}-style ${objects.dragging || walls.dragging || nav.panning ? "is-dragging" : ""} ${nav.spaceDown ? "is-pan-ready" : ""} ${measuring ? "is-measure" : ""} ${calibrating ? "is-calibrate" : ""}`}
    viewBox={nav.viewBox} role="application" aria-label="Living room plan editor"
    data-testid="lr-plan-svg"
    onWheel={nav.onWheel}
    onPointerDownCapture={(event) => {
      if (nav.beginPan(event)) return;
      if (measureLike) {
        // Capture before cabinet/opening drag handlers steal the gesture.
        // Primary button only — right/middle must not add measure points.
        if (event.button === 0) commitMeasureClick(event);
        return;
      }
      if (drawWall || drawPartition) { wallDrawing.begin(event); return; }
      if (placeColumn) placeColumnAt(event);
    }}
    onPointerDown={(event) => {
      if (nav.spaceDown || event.button === 1) { nav.beginPan(event); return; }
      if (measureLike) { if (event.button === 0) commitMeasureClick(event); return; }
      if (event.target === event.currentTarget) { props.onSelect(null); props.onSelectSurface(null); }
    }}
    onPointerMove={pointerMove} onPointerUp={finish} onPointerCancel={finish}
    onContextMenu={(event) => event.preventDefault()}>
    <PlanArchitectureLayer project={props.project} room={room} snapSizeMm={props.snapSizeMm}
      showGrid={props.showGrid} activeWallId={props.activeWallId} visualStyle={props.readability.visualStyle}
      previewNodes={walls.previewNodes} onPaper={paperDown} onWall={handleWall}
      onFloor={editWalls || measureLike || placeColumn ? floorDown : undefined} />
    <PlanSurfaceZonesLayer project={props.project} roomId={room?.id ?? ""} selectable={tool === "select" || tool === "draw-surface"}
      activeSurfaceId={props.activeSurfaceId} onSelectSurface={props.onSelectSurface} />
    <RoomDrawingOverlay polygon={roomDrawing.polygon} rectangle={roomDrawing.rectangle} cursor={roomDrawing.cursor} active={drawRoom || drawSurface} unit={props.readability.unit} />
    <WallDrawingOverlay preview={wallDrawing.preview} snapTarget={wallDrawing.snapTarget} active={drawWall || drawPartition} unit={props.readability.unit} />
    <PlanWallNodesLayer project={props.project} activeWallId={props.activeWallId} editable={editWalls}
      previewNodes={walls.previewNodes} translatePreview={walls.translatePreview}
      onNodePointerDown={(event, nodeId) => walls.beginNode(event, nodeId)} />
    {walls.feedback ? <DraftFeedbackOverlay start={walls.feedback.start} end={walls.feedback.end}
      snapTarget={walls.feedback.snapTarget} snapLabel={walls.feedback.snapLabel} unit={props.readability.unit} /> : null}
    <PlanOpeningsLayer project={props.project} activeOpeningId={props.activeOpeningId}
      openingPreview={openings.openingPreview} onSelectOpening={props.onSelectOpening}
      onStartDrag={openings.startOpeningDrag} unit={props.readability.unit}
      interactive={!measureLike} />
    <PlanObjectsLayer project={props.project} selectedIds={props.selectedIds} issues={props.issues}
      preview={objects.preview} guides={objects.guides} unit={props.readability.unit}
      onStart={objects.start} interactive={!measureLike} />
    {room ? <PlanDimensionsLayer project={props.project} room={room} activeWallId={props.activeWallId}
      settings={props.readability} referenceDims={referenceDims}
      onSetWallLength={props.onSetWallLength} /> : null}
    <PlanMeasureOverlay active={measureLike} points={measurePoints} cursor={measureCursor} snap={measureSnap} mode={calibrating ? "calibrate" : "measure"} />
    {calibrating && calibrateBlockedReason ? (
      <text className="lr-empty-plan-hint" data-testid="lr-calibrate-blocked" x={bounds.centerX} y={bounds.centerZ} textAnchor="middle">
        {calibrateBlockedReason}
      </text>
    ) : null}
    {!calibratePrompt && calibrateError ? (
      <text className="lr-empty-plan-hint" data-testid="lr-calibrate-error" x={bounds.centerX} y={bounds.centerZ + 180} textAnchor="middle">
        {calibrateError}
      </text>
    ) : null}
    {marqueeRect ? (
      <rect
        className="lr-plan-marquee"
        x={marqueeRect.x} y={marqueeRect.z} width={marqueeRect.width} height={marqueeRect.height}
        data-testid="lr-plan-marquee"
      />
    ) : null}
    {!room ? (
      <text className="lr-empty-plan-hint" x={bounds.centerX} y={bounds.centerZ} textAnchor="middle">
        Drag a rectangle to draw the room, then use Draw Wall to add or split walls.
      </text>
    ) : null}
  </svg>
  </>;
}
