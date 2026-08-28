import type { PointerEvent as ReactPointerEvent } from "react";
import type { OpeningEntity, WallEntity } from "../../domain/interiorProject";
import { formatPlanDimension, getOpeningCatalogItem, type PlanDisplayUnit } from "../../domain/livingRoom";
import { OpeningSymbolDetail } from "./OpeningSymbolDetail";

type OpeningPreview = { id: string; offsetMm: number; widthMm: number };

export function PlanOpeningGroup({ opening, wall, preview, active, onSelect, onStartDrag, unit }: {
  opening: OpeningEntity; wall: WallEntity; preview: OpeningPreview | null; active: boolean;
  onSelect: (openingId: string) => void;
  onStartDrag: (event: ReactPointerEvent<SVGGElement | SVGCircleElement>, openingId: string, mode: "move" | "resize-start" | "resize-end") => void;
  unit: PlanDisplayUnit;
}) {
  const displayed = preview?.id === opening.id ? { ...opening, offsetMm: preview.offsetMm, widthMm: preview.widthMm } : opening;
  const length = Math.max(1, Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z));
  const ux = (wall.end.x - wall.start.x) / length; const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz; const nz = ux;
  const start = { x: wall.start.x + ux * displayed.offsetMm, z: wall.start.z + uz * displayed.offsetMm };
  const end = { x: start.x + ux * displayed.widthMm, z: start.z + uz * displayed.widthMm };
  const catalog = getOpeningCatalogItem(displayed.catalogItemId);
  const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };
  const resizeHandle = (mode: "resize-start" | "resize-end", point: typeof start) => <circle
    className={`lr-opening-width-handle lr-opening-width-handle-${mode === "resize-start" ? "start" : "end"}`}
    cx={point.x} cy={point.z} r="70" onPointerDown={(event) => { event.stopPropagation(); onSelect(opening.id); onStartDrag(event, opening.id, mode); }} />;
  return <g data-opening-id={opening.id} data-offset-mm={displayed.offsetMm} data-width-mm={displayed.widthMm}
    data-catalog-item={catalog.catalogItemId} className={`lr-opening lr-opening-${opening.kind} ${active ? "is-active" : ""}`}
    onPointerDown={(event) => onStartDrag(event, opening.id, "move")}>
    <line x1={start.x} y1={start.z} x2={end.x} y2={end.z} />
    <OpeningSymbolDetail symbol={catalog.symbol} start={start} end={end} nx={nx} nz={nz} widthMm={displayed.widthMm} />
    <text x={midpoint.x} y={midpoint.z - 85}>{catalog.name.toUpperCase()} {formatPlanDimension(displayed.widthMm, unit)}</text>
    {active ? <>{resizeHandle("resize-start", start)}{resizeHandle("resize-end", end)}</> : null}
  </g>;
}
