import { useEffect, useState, type FocusEvent as ReactFocusEvent, type PointerEvent as ReactPointerEvent } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { readCabinetIdentity } from "../../domain/cabinetIdentity";
import { isCabinetRunFiller } from "../../domain/livingRoom/wardrobePlacement";
import {
  cabinetRunForObject,
  formatCabinetInlineDims,
  formatPlanDimension,
  formatPlanMark,
  planObjectFootprintClass,
  planObjectFootprintKind,
  primaryMaterialId,
  readPlanMarksSettings,
  resolvePlanObjectLabelModes,
  type FreeWallSegment,
  type LivingRoomPlanIssue,
  type PlanDisplayUnit,
  type PlanSnapGuide,
} from "../../domain/livingRoom";
import { PlanObjectSymbol } from "./PlanObjectSymbol";
import type { ObjectPreview } from "./usePlanObjectInteraction";

function attachedWallId(object: InteriorObjectEntity) {
  const value = object.extensions?.wallAttachment;
  if (!value || typeof value !== "object") return undefined;
  const wallId = (value as { wallId?: unknown }).wallId;
  return typeof wallId === "string" ? wallId : undefined;
}

function runIdFor(object: InteriorObjectEntity): string | null {
  const run = cabinetRunForObject(object);
  if (run) return run.runId;
  const filler = object.extensions?.cabinetRunFiller;
  if (filler && typeof filler === "object" && typeof (filler as { runId?: unknown }).runId === "string") {
    return (filler as { runId: string }).runId;
  }
  return null;
}

