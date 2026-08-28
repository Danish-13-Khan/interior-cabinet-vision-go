import type { PointerEvent as ReactPointerEvent } from "react";
import type { InteriorObjectEntity, InteriorProject } from "../../domain/interiorProject";
import { formatPlanDimension, primaryMaterialId, type LivingRoomPlanIssue, type PlanDisplayUnit, type PlanSnapGuide } from "../../domain/livingRoom";
import { PlanObjectSymbol } from "./PlanObjectSymbol";
import type { ObjectPreview } from "./usePlanObjectInteraction";

export function PlanObjectsLayer(props: {
  project: InteriorProject; selectedIds: string[]; issues: LivingRoomPlanIssue[];
  preview: ObjectPreview | null; guides: PlanSnapGuide[]; unit: PlanDisplayUnit;
  onStart: (event: ReactPointerEvent<SVGGElement | SVGRectElement>, object: InteriorObjectEntity, mode: "move" | "resize") => void;
}) {
  const issueIds = new Set(props.issues.flatMap((issue) => issue.objectIds));
  const materialsById = new Map(props.project.materials.map((material) => [material.id, material]));
  const objects = props.project.objects.filter((object) => object.extensions?.layerVisible !== false)
    .sort((a, b) => Number(b.category === "rug") - Number(a.category === "rug"));
  return <>
    {objects.map((object) => {
      const active = props.preview?.objectId === object.id ? props.preview : null;
      const position = active?.position ?? object.position;
      const dimensions = active?.dimensions ?? object.dimensions;
      const selected = props.selectedIds.includes(object.id);
      const compact = dimensions.widthMm < 700 || dimensions.depthMm < 200;
      const finish = materialsById.get(primaryMaterialId(object) ?? "");
      const fill = finish?.color ? `${finish.color}99` : undefined;
      return <g key={object.id} transform={`translate(${position.x} ${position.z}) rotate(${object.rotation.y})`}
        className={`lr-plan-object ${selected ? "is-selected" : ""} ${issueIds.has(object.id) ? "has-issue" : ""}`}
        data-object-id={object.id} data-material-id={finish?.id} data-material-color={finish?.color}
        style={fill ? { ["--lr-object-fill" as string]: fill } : undefined}
        onPointerDown={(event) => props.onStart(event, object, "move")}>
        <rect x={-dimensions.widthMm / 2} y={-dimensions.depthMm / 2} width={dimensions.widthMm} height={dimensions.depthMm} rx={object.category === "rug" ? 45 : 12} />
        <PlanObjectSymbol object={object} dimensions={dimensions} />
        <line x1="0" y1="0" x2="0" y2={-dimensions.depthMm / 2 + 70} className="lr-object-axis" />
        {object.category !== "rug" ? <text transform={`rotate(${-object.rotation.y})`} className={`lr-object-label ${compact ? "is-compact" : ""}`}>
          <tspan x="0" y={compact ? -dimensions.depthMm / 2 - 55 : -8}>{object.name}</tspan>
          {!compact ? <tspan x="0" y="68" className="lr-object-size">{formatPlanDimension(dimensions.widthMm, props.unit)} × {formatPlanDimension(dimensions.depthMm, props.unit)}</tspan> : null}
        </text> : null}
        {selected && props.selectedIds.length === 1 ? <rect x={dimensions.widthMm / 2 - 55} y={dimensions.depthMm / 2 - 55} width="110" height="110" className="lr-resize-handle" onPointerDown={(event) => props.onStart(event, object, "resize")} /> : null}
      </g>;
    })}
    {props.guides.map((guide, index) => guide.axis === "x"
      ? <line key={`x-${index}`} x1={guide.valueMm} y1={-10000} x2={guide.valueMm} y2={10000} className={`lr-snap-guide is-${guide.kind}`} />
      : <line key={`z-${index}`} x1={-10000} y1={guide.valueMm} x2={10000} y2={guide.valueMm} className={`lr-snap-guide is-${guide.kind}`} />)}
  </>;
}
