import { SCALE } from "./constants";
import { dimLabelGap } from "./dimLayout";
import type { DimKind, DimRenderOptions } from "./dimGraphicsTypes";
import {
  dimArrow,
  dimClass,
  dimEndTick,
  dimGrip,
  dimHitAttrs,
  dimLabelText,
  labelBandWidth,
  witnessToEdge,
} from "./dimMarks";
import { line } from "./svgPrimitives";

export type { DimKind, DimRenderOptions } from "./dimGraphicsTypes";

export function dimTick(
  x: number,
  y: number,
  horizontal: boolean,
  kind: DimKind = "chain",
  opts?: DimRenderOptions,
) {
  return dimEndTick(x, y, horizontal, kind, opts);
}

function splitHorizontalDimLine(
  x0: number,
  x1: number,
  y: number,
  label: string,
  kind: DimKind,
  opts?: DimRenderOptions,
) {
  const mid = (x0 + x1) / 2;
  const gap = labelBandWidth(`${label} mm`) / 2;
  const leftEnd = mid - gap;
  const rightStart = mid + gap;
  const elements: string[] = [];
  if (leftEnd > x0 + 2) {
    elements.push(line(x0, y, leftEnd, y, dimHitAttrs(kind, opts, "ns-resize")));
  }
  if (x1 > rightStart + 2) {
    elements.push(line(rightStart, y, x1, y, dimHitAttrs(kind, opts, "ns-resize")));
  }
  if (elements.length === 0) {
    elements.push(line(x0, y, x1, y, dimHitAttrs(kind, opts, "ns-resize")));
  }
  return elements;
}

function splitVerticalDimLine(
  y0: number,
  y1: number,
  x: number,
  label: string,
  kind: DimKind,
  opts?: DimRenderOptions,
) {
  const gap = labelBandWidth(`${label} mm`) / 2;
  const topEnd = Math.min(y0, y1) + gap;
  const bottomStart = Math.max(y0, y1) - gap;
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  const elements: string[] = [];
  if (topEnd > lo + 2) {
    elements.push(line(x, lo, x, topEnd, dimHitAttrs(kind, opts, "ew-resize")));
  }
  if (hi > bottomStart + 2) {
    elements.push(line(x, bottomStart, x, hi, dimHitAttrs(kind, opts, "ew-resize")));
  }
  if (elements.length === 0) {
    elements.push(line(x, y0, x, y1, dimHitAttrs(kind, opts, "ew-resize")));
  }
  return elements;
}

function hitLane(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  kind: DimKind,
  opts: DimRenderOptions | undefined,
  cursor: "ns-resize" | "ew-resize",
) {
  if (!opts?.dimId) return [];
  return [
    line(
      x0,
      y0,
      x1,
      y1,
      `${dimHitAttrs(kind, opts, cursor, "twod-dim-hit")} stroke-width="12" opacity="0"`,
    ),
  ];
}

