import type { PointerEvent as ReactPointerEvent } from "react";
import type { OpeningEntity, WallEntity } from "../../domain/interiorProject";
import {
  getOpeningCatalogItem,
  formatPlanDimension,
  type PlanDisplayUnit,
  type OpeningCatalogSymbol,
} from "../../domain/livingRoom";

type OpeningPreview = { id: string; offsetMm: number; widthMm: number };

function OpeningSymbolDetail({
  symbol,
  start,
  end,
  nx,
  nz,
  widthMm,
}: {
  symbol: OpeningCatalogSymbol;
  start: { x: number; z: number };
  end: { x: number; z: number };
  nx: number;
  nz: number;
  widthMm: number;
}) {
  if (symbol === "fixed-glass") {
    return (
      <line
        className="lr-opening-symbol-detail"
        x1={start.x + nx * 45}
        y1={start.z + nz * 45}
        x2={end.x + nx * 45}
        y2={end.z + nz * 45}
      />
    );
  }
  if (symbol === "casement") {
    return (
      <>
        <line
          className="lr-opening-symbol-detail"
          x1={start.x}
          y1={start.z}
          x2={start.x + nx * widthMm * 0.7}
          y2={start.z + nz * widthMm * 0.7}
        />
        <line
          className="lr-opening-symbol-detail"
          x1={start.x + nx * 35}
          y1={start.z + nz * 35}
          x2={end.x + nx * 35}
          y2={end.z + nz * 35}
        />
      </>
    );
  }
  if (symbol === "single-swing") {
    return (
      <line
        className="lr-opening-symbol-detail"
        x1={start.x}
        y1={start.z}
        x2={start.x + nx * widthMm}
        y2={start.z + nz * widthMm}
      />
    );
  }
  if (symbol === "double-swing") {
    return (
      <>
        <line
          className="lr-opening-symbol-detail"
          x1={start.x}
          y1={start.z}
          x2={start.x + (nx * widthMm) / 2}
          y2={start.z + (nz * widthMm) / 2}
        />
        <line
          className="lr-opening-symbol-detail"
          x1={end.x}
          y1={end.z}
          x2={end.x + (nx * widthMm) / 2}
          y2={end.z + (nz * widthMm) / 2}
        />
      </>
    );
  }
  return null;
}

export function PlanOpeningGroup({
  opening,
  wall,
  preview,
  active,
  onSelect,
  onStartDrag,
  unit,
}: {
  opening: OpeningEntity;
  wall: WallEntity;
  preview: OpeningPreview | null;
  active: boolean;
  onSelect: (openingId: string) => void;
  onStartDrag: (
    event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
    openingId: string,
    mode: "move" | "resize-start" | "resize-end",
  ) => void;
  unit: PlanDisplayUnit;
}) {
  const displayed = preview?.id === opening.id
    ? { ...opening, offsetMm: preview.offsetMm, widthMm: preview.widthMm }
    : opening;
  const length = Math.max(1, Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z));
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz;
  const nz = ux;
  const start = {
    x: wall.start.x + ux * displayed.offsetMm,
    z: wall.start.z + uz * displayed.offsetMm,
  };
  const end = {
    x: start.x + ux * displayed.widthMm,
    z: start.z + uz * displayed.widthMm,
  };
  const catalog = getOpeningCatalogItem(displayed.catalogItemId);
  const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };

  return (
    <g
      key={opening.id}
      data-opening-id={opening.id}
      data-offset-mm={displayed.offsetMm}
      data-width-mm={displayed.widthMm}
      data-catalog-item={catalog.catalogItemId}
      className={`lr-opening lr-opening-${opening.kind} ${active ? "is-active" : ""}`}
      onPointerDown={(event) => onStartDrag(event, opening.id, "move")}
    >
      <line x1={start.x} y1={start.z} x2={end.x} y2={end.z} />
      <OpeningSymbolDetail
        symbol={catalog.symbol}
        start={start}
        end={end}
        nx={nx}
        nz={nz}
        widthMm={displayed.widthMm}
      />
      <text x={midpoint.x} y={midpoint.z - 85}>
        {catalog.name.toUpperCase()} {formatPlanDimension(displayed.widthMm, unit)}
      </text>
      {active ? (
        <>
          <circle
            className="lr-opening-width-handle lr-opening-width-handle-start"
            cx={start.x}
            cy={start.z}
            r="70"
            onPointerDown={(event) => {
              event.stopPropagation();
              onSelect(opening.id);
              onStartDrag(event, opening.id, "resize-start");
            }}
          />
          <circle
            className="lr-opening-width-handle lr-opening-width-handle-end"
            cx={end.x}
            cy={end.z}
            r="70"
            onPointerDown={(event) => {
              event.stopPropagation();
              onSelect(opening.id);
              onStartDrag(event, opening.id, "resize-end");
            }}
          />
        </>
      ) : null}
    </g>
  );
}
