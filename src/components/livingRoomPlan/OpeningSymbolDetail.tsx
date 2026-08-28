import type { OpeningCatalogSymbol } from "../../domain/livingRoom";

type Point = { x: number; z: number };

export function OpeningSymbolDetail({ symbol, start, end, nx, nz, widthMm }: {
  symbol: OpeningCatalogSymbol; start: Point; end: Point; nx: number; nz: number; widthMm: number;
}) {
  const detail = (from: Point, to: Point) => <line className="lr-opening-symbol-detail" x1={from.x} y1={from.z} x2={to.x} y2={to.z} />;
  const rail = () => detail({ x: start.x + nx * 45, z: start.z + nz * 45 }, { x: end.x + nx * 45, z: end.z + nz * 45 });
  const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2 };
  if (symbol === "single-swing") return detail(start, { x: start.x + nx * widthMm, z: start.z + nz * widthMm });
  if (symbol === "double-swing") return <>{detail(start, { x: start.x + nx * widthMm / 2, z: start.z + nz * widthMm / 2 })}{detail(end, { x: end.x + nx * widthMm / 2, z: end.z + nz * widthMm / 2 })}</>;
  if (symbol === "casement") return <>{detail(start, { x: start.x + nx * widthMm * .7, z: start.z + nz * widthMm * .7 })}{detail({ x: start.x + nx * 35, z: start.z + nz * 35 }, { x: end.x + nx * 35, z: end.z + nz * 35 })}</>;
  if (symbol === "sliding") return <>{rail()}{detail(midpoint, { x: midpoint.x + nx * 70, z: midpoint.z + nz * 70 })}</>;
  if (symbol === "pocket") return <>{rail()}{detail(end, { x: end.x + nx * 110, z: end.z + nz * 110 })}</>;
  if (symbol === "awning") return <>{rail()}{detail(midpoint, { x: midpoint.x + nx * 105, z: midpoint.z + nz * 105 })}</>;
  if (symbol === "picture-window") return <>{rail()}{detail({ x: midpoint.x, z: midpoint.z - 38 }, { x: midpoint.x, z: midpoint.z + 38 })}</>;
  return rail();
}
