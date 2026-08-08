import { SCALE } from "./constants";
import {
  dimExtLen,
  dimLabelGap,
  dimTickHalf,
} from "./dimLayout";
import { line, text } from "./svgPrimitives";

export type DimKind = "overall" | "chain" | "run" | "selected" | "clearance";

export type DimRenderOptions = {
  dimId?: string;
  dx?: number;
  dy?: number;
  selected?: boolean;
};

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

function dimHitAttrs(
  kind: DimKind,
  opts: DimRenderOptions | undefined,
  cursor: "ns-resize" | "ew-resize",
  extra = "",
) {
  const selected = opts?.selected ? " is-selected" : "";
  const axis = cursor === "ew-resize" ? "x" : "y";
  const idAttr = opts?.dimId
    ? ` data-dim-id="${opts.dimId}" data-draft-object="dim" data-dim="${kind}" data-dim-axis="${axis}"`
    : ` data-dim="${kind}" data-dim-axis="${axis}"`;
  return `class="${dimClass(kind, extra)}${selected}"${idAttr} style="cursor:${cursor}"`;
}

export function dimTick(
  x: number,
  y: number,
  horizontal: boolean,
  kind: DimKind = "chain",
  opts?: DimRenderOptions,
) {
  const half = dimTickHalf();
  const cursor = horizontal ? "ns-resize" : "ew-resize";
  if (horizontal) {
    return line(
      x,
      y - half,
      x,
      y + half,
      dimHitAttrs(kind, opts, cursor, "twod-dim-witness"),
    );
  }
  return line(
    x - half,
    y,
    x + half,
    y,
    dimHitAttrs(kind, opts, cursor, "twod-dim-witness"),
  );
}

function extensionPairHorizontal(
  x: number,
  dimY: number,
  towardY: number,
  kind: DimKind,
  opts?: DimRenderOptions,
) {
  const ext = dimExtLen();
  const dir = towardY < dimY ? -1 : 1;
  return line(
    x,
    dimY,
    x,
    dimY + dir * ext,
    dimHitAttrs(kind, opts, "ns-resize", "twod-dim-ext"),
  );
}