export function PlanObjectsLayer(props: {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  preview: ObjectPreview | null; guides: PlanSnapGuide[]; unit: PlanDisplayUnit;
  selectedRunId?: string | null;
  freeSegments?: FreeWallSegment[];
  freeSegmentWallPose?: { x1: number; z1: number; x2: number; z2: number; lengthMm: number } | null;
  onStart: (event: ReactPointerEvent<SVGGElement | SVGRectElement>, object: InteriorObjectEntity, mode: "move" | "resize") => void;
  onSetCabinetDims?: (objectId: string, dims: { widthMm?: number; depthMm?: number }) => void;
  /** When false (e.g. measure tool), skip pointer drag handlers so measure can receive clicks. */
  interactive?: boolean;
}) {
  const interactive = props.interactive !== false;
  const issueIds = new Set(props.issues.flatMap((issue) => issue.objectIds));
  const materialsById = new Map(props.project.materials.map((material) => [material.id, material]));
  const objects = props.project.objects.filter((object) => object.extensions?.layerVisible !== false)
    .sort((a, b) => Number(b.category === "rug") - Number(a.category === "rug"));
  const labelModes = resolvePlanObjectLabelModes(objects, props.selectedIds);
  const planMarks = readPlanMarksSettings(props.project);
  const selectedRunId = props.selectedRunId ?? null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftWidth, setDraftWidth] = useState("");
  const [draftDepth, setDraftDepth] = useState("");

  function beginDimEdit(object: InteriorObjectEntity, dimensions: { widthMm: number; depthMm: number }) {
    if (!props.onSetCabinetDims || (object.kind !== "cabinet" && object.category !== "filler")) return;
    setEditingId(object.id);
    setDraftWidth(String(Math.round(dimensions.widthMm)));
    setDraftDepth(String(Math.round(dimensions.depthMm)));
  }

  function commitDimEdit() {
    if (!editingId || !props.onSetCabinetDims) {
      setEditingId(null);
      return;
    }
    const widthMm = Number(draftWidth.replace(/[^0-9.]/g, ""));
    const depthMm = Number(draftDepth.replace(/[^0-9.]/g, ""));
    const patch: { widthMm?: number; depthMm?: number } = {};
    if (Number.isFinite(widthMm) && widthMm > 0) patch.widthMm = widthMm;
    if (Number.isFinite(depthMm) && depthMm > 0) patch.depthMm = depthMm;
    if (Object.keys(patch).length) props.onSetCabinetDims(editingId, patch);
    setEditingId(null);
  }

  function onEditorBlur(event: ReactFocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    commitDimEdit();
  }

  useEffect(() => {
    if (!editingId) return;
    if (!props.selectedIds.includes(editingId)) {
      commitDimEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commit when selection leaves the edited object
  }, [props.selectedIds, editingId]);

  return <>
    {props.freeSegments && props.freeSegmentWallPose && props.freeSegments.length > 0 ? (
      <g className="lr-free-wall-segments" pointerEvents="none" data-testid="lr-free-wall-segments">
        {props.freeSegments.map((segment, index) => {
          const pose = props.freeSegmentWallPose!;
          const t0 = pose.lengthMm ? segment.startMm / pose.lengthMm : 0;
          const t1 = pose.lengthMm ? segment.endMm / pose.lengthMm : 0;
          const x1 = pose.x1 + (pose.x2 - pose.x1) * t0;
          const z1 = pose.z1 + (pose.z2 - pose.z1) * t0;
          const x2 = pose.x1 + (pose.x2 - pose.x1) * t1;
          const z2 = pose.z1 + (pose.z2 - pose.z1) * t1;
          return (
            <line
              key={`free-${index}`}
              x1={x1} y1={z1} x2={x2} y2={z2}
              className="lr-free-wall-segment"
            />
          );
        })}
      </g>
    ) : null}
    {objects.map((object) => {
      const active = props.preview?.objectId === object.id ? props.preview : null;
      const position = active?.position ?? object.position;
      const dimensions = active?.dimensions ?? object.dimensions;
      const rotationY = active?.rotationY ?? object.rotation.y;
      const selected = props.selectedIds.includes(object.id);
      const compact = dimensions.widthMm < 700 || dimensions.depthMm < 200;
      const labelMode = labelModes.get(object.id) ?? (object.category === "rug" ? "hidden" : compact ? "name" : "full");
      const finish = materialsById.get(primaryMaterialId(object) ?? "");
      const fill = finish?.color ? `${finish.color}99` : undefined;
      const identity = readCabinetIdentity(object);
      const labelY = selected || labelMode === "full"
        ? (compact ? -dimensions.depthMm / 2 - 70 : -8)
        : -dimensions.depthMm / 2 - 55;
      const footprintKind = planObjectFootprintKind(object);
      const footprintClass = planObjectFootprintClass(object);
      const objectRunId = runIdFor(object);
      const hierarchyClass = selectedRunId && object.kind === "cabinet"
        ? (objectRunId === selectedRunId ? "is-active-run" : "is-dimmed-run")
        : "";
      const mark = planMarks.enabled ? formatPlanMark(object) : null;
      const audience = planMarks.audience ?? "sales";
      const showInlineDims = object.kind === "cabinet" || object.category === "filler";
      const inlineDims = formatCabinetInlineDims(dimensions.widthMm, dimensions.depthMm);
      const showName = !planMarks.enabled || audience === "sales";
      const showSize = planMarks.enabled
        ? audience === "technical"
        : labelMode === "full";
      const editing = editingId === object.id;
      return <g key={object.id} transform={`translate(${position.x} ${position.z}) rotate(${rotationY})`}
        className={`lr-plan-object ${selected ? "is-selected" : ""} ${issueIds.has(object.id) ? "has-issue" : ""} ${footprintClass} ${hierarchyClass}`.trim()}
        data-object-id={object.id} data-catalog-item-id={object.catalogItemId}
        data-material-id={finish?.id} data-material-color={finish?.color}
        data-wall-id={attachedWallId(object)}
        data-rotation-y={rotationY}
        data-family-id={identity?.familyId}
        data-cabinet-type={isCabinetRunFiller(object) ? "filler" : identity?.cabinetType}
        data-footprint={footprintKind ?? undefined}
        data-width-mm={dimensions.widthMm}
        data-label-mode={labelMode}
        data-run-id={objectRunId ?? undefined}
        style={fill ? { ["--lr-object-fill" as string]: fill } : undefined}
        onPointerDown={interactive ? (event) => props.onStart(event, object, "move") : undefined}>
        <rect x={-dimensions.widthMm / 2} y={-dimensions.depthMm / 2} width={dimensions.widthMm} height={dimensions.depthMm} rx={object.category === "rug" ? 45 : 12} />
        <PlanObjectSymbol object={object} dimensions={dimensions} />
        <line x1="0" y1="0" x2="0" y2={-dimensions.depthMm / 2 + 70} className="lr-object-axis" />
        {labelMode !== "hidden" || planMarks.enabled ? <text
          transform={`rotate(${-rotationY})`}
          className={`lr-object-label ${compact || labelMode === "name" ? "is-compact" : ""} ${selected ? "is-selected-label" : ""}`}
          data-testid={`plan-object-label-${object.id}`}
        >
          {planMarks.enabled && mark ? (
            <tspan x="0" y={labelY} className="lr-plan-mark" data-testid={`plan-mark-${object.id}`}>{mark}</tspan>
          ) : null}
          {showName && labelMode !== "hidden" ? (
            <tspan x="0" y={planMarks.enabled ? labelY + 70 : labelY}>{object.name}</tspan>
          ) : null}
          {showSize && showInlineDims ? (
            editing ? null : (
              <tspan
                x="0"
                y="68"
                className="lr-object-size lr-object-size-editable"
                data-testid={`cabinet-inline-dim-${object.id}`}
                style={{ cursor: props.onSetCabinetDims ? "text" : "default" }}
                onPointerDown={(event) => {
                  if (!props.onSetCabinetDims) return;
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  beginDimEdit(object, dimensions);
                }}
              >
                {inlineDims}
              </tspan>
            )
          ) : showSize && !showInlineDims && labelMode === "full" ? (
            <tspan x="0" y="68" className="lr-object-size">{formatPlanDimension(dimensions.widthMm, props.unit)} × {formatPlanDimension(dimensions.depthMm, props.unit)}</tspan>
          ) : null}
        </text> : null}
        {editing ? (
          <foreignObject x={-200} y={20} width={400} height={160}>
            <div
              className="lr-typed-dim-editor"
              data-testid="cabinet-inline-dim-editor"
              onBlur={onEditorBlur}
            >
              <input
                autoFocus
                aria-label="Cabinet width mm"
                value={draftWidth}
                onChange={(event) => setDraftWidth(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitDimEdit();
                  if (event.key === "Escape") setEditingId(null);
                }}
              />
              <input
                aria-label="Cabinet depth mm"
                value={draftDepth}
                onChange={(event) => setDraftDepth(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitDimEdit();
                  if (event.key === "Escape") setEditingId(null);
                }}
              />
            </div>
          </foreignObject>
        ) : null}
        {selected && props.selectedIds.length === 1 ? <rect x={dimensions.widthMm / 2 - 55} y={dimensions.depthMm / 2 - 55} width="110" height="110" className="lr-resize-handle" onPointerDown={interactive ? (event) => props.onStart(event, object, "resize") : undefined} /> : null}
        {issueIds.has(object.id) ? (
          <g className="lr-object-warning" data-testid={`cabinet-issue-${object.id}`} transform={`translate(${dimensions.widthMm / 2 - 28} ${-dimensions.depthMm / 2 - 48})`}>
            <circle r="32" />
            <text y="10">!</text>
          </g>
        ) : null}
      </g>;
    })}
    {props.guides.map((guide, index) => (
      <g key={`${guide.axis}-${index}`} className={`lr-snap-guide-group is-${guide.kind}`} data-snap-kind={guide.kind} data-snap-label={guide.label ?? guide.kind}>
        {guide.axis === "x"
          ? <line x1={guide.valueMm} y1={-10000} x2={guide.valueMm} y2={10000} className={`lr-snap-guide is-${guide.kind}`} />
          : <line x1={-10000} y1={guide.valueMm} x2={10000} y2={guide.valueMm} className={`lr-snap-guide is-${guide.kind}`} />}
        {guide.label ? (
          <text
            className={`lr-snap-guide-label is-${guide.kind}`}
            x={guide.axis === "x" ? guide.valueMm + 40 : 0}
            y={guide.axis === "z" ? guide.valueMm - 40 : 0}
          >
            {guide.label}
          </text>
        ) : null}
      </g>
    ))}
  </>;
}
