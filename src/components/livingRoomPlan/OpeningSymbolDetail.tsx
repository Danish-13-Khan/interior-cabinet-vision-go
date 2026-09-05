import type { OpeningCatalogSymbol } from "../../domain/livingRoom";

type Point = { x: number; z: number };

function arcPath(from: Point, to: Point, radius: number, sweep: 0 | 1) {
  return `M ${from.x} ${from.z} A ${radius} ${radius} 0 0 ${sweep} ${to.x} ${to.z}`;
}

export function OpeningSymbolDetail({ symbol, start, end, nx, nz, widthMm }: {
  symbol: OpeningCatalogSymbol; start: Point; end: Point; nx: number; nz: number; widthMm: number;
}) {
  const detail = (from: Point, to: Point) => <line className="lr-opening-symbol-detail" x1={from.x} y1={from.z} x2={to.x} y2={to.z} />;
  const rail = (offset = 45) => detail(
    { x: start.x + nx * offset, z: start.z + nz * offset },
    { x: end.x + nx * offset, z: end.z + nz * offset },
  );
  const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };

  if (symbol === "single-swing") {
    const open = { x: start.x + nx * widthMm, z: start.z + nz * widthMm };
    return (
      <g className="lr-opening-swing">
        <line className="lr-opening-symbol-detail lr-opening-leaf" x1={start.x} y1={start.z} x2={open.x} y2={open.z} />
        <path
          className="lr-opening-swing-arc"
          d={arcPath(end, open, widthMm, 1)}
          fill="none"
        />
      </g>
    );
  }

  if (symbol === "double-swing") {
    const half = widthMm / 2;
    const openStart = { x: start.x + nx * half, z: start.z + nz * half };
    const openEnd = { x: end.x + nx * half, z: end.z + nz * half };
    const mid = midpoint;
    return (
      <g className="lr-opening-swing is-double">
        <line className="lr-opening-symbol-detail lr-opening-leaf" x1={start.x} y1={start.z} x2={openStart.x} y2={openStart.z} />
        <line className="lr-opening-symbol-detail lr-opening-leaf" x1={end.x} y1={end.z} x2={openEnd.x} y2={openEnd.z} />
        <path className="lr-opening-swing-arc" d={arcPath(mid, openStart, half, 1)} fill="none" />
        <path className="lr-opening-swing-arc" d={arcPath(mid, openEnd, half, 0)} fill="none" />
      </g>
    );
  }

  if (symbol === "casement") {
    return (
      <g className="lr-opening-window-symbol">
        {detail(start, { x: start.x + nx * widthMm * 0.7, z: start.z + nz * widthMm * 0.7 })}
        {rail(35)}
        {rail(70)}
      </g>
    );
  }

  if (symbol === "sliding") {
    return <>{rail()}{detail(midpoint, { x: midpoint.x + nx * 70, z: midpoint.z + nz * 70 })}</>;
  }
  if (symbol === "pocket") {
    return <>{rail()}{detail(end, { x: end.x + nx * 110, z: end.z + nz * 110 })}</>;
  }
  if (symbol === "awning") {
    return <>{rail()}{detail(midpoint, { x: midpoint.x + nx * 105, z: midpoint.z + nz * 105 })}</>;
  }
  if (symbol === "picture-window") {
    return (
      <g className="lr-opening-window-symbol">
        {rail(28)}
        {rail(62)}
        <line
          className="lr-opening-glass-hatch"
          x1={midpoint.x - nz * 55}
          y1={midpoint.z + nx * 55}
          x2={midpoint.x + nz * 55}
          y2={midpoint.z - nx * 55}
        />
      </g>
    );
  }

  // Default fixed / generic window — double rail for readability
  return (
    <g className="lr-opening-window-symbol">
      {rail(30)}
      {rail(65)}
    </g>
  );
}
