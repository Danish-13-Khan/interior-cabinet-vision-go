import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type {
  InteriorObjectEntity,
  InteriorProject,
  Point3Mm,
  Size3Mm,
} from "../domain/interiorProject";
import {
  getLivingRoomPlanUnderlay,
  snapLivingRoomObject,
  type LivingRoomPlanIssue,
  type PlanSnapGuide,
} from "../domain/livingRoom";

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

function PlanObjectSymbol({ object, dimensions }: { object: InteriorObjectEntity; dimensions: Size3Mm }) {
  const w = dimensions.widthMm;
  const d = dimensions.depthMm;
  if (object.category === "sofa") {
    const seats = Math.max(2, Number(object.parameters.seats) || 3);
    return (
      <g className="lr-plan-symbol">
        <rect x={-w * 0.43} y={-d * 0.34} width={w * 0.86} height={d * 0.58} rx="35" />
        <rect x={-w * 0.48} y={-d * 0.42} width={w * 0.08} height={d * 0.76} rx="25" />
        <rect x={w * 0.4} y={-d * 0.42} width={w * 0.08} height={d * 0.76} rx="25" />
        <line x1={-w * 0.4} y1={d * 0.24} x2={w * 0.4} y2={d * 0.24} />
        {Array.from({ length: seats - 1 }, (_, index) => (
          <line key={index} x1={-w * 0.4 + w * 0.8 * (index + 1) / seats} y1={-d * 0.3} x2={-w * 0.4 + w * 0.8 * (index + 1) / seats} y2={d * 0.22} />
        ))}
      </g>
    );
  }
  if (object.category === "chair" || object.category === "seat") {
    return <g className="lr-plan-symbol"><rect x={-w * 0.34} y={-d * 0.32} width={w * 0.68} height={d * 0.56} rx="55" /><path d={`M ${-w * 0.42} ${d * 0.28} Q 0 ${d * 0.43} ${w * 0.42} ${d * 0.28}`} /></g>;
  }
  if (object.category === "table") {
    return object.parameters.topShape === "round"
      ? <g className="lr-plan-symbol"><ellipse cx="0" cy="0" rx={w * 0.43} ry={d * 0.43} /><circle cx="0" cy="0" r={Math.min(w, d) * 0.08} /></g>
      : <g className="lr-plan-symbol"><rect x={-w * 0.43} y={-d * 0.4} width={w * 0.86} height={d * 0.8} rx="24" /><line x1={-w * 0.35} y1={-d * 0.3} x2={w * 0.35} y2={d * 0.3} /></g>;
  }
  if (object.category === "rug") return <rect className="lr-plan-symbol lr-rug-symbol" x={-w * 0.46} y={-d * 0.44} width={w * 0.92} height={d * 0.88} rx="55" />;
  if (object.category === "floor-lamp") return <g className="lr-plan-symbol"><circle cx="0" cy="0" r={Math.min(w, d) * 0.34} /><circle cx="0" cy="0" r={Math.min(w, d) * 0.12} /><line x1="0" y1="0" x2={w * 0.28} y2={-d * 0.28} /></g>;
  if (object.category === "plant") return <g className="lr-plan-symbol lr-plant-symbol"><circle cx="0" cy="0" r={Math.min(w, d) * 0.2} /><ellipse cx={-w * 0.18} cy={-d * 0.1} rx={w * 0.24} ry={d * 0.12} /><ellipse cx={w * 0.18} cy={d * 0.08} rx={w * 0.24} ry={d * 0.12} transform="rotate(55)" /></g>;
  if (object.category === "storage" || object.category === "media-unit") return <g className="lr-plan-symbol"><rect x={-w * 0.46} y={-d * 0.38} width={w * 0.92} height={d * 0.76} /><line x1={-w * 0.15} y1={-d * 0.38} x2={-w * 0.15} y2={d * 0.38} /><line x1={w * 0.15} y1={-d * 0.38} x2={w * 0.15} y2={d * 0.38} /></g>;
  if (object.category === "mirror") return <g className="lr-plan-symbol"><line x1={-w * 0.45} y1="0" x2={w * 0.45} y2="0" /><line x1={-w * 0.35} y1={-d * 0.35} x2={-w * 0.25} y2={d * 0.35} /><line x1="0" y1={-d * 0.35} x2={w * 0.1} y2={d * 0.35} /></g>;
  return null;
}

function openingPoints(project: InteriorProject, openingId: string) {
  const opening = project.openings.find((item) => item.id === openingId)!;
  const wall = project.walls.find((item) => item.id === opening.wallId)!;
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const ux = dx / length;
  const uz = dz / length;
  const start = {
    x: wall.start.x + ux * opening.offsetMm,
    z: wall.start.z + uz * opening.offsetMm,
  };
  return {
    opening,
    start,
    end: { x: start.x + ux * opening.widthMm, z: start.z + uz * opening.widthMm },
  };
}

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
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
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
          x1={wall.start.x}
          y1={wall.start.z}
          x2={wall.end.x}
          y2={wall.end.z}
          className={`lr-wall-line ${wall.id === activeWallId ? "is-active" : ""}`}
          style={{ stroke: wall.id === activeWallId ? undefined : materials.get(wall.materialId ?? "")?.color }}
          onPointerDown={(event) => { event.stopPropagation(); onSelectWall(wall.id); }}
        />
      ))}
      {project.openings.filter((opening) => opening.extensions?.layerVisible !== false).map((opening) => {
        const points = openingPoints(project, opening.id);
        return (
          <g key={opening.id} className={`lr-opening lr-opening-${opening.kind} ${opening.id === activeOpeningId ? "is-active" : ""}`} onPointerDown={(event) => { event.stopPropagation(); onSelectOpening(opening.id); }}>
            <line x1={points.start.x} y1={points.start.z} x2={points.end.x} y2={points.end.z} />
            <text x={(points.start.x + points.end.x) / 2} y={(points.start.z + points.end.z) / 2 - 85}>
              {opening.kind.toUpperCase()} {opening.widthMm}
            </text>
          </g>
        );
      })}

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
