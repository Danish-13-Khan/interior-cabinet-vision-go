import { useState } from "react";
import { roomPlanViewBounds, selectRoomWalls, type InteriorProject, type InteriorRoomEntity } from "../../domain/interiorProject";
import {
  formatPlanDimension,
  topologyPlanDimensionPair,
  wallLabelPose,
  wallLengthMm,
  wallLengthAnchorLabel,
  DEFAULT_WALL_LENGTH_ANCHOR,
  type PlanReadabilitySettings,
  type ReferenceDimension,
  type WallLengthAnchor,
} from "../../domain/livingRoom";

function HorizontalDimension({ x, y, width, label, role }: {
  x: number; y: number; width: number; label: string; role?: "driving" | "reference";
}) {
  return <g className={role === "reference" ? "is-reference-dim" : "is-driving-dim"} data-dim-role={role ?? "driving"}>
    <line x1={x - width / 2} y1={y} x2={x + width / 2} y2={y} />
    <line x1={x - width / 2} y1={y - 70} x2={x - width / 2} y2={y + 70} />
    <line x1={x + width / 2} y1={y - 70} x2={x + width / 2} y2={y + 70} />
    <text x={x} y={y - 45}>{label}</text>
  </g>;
}

function VerticalDimension({ x, z, depth, label, role }: {
  x: number; z: number; depth: number; label: string; role?: "driving" | "reference";
}) {
  return <g className={role === "reference" ? "is-reference-dim" : "is-driving-dim"} data-dim-role={role ?? "driving"}>
    <line x1={x} y1={z - depth / 2} x2={x} y2={z + depth / 2} />
    <line x1={x - 70} y1={z - depth / 2} x2={x + 70} y2={z - depth / 2} />
    <line x1={x - 70} y1={z + depth / 2} x2={x + 70} y2={z + depth / 2} />
    <text transform={`translate(${x - 45} ${z}) rotate(-90)`}>{label}</text>
  </g>;
}

function ReferenceDimGraphic({ dim, label }: { dim: ReferenceDimension; label: string }) {
  const mx = (dim.a.x + dim.b.x) / 2;
  const mz = (dim.a.z + dim.b.z) / 2;
  return (
    <g className="lr-reference-dim is-reference-dim" data-dim-role="reference" data-testid={`ref-dim-${dim.kind}`}>
      <line x1={dim.a.x} y1={dim.a.z} x2={dim.b.x} y2={dim.b.z} />
      <text x={mx} y={mz - 30}>{label}</text>
    </g>
  );
}

export function PlanDimensionsLayer({ project, room, activeWallId, settings, referenceDims = [], onSetWallLength }: {
  project: InteriorProject; room: InteriorRoomEntity; activeWallId: string | null; settings: PlanReadabilitySettings;
  referenceDims?: ReferenceDimension[];
  onSetWallLength?: (wallId: string, lengthMm: number, anchor: WallLengthAnchor) => void;
}) {
  const pair = topologyPlanDimensionPair(project, room.id);
  const bounds = roomPlanViewBounds(project, room.id);
  const walls = selectRoomWalls(project, room.id);
  const format = (value: number) => formatPlanDimension(value, settings.unit);
  const widthEdge = bounds.maxZ;
  const depthEdge = bounds.minX;
  const [editingWallId, setEditingWallId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const anchor: WallLengthAnchor = DEFAULT_WALL_LENGTH_ANCHOR;

  function beginEdit(wallId: string, length: number) {
    if (!onSetWallLength) return;
    setEditingWallId(wallId);
    setDraft(String(Math.round(length)));
  }

  function commitEdit() {
    if (!editingWallId || !onSetWallLength) {
      setEditingWallId(null);
      return;
    }
    const value = Number(draft.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(value) && value > 0) {
      onSetWallLength(editingWallId, value, anchor);
    }
    setEditingWallId(null);
  }

  return <>
    <g className="lr-plan-dimension-pairs" aria-label="Room dimension pairs" pointerEvents="none">
      <HorizontalDimension x={bounds.centerX} y={widthEdge + 250} width={pair.innerWidthMm} label={`Clear ${format(pair.innerWidthMm)}`} role="driving" />
      <HorizontalDimension x={bounds.centerX} y={widthEdge + 500} width={pair.outerWidthMm} label={`Overall ${format(pair.outerWidthMm)}`} role="driving" />
      <VerticalDimension x={depthEdge - 250} z={bounds.centerZ} depth={pair.innerDepthMm} label={`Clear ${format(pair.innerDepthMm)}`} role="driving" />
      <VerticalDimension x={depthEdge - 500} z={bounds.centerZ} depth={pair.outerDepthMm} label={`Overall ${format(pair.outerDepthMm)}`} role="driving" />
    </g>
    <g className="lr-wall-length-labels">
      {walls.filter((wall) => wall.visible && (settings.alwaysShowWallLengths || wall.id === activeWallId)).map((wall) => {
        const pose = wallLabelPose(wall);
        const length = wallLengthMm(wall);
        const editing = editingWallId === wall.id;
        return (
          <g key={wall.id} transform={`translate(${pose.x} ${pose.z}) rotate(${pose.angle})`} data-wall-length-id={wall.id}>
            {editing ? (
              <foreignObject x={-180} y={-90} width={360} height={140}>
                <div className="lr-typed-dim-editor" data-testid="typed-wall-dim-editor">
                  <input
                    autoFocus
                    value={draft}
                    aria-label="Wall length mm"
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitEdit();
                      if (event.key === "Escape") setEditingWallId(null);
                    }}
                  />
                  <small>{wallLengthAnchorLabel(anchor)}</small>
                </div>
              </foreignObject>
            ) : (
              <text
                className="is-driving-dim lr-wall-length-editable"
                data-dim-role="driving"
                data-testid={`wall-length-${wall.id}`}
                style={{ cursor: onSetWallLength ? "text" : "default" }}
                onClick={(event) => {
                  event.stopPropagation();
                  beginEdit(wall.id, length);
                }}
              >
                {format(length)}
              </text>
            )}
          </g>
        );
      })}
    </g>
    <g className="lr-reference-dimensions" pointerEvents="none" aria-label="Reference dimensions">
      {referenceDims.slice(0, 8).map((dim) => (
        <ReferenceDimGraphic key={dim.id} dim={dim} label={`Ref ${format(dim.lengthMm)}`} />
      ))}
    </g>
  </>;
}
