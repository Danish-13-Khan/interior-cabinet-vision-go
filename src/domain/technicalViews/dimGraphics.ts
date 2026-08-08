import { SCALE } from "./constants";
import {
  dimExtLen,
  dimLabelGap,
  dimTickHalf,
} from "./dimLayout";
import { line, text } from "./svgPrimitives";

export type DimKind = "overall" | "chain" | "run" | "selected" | "clearance";

function dimClass(kind: DimKind, extra = "") {
  const base =
    kind === "overall"
      ? "twod-dim twod-dim-overall"
      : kind === "run"
        ? "twod-dim twod-dim-run"
        : kind === "selected"
          ? "twod-dim twod-dim-selected"
          : kind === "clearance"
            ? "twod-dim twod-wall-clearance"
            : "twod-dim twod-dim-chain";
  return `${base}${extra ? ` ${extra}` : ""}`;
}

export function dimTick(
  x: number,
  y: number,
  horizontal: boolean,
  kind: DimKind = "chain",
) {
  const half = dimTickHalf();
  if (horizontal) {
    return line(
      x,
      y - half,
      x,
      y + half,
      `class="${dimClass(kind, "twod-dim-witness")}" data-dim="${kind}"`,
    );
  }
  return line(
    x - half,
    y,
    x + half,
    y,
    `class="${dimClass(kind, "twod-dim-witness")}" data-dim="${kind}"`,
  );
}

function extensionPairHorizontal(x: number, dimY: number, towardY: number, kind: DimKind) {
  const ext = dimExtLen();
  const dir = towardY < dimY ? -1 : 1;
  return line(
    x,
    dimY,
    x,
    dimY + dir * ext,
    `class="${dimClass(kind, "twod-dim-ext")}" data-dim="${kind}"`,
  );
}

function extensionPairVertical(y: number, dimX: number, towardX: number, kind: DimKind) {
  const ext = dimExtLen();
  const dir = towardX < dimX ? -1 : 1;
  return line(
    dimX,
    y,
    dimX + dir * ext,
    y,
    `class="${dimClass(kind, "twod-dim-ext")}" data-dim="${kind}"`,
  );
}

export function dimensionChainHorizontal(
  positionsMm: number[],
  labels: string[],
  ox: number,
  y: number,
  kind: DimKind = "chain",
  geometryEdgeY?: number,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const x0 = ox + positionsMm[0]! / SCALE;
  const x1 = ox + positionsMm[positionsMm.length - 1]! / SCALE;
  const edgeY = geometryEdgeY ?? y - 8;

  elements.push(
    line(x0, y, x1, y, `class="${dimClass(kind)}" data-dim="${kind}"`),
  );

  for (let index = 0; index < positionsMm.length; index += 1) {
    const x = ox + positionsMm[index]! / SCALE;
    elements.push(extensionPairHorizontal(x, y, edgeY, kind));
    elements.push(dimTick(x, y, true, kind));
    if (index < labels.length) {
      const mid =
        ox + (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE;
      elements.push(
        text(
          mid,
          y - dimLabelGap(),
          `${labels[index]} mm`,
          `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="7" text-anchor="middle" pointer-events="none"`,
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
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;

  const floorY = oy + roomHeightMm / SCALE / 2;
  const toSvgY = (mmFromFloor: number) => floorY - mmFromFloor / SCALE;
  const y0 = toSvgY(positionsMm[0]!);
  const y1 = toSvgY(positionsMm[positionsMm.length - 1]!);
  const edgeX = geometryEdgeX ?? x - 8;

  elements.push(line(x, y0, x, y1, `class="${dimClass(kind)}" data-dim="${kind}"`));

  for (let index = 0; index < positionsMm.length; index += 1) {
    const y = toSvgY(positionsMm[index]!);
    elements.push(extensionPairVertical(y, x, edgeX, kind));
    elements.push(dimTick(x, y, false, kind));
    if (index < labels.length) {
      const mid =
        (toSvgY(positionsMm[index]!) + toSvgY(positionsMm[index + 1]!)) / 2;
      elements.push(
        text(
          x - dimLabelGap(),
          mid + 2.5,
          `${labels[index]} mm`,
          `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="7" text-anchor="end" pointer-events="none"`,
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
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;
  const z0 = oy + positionsMm[0]! / SCALE;
  const z1 = oy + positionsMm[positionsMm.length - 1]! / SCALE;
  const edgeX = geometryEdgeX ?? chainX - 8;
  elements.push(line(chainX, z0, chainX, z1, `class="${dimClass(kind)}" data-dim="${kind}"`));
  for (let index = 0; index < positionsMm.length; index += 1) {
    const z = oy + positionsMm[index]! / SCALE;
    elements.push(extensionPairVertical(z, chainX, edgeX, kind));
    elements.push(dimTick(chainX, z, false, kind));
    if (index < labels.length) {
      const mid =
        oy + (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE;
      elements.push(
        text(
          chainX + dimLabelGap(),
          mid + 2.5,
          `${labels[index]} mm`,
          `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="6.5" text-anchor="start" pointer-events="none"`,
        ),
      );
    }
  }
  return elements;
}

/** Single overall span with extensions + ticks (SVG coords). */
export function overallSpanHorizontal(
  x0: number,
  x1: number,
  dimY: number,
  labelMm: string,
  edgeY: number,
  kind: DimKind = "overall",
) {
  const labelAbove = dimY <= edgeY;
  return [
    line(x0, dimY, x1, dimY, `class="${dimClass(kind)}" data-dim="${kind}"`),
    extensionPairHorizontal(x0, dimY, edgeY, kind),
    extensionPairHorizontal(x1, dimY, edgeY, kind),
    dimTick(x0, dimY, true, kind),
    dimTick(x1, dimY, true, kind),
    text(
      (x0 + x1) / 2,
      labelAbove ? dimY - dimLabelGap() : dimY + dimLabelGap() + 6,
      `${labelMm} mm`,
      `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="8" text-anchor="middle" pointer-events="none"`,
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
) {
  const labelX =
    labelAnchor === "end" ? dimX - dimLabelGap() : dimX + dimLabelGap();
  return [
    line(dimX, y0, dimX, y1, `class="${dimClass(kind)}" data-dim="${kind}"`),
    extensionPairVertical(y0, dimX, edgeX, kind),
    extensionPairVertical(y1, dimX, edgeX, kind),
    dimTick(dimX, y0, false, kind),
    dimTick(dimX, y1, false, kind),
    text(
      labelX,
      (y0 + y1) / 2 + 2.5,
      `${labelMm} mm`,
      `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="8" text-anchor="${labelAnchor}" pointer-events="none"`,
    ),
  ];
}
