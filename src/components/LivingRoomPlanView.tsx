import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../domain/interiorProject";
import {
  getLivingRoomPlanUnderlay,
  openingOffsetAtPoint,
  getOpeningCatalogItem,
  snapLivingRoomObject,
  type BuildTool,
  type LivingRoomPlanIssue,
  type PlanSnapGuide,
} from "../domain/livingRoom";
import {
  PlanOpeningsLayer,
  usePlanOpeningInteraction,
} from "./livingRoomPlan/PlanOpeningsLayer";
import { PlanObjectSymbol } from "./livingRoomPlan/PlanObjectSymbol";

type LivingRoomPlanViewProps = {
  project: InteriorProject;
  selectedIds: string[];
  issues: LivingRoomPlanIssue[];
  snapSizeMm: number;
  showGrid: boolean;
  onSelect: (objectId: string | null, additive?: boolean) => void;
  onMove: (objectId: string, position: Point3Mm) => void;
  onResize: (objectId: string, dimensions: Size3Mm) => void;
  activeWallId: string | null;
  activeOpeningId: string | null;
  onSelectWall: (wallId: string) => void;
  onSelectOpening: (openingId: string) => void;
  onMoveOpening: (openingId: string, offsetMm: number) => void;
  onResizeOpening: (openingId: string, widthMm: number, offsetMm?: number) => void;
  activeBuildTool?: BuildTool;
  openingCatalogItemId?: string;
  onPlaceOpening: (wallId: string, kind: "door" | "window", offsetMm: number) => void;
};

type DragState = {
  mode: "move" | "resize";
  objectId: string;
  startPointer: { x: number; z: number };
  startPosition: Point3Mm;
  startDimensions: Size3Mm;
};

type PreviewState = {
  objectId: string;
  position: Point3Mm;
  dimensions: Size3Mm;
};

