import {
  DIM_ARROW_SIZE,
  DIM_GRIP_SIZE,
  DIM_LABEL_GAP_MAX,
  DIM_LABEL_GAP_MIN,
  DIM_WITNESS_OVERSHOOT,
} from "./constants";
import { dimTickHalf } from "./dimLayout";
import { line, text } from "./svgPrimitives";
import type { DimKind, DimRenderOptions } from "./dimGraphicsTypes";

export function dimClass(kind: DimKind, extra = "") {
  const base =
    kind === "overall"
      ? "twod-dim twod-dim-overall"
      : kind === "run"
        ? "twod-dim twod-dim-run"
        : kind === "selected"
          ? "twod-dim twod-dim-selected"
          : kind === "clearance"
            ? "twod-dim twod-wall-clearance"
            : kind === "opening"
              ? "twod-dim twod-dim-opening"
              : "twod-dim twod-dim-chain";
  return `${base}${extra ? ` ${extra}` : ""}`;
}

export function dimHitAttrs(
  kind: DimKind,
  opts: DimRenderOptions | undefined,
  cursor: "ns-resize" | "ew-resize" | "move",
  extra = "",
) {
  const selected = opts?.selected ? " is-selected" : "";
  const axis =
    cursor === "move" ? "both" : cursor === "ew-resize" ? "x" : "y";
  const idAttr = opts?.dimId
    ? ` data-dim-id="${opts.dimId}" data-draft-object="dim" data-dim="${kind}" data-dim-axis="${axis}"`
    : ` data-dim="${kind}" data-dim-axis="${axis}"`;
  return `class="${dimClass(kind, extra)}${selected}"${idAttr} style="cursor:${cursor}"`;
}

export function labelBandWidth(label: string) {
  const estimated = label.length * 3.6 + 10;
  return Math.min(DIM_LABEL_GAP_MAX, Math.max(DIM_LABEL_GAP_MIN, estimated));
}

/** Oblique tick / arrowhead at dim terminus. */
export function dimArrow(
  x: number,
  y: number,
  horizontal: boolean,
  pointingTowardPositive: boolean,
  kind: DimKind,
  opts?: DimRenderOptions,
  cursor: "ns-resize" | "ew-resize" | "move" = horizontal ? "ns-resize" : "ew-resize",
) {
  const s = DIM_ARROW_SIZE;
  if (horizontal) {
    const dir = pointingTowardPositive ? 1 : -1;
    const tipX = x;
    const baseX = x - dir * s;
    return `<path d="M ${tipX} ${y} L ${baseX} ${y - s * 0.55} L ${baseX} ${y + s * 0.55} Z" ${dimHitAttrs(kind, opts, cursor, "twod-dim-arrow")} />`;
  }
  const dir = pointingTowardPositive ? 1 : -1;
  const tipY = y;
  const baseY = y - dir * s;
  return `<path d="M ${x} ${tipY} L ${x - s * 0.55} ${baseY} L ${x + s * 0.55} ${baseY} Z" ${dimHitAttrs(kind, opts, cursor, "twod-dim-arrow")} />`;
}

/** Full witness from geometry edge to dim line with slight overshoot. */
export function witnessToEdge(
  along: number,
  dimPos: number,
  edgePos: number,
  horizontalDim: boolean,
  kind: DimKind,
  opts?: DimRenderOptions,
  cursor: "ns-resize" | "ew-resize" | "move" = horizontalDim ? "ns-resize" : "ew-resize",
) {
  const over = DIM_WITNESS_OVERSHOOT;
  if (horizontalDim) {
    const dir = edgePos < dimPos ? 1 : -1;
    return line(
      along,
      edgePos,
      along,
      dimPos + dir * over,
      dimHitAttrs(kind, opts, cursor, "twod-dim-ext twod-dim-witness-line"),
    );
  }
  const dir = edgePos < dimPos ? 1 : -1;
  return line(
    edgePos,
    along,
    dimPos + dir * over,
    along,
    dimHitAttrs(kind, opts, cursor, "twod-dim-ext twod-dim-witness-line"),
  );
}

export function dimEndTick(
  x: number,
  y: number,
  horizontal: boolean,
  kind: DimKind,
  opts?: DimRenderOptions,
  cursor: "ns-resize" | "ew-resize" | "move" = horizontal ? "ns-resize" : "ew-resize",
) {
  const half = dimTickHalf();
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

export function dimGrip(
  x: number,
  y: number,
  kind: DimKind,
  opts?: DimRenderOptions,
) {
  if (!opts?.dimId) return "";
  const s = DIM_GRIP_SIZE;
  return `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" ${dimHitAttrs(kind, opts, "move", "twod-dim-grip")} />`;
}

export function dimLabelText(
  x: number,
  y: number,
  label: string,
  kind: DimKind,
  attrs: string,
) {
  return text(
    x,
    y,
    `${label} mm`,
    `class="twod-annotation ${dimClass(kind)}" data-dim="${kind}" ${attrs}`,
  );
}