export function dimensionChainHorizontal(
  positionsMm: number[],
  labels: string[],
  ox: number,
  y: number,
  kind: DimKind = "chain",
  geometryEdgeY?: number,
  opts?: DimRenderOptions,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const dimY = y + (opts?.dy ?? 0);
  const x0 = ox + positionsMm[0]! / SCALE + (opts?.dx ?? 0);
  const x1 = ox + positionsMm[positionsMm.length - 1]! / SCALE + (opts?.dx ?? 0);
  const edgeY = (geometryEdgeY ?? y - 8) + (opts?.dy ?? 0);

  elements.push(
    ...splitHorizontalDimLine(x0, x1, dimY, labels.join("+") || "0", kind, opts),
  );
  elements.push(...hitLane(x0, dimY, x1, dimY, kind, opts, "ns-resize"));
  elements.push(dimGrip((x0 + x1) / 2, dimY, kind, opts));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const x = ox + positionsMm[index]! / SCALE + (opts?.dx ?? 0);
    elements.push(witnessToEdge(x, dimY, edgeY, true, kind, opts));
    elements.push(dimEndTick(x, dimY, true, kind, opts));
    if (index === 0) {
      elements.push(dimArrow(x, dimY, true, true, kind, opts));
    }
    if (index === positionsMm.length - 1) {
      elements.push(dimArrow(x, dimY, true, false, kind, opts));
    }
    if (index < labels.length) {
      const mid =
        ox +
        (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE +
        (opts?.dx ?? 0);
      elements.push(
        dimLabelText(
          mid,
          dimY - dimLabelGap(),
          labels[index]!,
          kind,
          `font-size="7" text-anchor="middle" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

/** positionsMm measured from floor upward */
export function dimensionChainVertical(
  positionsMm: number[],
  labels: string[],
  x: number,
  oy: number,
  roomHeightMm: number,
  kind: DimKind = "chain",
  geometryEdgeX?: number,
  opts?: DimRenderOptions,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const dimX = x + (opts?.dx ?? 0);
  const floorY = oy + roomHeightMm / SCALE / 2 + (opts?.dy ?? 0);
  const toSvgY = (mmFromFloor: number) => floorY - mmFromFloor / SCALE;
  const y0 = toSvgY(positionsMm[0]!);
  const y1 = toSvgY(positionsMm[positionsMm.length - 1]!);
  const edgeX = (geometryEdgeX ?? x - 8) + (opts?.dx ?? 0);

  elements.push(
    ...splitVerticalDimLine(y0, y1, dimX, labels.join("+") || "0", kind, opts),
  );
  elements.push(...hitLane(dimX, y0, dimX, y1, kind, opts, "ew-resize"));
  elements.push(dimGrip(dimX, (y0 + y1) / 2, kind, opts));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const y = toSvgY(positionsMm[index]!);
    elements.push(witnessToEdge(y, dimX, edgeX, false, kind, opts));
    elements.push(dimEndTick(dimX, y, false, kind, opts));
    if (index === 0) {
      elements.push(dimArrow(dimX, y, false, positionsMm[0]! < positionsMm.at(-1)!, kind, opts));
    }
    if (index === positionsMm.length - 1) {
      elements.push(dimArrow(dimX, y, false, positionsMm[0]! > positionsMm.at(-1)!, kind, opts));
    }
    if (index < labels.length) {
      const mid =
        (toSvgY(positionsMm[index]!) + toSvgY(positionsMm[index + 1]!)) / 2;
      elements.push(
        dimLabelText(
          dimX - dimLabelGap(),
          mid + 2.5,
          labels[index]!,
          kind,
          `font-size="7" text-anchor="end" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

/** Vertical chain in plan depth space (z mm → SVG y via oy + z/SCALE). */
export function dimensionChainPlanDepth(
  positionsMm: number[],
  labels: string[],
  chainX: number,
  oy: number,
  kind: DimKind = "chain",
  geometryEdgeX?: number,
  opts?: DimRenderOptions,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;
  const dimX = chainX + (opts?.dx ?? 0);
  const z0 = oy + positionsMm[0]! / SCALE + (opts?.dy ?? 0);
  const z1 = oy + positionsMm[positionsMm.length - 1]! / SCALE + (opts?.dy ?? 0);
  const edgeX = (geometryEdgeX ?? chainX - 8) + (opts?.dx ?? 0);
  elements.push(
    ...splitVerticalDimLine(z0, z1, dimX, labels.join("+") || "0", kind, opts),
  );
  elements.push(...hitLane(dimX, z0, dimX, z1, kind, opts, "ew-resize"));
  elements.push(dimGrip(dimX, (z0 + z1) / 2, kind, opts));
  for (let index = 0; index < positionsMm.length; index += 1) {
    const z = oy + positionsMm[index]! / SCALE + (opts?.dy ?? 0);
    elements.push(witnessToEdge(z, dimX, edgeX, false, kind, opts));
    elements.push(dimEndTick(dimX, z, false, kind, opts));
    if (index === 0) elements.push(dimArrow(dimX, z, false, true, kind, opts));
    if (index === positionsMm.length - 1) {
      elements.push(dimArrow(dimX, z, false, false, kind, opts));
    }
    if (index < labels.length) {
      const mid =
        oy +
        (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE +
        (opts?.dy ?? 0);
      elements.push(
        dimLabelText(
          dimX + dimLabelGap(),
          mid + 2.5,
          labels[index]!,
          kind,
          `font-size="6.5" text-anchor="start" pointer-events="none"`,
        ),
      );
    }
  }
  return elements;
}

/** Single overall span with witnesses, arrows, and grip. */
export function overallSpanHorizontal(
  x0: number,
  x1: number,
  dimY: number,
  labelMm: string,
  edgeY: number,
  kind: DimKind = "overall",
  opts?: DimRenderOptions,
) {
  const y = dimY + (opts?.dy ?? 0);
  const dx = opts?.dx ?? 0;
  const a = x0 + dx;
  const b = x1 + dx;
  const edge = edgeY + (opts?.dy ?? 0);
  const labelAbove = y <= edge;
  return [
    ...splitHorizontalDimLine(a, b, y, labelMm, kind, opts),
    ...hitLane(a, y, b, y, kind, opts, "ns-resize"),
    dimGrip((a + b) / 2, y, kind, opts),
    witnessToEdge(a, y, edge, true, kind, opts),
    witnessToEdge(b, y, edge, true, kind, opts),
    dimEndTick(a, y, true, kind, opts),
    dimEndTick(b, y, true, kind, opts),
    dimArrow(a, y, true, true, kind, opts),
    dimArrow(b, y, true, false, kind, opts),
    dimLabelText(
      (a + b) / 2,
      labelAbove ? y - dimLabelGap() : y + dimLabelGap() + 6,
      labelMm,
      kind,
      `font-size="8" text-anchor="middle" pointer-events="none"`,
    ),
  ];
}

export function overallSpanVertical(
  y0: number,
  y1: number,
  dimX: number,
  labelMm: string,
  edgeX: number,
  kind: DimKind = "overall",
  labelAnchor: "end" | "start" = "end",
  opts?: DimRenderOptions,
) {
  const x = dimX + (opts?.dx ?? 0);
  const dy = opts?.dy ?? 0;
  const a = y0 + dy;
  const b = y1 + dy;
  const edge = edgeX + (opts?.dx ?? 0);
  const labelX =
    labelAnchor === "end" ? x - dimLabelGap() : x + dimLabelGap();
  return [
    ...splitVerticalDimLine(a, b, x, labelMm, kind, opts),
    ...hitLane(x, a, x, b, kind, opts, "ew-resize"),
    dimGrip(x, (a + b) / 2, kind, opts),
    witnessToEdge(a, x, edge, false, kind, opts),
    witnessToEdge(b, x, edge, false, kind, opts),
    dimEndTick(x, a, false, kind, opts),
    dimEndTick(x, b, false, kind, opts),
    dimArrow(x, a, false, a > b, kind, opts),
    dimArrow(x, b, false, b > a, kind, opts),
    dimLabelText(
      labelX,
      (a + b) / 2 + 2.5,
      labelMm,
      kind,
      `font-size="8" text-anchor="${labelAnchor}" pointer-events="none"`,
    ),
  ];
}

export { dimClass };