export function LivingRoomPlanView({
  project,
  selectedIds,
  issues,
  snapSizeMm,
  showGrid,
  onSelect,
  onMove,
  onResize,
  activeWallId,
  activeOpeningId,
  onSelectWall,
  onSelectOpening,
  onMoveOpening,
  onResizeOpening,
  activeBuildTool = "select",
  openingCatalogItemId,
  onPlaceOpening,
}: LivingRoomPlanViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [guides, setGuides] = useState<PlanSnapGuide[]>([]);
  const room = project.rooms.find((item) => item.id === project.activeRoomId)!;
  const materials = useMemo(() => new Map(project.materials.map((material) => [material.id, material])), [project.materials]);
  const floorMaterialId = typeof room.extensions?.floorMaterialId === "string" ? room.extensions.floorMaterialId : "";
  const floorColor = materials.get(floorMaterialId)?.color ?? "#e8dfd0";
  const underlay = getLivingRoomPlanUnderlay(project);
  const margin = 700;
  const viewBox = [
    -room.dimensions.widthMm / 2 - margin,
    -room.dimensions.depthMm / 2 - margin,
    room.dimensions.widthMm + margin * 2,
    room.dimensions.depthMm + margin * 2,
  ].join(" ");
  const issueIds = useMemo(
    () => new Set(issues.flatMap((issue) => issue.objectIds)),
    [issues],
  );
  const renderObjects = useMemo(
    () => project.objects.filter((object) => object.extensions?.layerVisible !== false).sort((a, b) =>
      Number(b.category === "rug") - Number(a.category === "rug"),
    ),
    [project.objects],
  );

  function worldPoint(event: ReactPointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM()?.inverse();
    if (!svg || !matrix) return { x: 0, z: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformed = point.matrixTransform(matrix);
    return { x: transformed.x, z: transformed.y };
  }

  const {
    openingPreview,
    startOpeningDrag,
    openingDragMove,
    finishOpeningDrag,
  } = usePlanOpeningInteraction({
    project,
    snapSizeMm,
    worldPoint,
    onSelectOpening,
    onMoveOpening,
    onResizeOpening,
  });

  function startDrag(
    event: ReactPointerEvent<SVGGElement | SVGRectElement>,
    object: InteriorObjectEntity,
    mode: DragState["mode"],
  ) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(object.id, event.shiftKey || event.metaKey || event.ctrlKey);
    const point = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    setDrag({
      mode,
      objectId: object.id,
      startPointer: point,
      startPosition: { ...object.position },
      startDimensions: { ...object.dimensions },
    });
    setPreview({
      objectId: object.id,
      position: { ...object.position },
      dimensions: { ...object.dimensions },
    });
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (openingDragMove(event)) return;
    if (!drag) return;
    const point = worldPoint(event);
    const dx = point.x - drag.startPointer.x;
    const dz = point.z - drag.startPointer.z;
    if (drag.mode === "move") {
      const result = snapLivingRoomObject(
        project,
        drag.objectId,
        {
          ...drag.startPosition,
          x: drag.startPosition.x + dx,
          z: drag.startPosition.z + dz,
        },
        snapSizeMm,
      );
      setPreview({
        objectId: drag.objectId,
        position: result.position,
        dimensions: drag.startDimensions,
      });
      setGuides(result.guides);
      return;
    }

    const object = project.objects.find((item) => item.id === drag.objectId)!;
    const radians = (-object.rotation.y * Math.PI) / 180;
    const localX = dx * Math.cos(radians) - dz * Math.sin(radians);
    const localZ = dx * Math.sin(radians) + dz * Math.cos(radians);
    const dimensions = {
      ...drag.startDimensions,
      widthMm: Math.max(100, Math.round((drag.startDimensions.widthMm + localX * 2) / snapSizeMm) * snapSizeMm),
      depthMm: Math.max(100, Math.round((drag.startDimensions.depthMm + localZ * 2) / snapSizeMm) * snapSizeMm),
    };
    setPreview({ objectId: drag.objectId, position: drag.startPosition, dimensions });
    setGuides([]);
  }

  function finishDrag() {
    if (!drag || !preview) return;
    if (drag.mode === "move") onMove(drag.objectId, preview.position);
    else onResize(drag.objectId, preview.dimensions);
    setDrag(null);
    setPreview(null);
    setGuides([]);
  }

  function handleWallPointer(event: ReactPointerEvent<SVGLineElement>, wallId: string) {
    event.stopPropagation();
    if (activeBuildTool !== "place-door" && activeBuildTool !== "place-window") {
      onSelectWall(wallId);
      return;
    }
    const wall = project.walls.find((item) => item.id === wallId);
    if (!wall) return;
    const point = worldPoint(event as unknown as ReactPointerEvent<SVGSVGElement>);
    const kind = activeBuildTool === "place-door" ? "door" : "window";
    const catalog = getOpeningCatalogItem(openingCatalogItemId);
    const widthMm = catalog.kind === kind ? catalog.defaults.widthMm : kind === "door" ? 900 : 1200;
    const offsetMm = openingOffsetAtPoint(wall, point, widthMm, snapSizeMm);
    onSelectWall(wallId);
    onPlaceOpening(wallId, kind, offsetMm);
  }

  return (
    <svg
      ref={svgRef}
      className={`lr-plan-svg ${drag ? "is-dragging" : ""}`}
      viewBox={viewBox}
      role="application"
      aria-label="Living room plan editor"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onSelect(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { finishDrag(); finishOpeningDrag(); }}
      onPointerCancel={() => { finishDrag(); finishOpeningDrag(); }}
    >
      <defs>
        <pattern
          id="lr-grid-small"
          width={snapSizeMm}
          height={snapSizeMm}
          patternUnits="userSpaceOnUse"
        >
          <path d={`M ${snapSizeMm} 0 L 0 0 0 ${snapSizeMm}`} className="lr-grid-line" />
        </pattern>
        <pattern
          id="lr-grid-major"
          width={snapSizeMm * 10}
          height={snapSizeMm * 10}
          patternUnits="userSpaceOnUse"
        >
          <rect width="100%" height="100%" fill="url(#lr-grid-small)" />
          <path
            d={`M ${snapSizeMm * 10} 0 L 0 0 0 ${snapSizeMm * 10}`}
            className="lr-grid-major-line"
          />
        </pattern>
      </defs>

      <rect
        x={-20000}
        y={-20000}
        width={40000}
        height={40000}
        className="lr-plan-paper"
        onPointerDown={() => onSelect(null)}
      />
      {underlay ? (
        <image
          href={underlay.dataUrl}
          x={-underlay.widthMm / 2}
          y={-underlay.heightMm / 2}
          width={underlay.widthMm}
          height={underlay.heightMm}
          opacity={underlay.opacity}
          preserveAspectRatio="none"
          className="lr-plan-underlay-image"
        />
      ) : null}
      <rect
        x={-room.dimensions.widthMm / 2}
        y={-room.dimensions.depthMm / 2}
        width={room.dimensions.widthMm}
        height={room.dimensions.depthMm}
        fill={floorColor}
        opacity="0.55"
        pointerEvents="none"
      />
      {showGrid ? (
        <rect
          x={-room.dimensions.widthMm / 2}
          y={-room.dimensions.depthMm / 2}
          width={room.dimensions.widthMm}
          height={room.dimensions.depthMm}
          fill="url(#lr-grid-major)"
        />
      ) : null}
      <line
        x1={-room.dimensions.widthMm / 2}
        y1="0"
        x2={room.dimensions.widthMm / 2}
        y2="0"
        className="lr-center-line"
      />
      <line
        x1="0"
        y1={-room.dimensions.depthMm / 2}
        x2="0"
        y2={room.dimensions.depthMm / 2}
        className="lr-center-line"
      />

      {project.walls.filter((wall) => wall.visible).map((wall) => (
          <line
          key={wall.id}
          data-wall-id={wall.id}
          x1={wall.start.x}
          y1={wall.start.z}
          x2={wall.end.x}
          y2={wall.end.z}
          className={`lr-wall-line ${wall.id === activeWallId ? "is-active" : ""}`}
          style={{ stroke: wall.id === activeWallId ? undefined : materials.get(wall.materialId ?? "")?.color }}
          onPointerDown={(event) => handleWallPointer(event, wall.id)}
        />
      ))}
      <PlanOpeningsLayer
        project={project}
        activeOpeningId={activeOpeningId}
        openingPreview={openingPreview}
        onSelectOpening={onSelectOpening}
        onStartDrag={startOpeningDrag}
      />

      {renderObjects.map((object) => {
        const activePreview = preview?.objectId === object.id ? preview : null;
        const position = activePreview?.position ?? object.position;
        const dimensions = activePreview?.dimensions ?? object.dimensions;
        const selected = selectedIds.includes(object.id);
        const compactLabel = dimensions.widthMm < 700 || dimensions.depthMm < 200;
        return (
          <g
            key={object.id}
            transform={`translate(${position.x} ${position.z}) rotate(${object.rotation.y})`}
            className={`lr-plan-object ${selected ? "is-selected" : ""} ${issueIds.has(object.id) ? "has-issue" : ""}`}
            data-object-id={object.id}
            onPointerDown={(event) => startDrag(event, object, "move")}
          >
            <rect
              x={-dimensions.widthMm / 2}
              y={-dimensions.depthMm / 2}
              width={dimensions.widthMm}
              height={dimensions.depthMm}
              rx={object.category === "rug" ? 45 : 12}
            />
            <PlanObjectSymbol object={object} dimensions={dimensions} />
            <line x1="0" y1="0" x2="0" y2={-dimensions.depthMm / 2 + 70} className="lr-object-axis" />
            {object.category !== "rug" ? (
              <text transform={`rotate(${-object.rotation.y})`} className={`lr-object-label ${compactLabel ? "is-compact" : ""}`}>
                <tspan x="0" y={compactLabel ? -dimensions.depthMm / 2 - 55 : -8}>{object.name}</tspan>
                {!compactLabel ? (
                  <tspan x="0" y="68" className="lr-object-size">
                    {dimensions.widthMm} × {dimensions.depthMm}
                  </tspan>
                ) : null}
              </text>
            ) : null}
            {selected && selectedIds.length === 1 ? (
              <rect
                x={dimensions.widthMm / 2 - 55}
                y={dimensions.depthMm / 2 - 55}
                width="110"
                height="110"
                className="lr-resize-handle"
                onPointerDown={(event) => startDrag(event, object, "resize")}
              />
            ) : null}
          </g>
        );
      })}

      {guides.map((guide, index) =>
        guide.axis === "x" ? (
          <line
            key={`${guide.axis}-${index}`}
            x1={guide.valueMm}
            y1={-10000}
            x2={guide.valueMm}
            y2={10000}
            className={`lr-snap-guide is-${guide.kind}`}
          />
        ) : (
          <line
            key={`${guide.axis}-${index}`}
            x1={-10000}
            y1={guide.valueMm}
            x2={10000}
            y2={guide.valueMm}
            className={`lr-snap-guide is-${guide.kind}`}
          />
        ),
      )}

      <g className="lr-overall-dim">
        <line
          x1={-room.dimensions.widthMm / 2}
          y1={room.dimensions.depthMm / 2 + 360}
          x2={room.dimensions.widthMm / 2}
          y2={room.dimensions.depthMm / 2 + 360}
        />
        <text x="0" y={room.dimensions.depthMm / 2 + 320}>{room.dimensions.widthMm} mm</text>
        <line
          x1={-room.dimensions.widthMm / 2 - 360}
          y1={-room.dimensions.depthMm / 2}
          x2={-room.dimensions.widthMm / 2 - 360}
          y2={room.dimensions.depthMm / 2}
        />
        <text
          transform={`translate(${-room.dimensions.widthMm / 2 - 400} 0) rotate(-90)`}
        >
          {room.dimensions.depthMm} mm
        </text>
      </g>
    </svg>
  );
}
