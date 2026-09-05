import type { PointerEvent as ReactPointerEvent } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { readCabinetIdentity } from "../../domain/cabinetIdentity";
import { isCabinetRunFiller } from "../../domain/livingRoom/wardrobePlacement";
import {
  formatPlanDimension,
  primaryMaterialId,
  resolvePlanObjectLabelModes,
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

export function PlanObjectsLayer(props: {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  preview: ObjectPreview | null; guides: PlanSnapGuide[]; unit: PlanDisplayUnit;
  onStart: (event: ReactPointerEvent<SVGGElement | SVGRectElement>, object: InteriorObjectEntity, mode: "move" | "resize") => void;
}) {
  const issueIds = new Set(props.issues.flatMap((issue) => issue.objectIds));
  const materialsById = new Map(props.project.materials.map((material) => [material.id, material]));
  const objects = props.project.objects.filter((object) => object.extensions?.layerVisible !== false)
    .sort((a, b) => Number(b.category === "rug") - Number(a.category === "rug"));
  const labelModes = resolvePlanObjectLabelModes(objects, props.selectedIds);
  return <>
    {objects.map((object) => {
      const active = props.preview?.objectId === object.id ? props.preview : null;
      const position = active?.position ?? object.position;
      const dimensions = active?.dimensions ?? object.dimensions;
      const selected = props.selectedIds.includes(object.id);
      const compact = dimensions.widthMm < 700 || dimensions.depthMm < 200;
      const labelMode = labelModes.get(object.id) ?? (object.category === "rug" ? "hidden" : compact ? "name" : "full");
      const finish = materialsById.get(primaryMaterialId(object) ?? "");
      const fill = finish?.color ? `${finish.color}99` : undefined;
      const identity = readCabinetIdentity(object);
      const labelY = selected || labelMode === "full"
        ? (compact ? -dimensions.depthMm / 2 - 70 : -8)
        : -dimensions.depthMm / 2 - 55;
      return <g key={object.id} transform={`translate(${position.x} ${position.z}) rotate(${object.rotation.y})`}
        className={`lr-plan-object ${selected ? "is-selected" : ""} ${issueIds.has(object.id) ? "has-issue" : ""}`}
        data-object-id={object.id} data-catalog-item-id={object.catalogItemId}
        data-material-id={finish?.id} data-material-color={finish?.color}
        data-wall-id={attachedWallId(object)}
        data-rotation-y={object.rotation.y}
        data-family-id={identity?.familyId}
        data-cabinet-type={isCabinetRunFiller(object) ? "filler" : identity?.cabinetType}
        data-width-mm={dimensions.widthMm}
        data-label-mode={labelMode}
        style={fill ? { ["--lr-object-fill" as string]: fill } : undefined}
        onPointerDown={(event) => props.onStart(event, object, "move")}>
        <rect x={-dimensions.widthMm / 2} y={-dimensions.depthMm / 2} width={dimensions.widthMm} height={dimensions.depthMm} rx={object.category === "rug" ? 45 : 12} />
        <PlanObjectSymbol object={object} dimensions={dimensions} />
        <line x1="0" y1="0" x2="0" y2={-dimensions.depthMm / 2 + 70} className="lr-object-axis" />
        {labelMode !== "hidden" ? <text
          transform={`rotate(${-object.rotation.y})`}
          className={`lr-object-label ${compact || labelMode === "name" ? "is-compact" : ""} ${selected ? "is-selected-label" : ""}`}
          data-testid={`plan-object-label-${object.id}`}
        >
          <tspan x="0" y={labelY}>{object.name}</tspan>
          {labelMode === "full" ? <tspan x="0" y="68" className="lr-object-size">{formatPlanDimension(dimensions.widthMm, props.unit)} × {formatPlanDimension(dimensions.depthMm, props.unit)}</tspan> : null}
        </text> : null}
        {selected && props.selectedIds.length === 1 ? <rect x={dimensions.widthMm / 2 - 55} y={dimensions.depthMm / 2 - 55} width="110" height="110" className="lr-resize-handle" onPointerDown={(event) => props.onStart(event, object, "resize")} /> : null}
        {issueIds.has(object.id) ? (
          <g className="lr-object-warning" data-testid={`cabinet-issue-${object.id}`} transform={`translate(${dimensions.widthMm / 2 - 28} ${-dimensions.depthMm / 2 - 48})`}>
            <circle r="32" />
            <text y="10">!</text>
          </g>
        ) : null}
      </g>;
    })}
    {props.guides.map((guide, index) => guide.axis === "x"
      ? <line key={`x-${index}`} x1={guide.valueMm} y1={-10000} x2={guide.valueMm} y2={10000} className={`lr-snap-guide is-${guide.kind}`} />
      : <line key={`z-${index}`} x1={-10000} y1={guide.valueMm} x2={10000} y2={guide.valueMm} className={`lr-snap-guide is-${guide.kind}`} />)}
  </>;
}