function extensionPairVertical(
  y: number,
  dimX: number,
  towardX: number,
  kind: DimKind,
  opts?: DimRenderOptions,
) {
  const ext = dimExtLen();
  const dir = towardX < dimX ? -1 : 1;
  return line(
    dimX,
    y,
    dimX + dir * ext,
    y,
    dimHitAttrs(kind, opts, "ew-resize", "twod-dim-ext"),
  );
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
    line(x0, dimY, x1, dimY, dimHitAttrs(kind, opts, "ns-resize")),
  );
  // Wider invisible hit lane
  if (opts?.dimId) {
    elements.push(
      line(
        x0,
        dimY,
        x1,
        dimY,
        `${dimHitAttrs(kind, opts, "ns-resize", "twod-dim-hit")} stroke-width="10" opacity="0"`,
      ),
    );
  }

  for (let index = 0; index < positionsMm.length; index += 1) {
    const x = ox + positionsMm[index]! / SCALE + (opts?.dx ?? 0);
    elements.push(extensionPairHorizontal(x, dimY, edgeY, kind, opts));
    elements.push(dimTick(x, dimY, true, kind, opts));
    if (index < labels.length) {
      const mid =
        ox +
        (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE +
        (opts?.dx ?? 0);
      elements.push(
        text(
          mid,
          dimY - dimLabelGap(),
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

  elements.push(line(dimX, y0, dimX, y1, dimHitAttrs(kind, opts, "ew-resize")));
  if (opts?.dimId) {
    elements.push(
      line(
        dimX,
        y0,
        dimX,
        y1,
        `${dimHitAttrs(kind, opts, "ew-resize", "twod-dim-hit")} stroke-width="10" opacity="0"`,
      ),
    );
  }

  for (let index = 0; index < positionsMm.length; index += 1) {
    const y = toSvgY(positionsMm[index]!);
    elements.push(extensionPairVertical(y, dimX, edgeX, kind, opts));
    elements.push(dimTick(dimX, y, false, kind, opts));
    if (index < labels.length) {
      const mid =
        (toSvgY(positionsMm[index]!) + toSvgY(positionsMm[index + 1]!)) / 2;
      elements.push(
        text(
          dimX - dimLabelGap(),
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
  opts?: DimRenderOptions,
) {
  const elements: string[] = [];
  if (positionsMm.length < 2) return elements;
  const dimX = chainX + (opts?.dx ?? 0);
  const z0 = oy + positionsMm[0]! / SCALE + (opts?.dy ?? 0);
  const z1 = oy + positionsMm[positionsMm.length - 1]! / SCALE + (opts?.dy ?? 0);
  const edgeX = (geometryEdgeX ?? chainX - 8) + (opts?.dx ?? 0);
  elements.push(line(dimX, z0, dimX, z1, dimHitAttrs(kind, opts, "ew-resize")));
  if (opts?.dimId) {
    elements.push(
      line(
        dimX,
        z0,
        dimX,
        z1,
        `${dimHitAttrs(kind, opts, "ew-resize", "twod-dim-hit")} stroke-width="10" opacity="0"`,
      ),
    );
  }
  for (let index = 0; index < positionsMm.length; index += 1) {
    const z = oy + positionsMm[index]! / SCALE + (opts?.dy ?? 0);
    elements.push(extensionPairVertical(z, dimX, edgeX, kind, opts));
    elements.push(dimTick(dimX, z, false, kind, opts));
    if (index < labels.length) {
      const mid =
        oy + (positionsMm[index]! + positionsMm[index + 1]!) / 2 / SCALE + (opts?.dy ?? 0);
      elements.push(
        text(
          dimX + dimLabelGap(),
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
  opts?: DimRenderOptions,
) {
  const y = dimY + (opts?.dy ?? 0);
  const dx = opts?.dx ?? 0;
  const labelAbove = y <= edgeY + (opts?.dy ?? 0);
  return [
    line(x0 + dx, y, x1 + dx, y, dimHitAttrs(kind, opts, "ns-resize")),
    ...(opts?.dimId
      ? [
          line(
            x0 + dx,
            y,
            x1 + dx,
            y,
            `${dimHitAttrs(kind, opts, "ns-resize", "twod-dim-hit")} stroke-width="10" opacity="0"`,
          ),
        ]
      : []),
    extensionPairHorizontal(x0 + dx, y, edgeY + (opts?.dy ?? 0), kind, opts),
    extensionPairHorizontal(x1 + dx, y, edgeY + (opts?.dy ?? 0), kind, opts),
    dimTick(x0 + dx, y, true, kind, opts),
    dimTick(x1 + dx, y, true, kind, opts),
    text(
      (x0 + x1) / 2 + dx,
      labelAbove ? y - dimLabelGap() : y + dimLabelGap() + 6,
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
  opts?: DimRenderOptions,
) {
  const x = dimX + (opts?.dx ?? 0);
  const dy = opts?.dy ?? 0;
  const labelX =
    labelAnchor === "end" ? x - dimLabelGap() : x + dimLabelGap();
  return [
    line(x, y0 + dy, x, y1 + dy, dimHitAttrs(kind, opts, "ew-resize")),
    ...(opts?.dimId
      ? [
          line(
            x,
            y0 + dy,
            x,
            y1 + dy,
            `${dimHitAttrs(kind, opts, "ew-resize", "twod-dim-hit")} stroke-width="10" opacity="0"`,
          ),
        ]
      : []),
    extensionPairVertical(y0 + dy, x, edgeX + (opts?.dx ?? 0), kind, opts),
    extensionPairVertical(y1 + dy, x, edgeX + (opts?.dx ?? 0), kind, opts),
    dimTick(x, y0 + dy, false, kind, opts),
    dimTick(x, y1 + dy, false, kind, opts),
    text(
      labelX,
      (y0 + y1) / 2 + 2.5 + dy,
      `${labelMm} mm`,
      `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" font-size="8" text-anchor="${labelAnchor}" pointer-events="none"`,
    ),
  ];
}
