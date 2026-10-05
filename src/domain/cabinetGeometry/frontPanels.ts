import { millimetresToMetres as m, type CabinetConfig } from "../cabinetDimensions";
import type { FrontLeaf, ResolvedFronts } from "../cabinetConstruction/frontGaps";
import type { FaceFrameSpec } from "../cabinetConstructionSpec";
import { handleSideForLeaf } from "../constructionGraphics/doorSwing";
import { doorFrameWidths, type DoorFrontStyle } from "../frontSystem/doorStyles";
import { normalizeCabinetHardware } from "../hardwareSystem/normalize";
import type { OpeningFaceRect } from "../openingLayout";
import type { CabinetPanelGeometry, Vector3Tuple } from "./types";

/** Face millimetres (origin after left filler, above toe kick) to cabinet-local metres. */
export type FacePlacer = (xMm: number, yMm: number) => [number, number];

/** Keeps profile faces off the carcass faces they touch so the renderer never z-fights. */
const PROFILE_SETBACK_MM = 0.5;
const GLASS_THICKNESS_MM = 4;
const HANDLE_EDGE_INSET_MM = 40;
const HANDLE_END_INSET_MM = 100;
const HANDLE_SHAPES: Record<string, { longMm: number; thickMm: number; projectionMm: number; verticalOnDoors: boolean }> = {
  "handle-bar": { longMm: 160, thickMm: 12, projectionMm: 28, verticalOnDoors: true },
  "handle-knob": { longMm: 28, thickMm: 28, projectionMm: 28, verticalOnDoors: false },
  "handle-cup": { longMm: 96, thickMm: 24, projectionMm: 16, verticalOnDoors: false },
};

/** The leaf-sized panel of each front (slab door, shaker centre panel, glass); frame pieces are `-frame-`. */
export function isFrontLeafPanel(panel: CabinetPanelGeometry): boolean {
  return (panel.material === "door" || panel.material === "glass") && !panel.name.includes("-frame-");
}

export function frontLeafPanels(
  name: string,
  label: string,
  leaf: FrontLeaf,
  place: FacePlacer,
  frontZ: number,
  board: number,
  style: DoorFrontStyle | undefined,
  frame: FaceFrameSpec,
): CabinetPanelGeometry[] {
  const [cx, cy] = place(leaf.xMm + leaf.widthMm / 2, leaf.yMm + leaf.heightMm / 2);
  const w = m(leaf.widthMm);
  const h = m(leaf.heightMm);
  if (!style) return [{ name, label, size: [w, h, board], position: [cx, cy, frontZ], material: "door" }];
  const { stileMm, railMm } = doorFrameWidths(leaf, frame);
  const s = m(stileMm);
  const r = m(railMm);
  const glass = style.style === "glass";
  const frameT = glass ? board : board / 2;
  const frameZ = glass ? frontZ : frontZ + board / 4;
  const piece = (side: string, size: Vector3Tuple, x: number, y: number): CabinetPanelGeometry => ({
    name: `${name}-frame-${side}`, label: `${label} ${side} ${side === "top" || side === "bottom" ? "rail" : "stile"}`,
    size, position: [x, y, frameZ], material: "door",
  });
  return [
    glass
      ? { name, label: `${label} glass`, size: [w, h, m(GLASS_THICKNESS_MM)], position: [cx, cy, frontZ], material: "glass" }
      : { name, label: `${label} panel`, size: [w, h, board / 2], position: [cx, cy, frontZ - board / 4], material: "door" },
    piece("left", [s, h, frameT], cx - w / 2 + s / 2, cy),
    piece("right", [s, h, frameT], cx + w / 2 - s / 2, cy),
    piece("top", [w - s * 2, r, frameT], cx, cy + h / 2 - r / 2),
    piece("bottom", [w - s * 2, r, frameT], cx, cy - h / 2 + r / 2),
  ];
}

function doorHandleSpot(config: CabinetConfig, opening: OpeningFaceRect, leaf: FrontLeaf, index: number, count: number) {
  const side = handleSideForLeaf(opening.doorHinge, index, count);
  const x = side === "right" ? leaf.xMm + leaf.widthMm - HANDLE_EDGE_INSET_MM : leaf.xMm + HANDLE_EDGE_INSET_MM;
  const inset = Math.min(HANDLE_END_INSET_MM, leaf.heightMm / 2);
  if (config.type === "wall") return [x, leaf.yMm + inset];
  if (config.type === "tall") return [x, leaf.yMm + leaf.heightMm / 2];
  return [x, leaf.yMm + leaf.heightMm - inset];
}

/** One handle per front that still needs one (gola-gripped fronts skip), matching the hardware schedule. */
export function handlePanels(config: CabinetConfig, fronts: ResolvedFronts, place: FacePlacer, frontZ: number, board: number) {
  const shape = HANDLE_SHAPES[normalizeCabinetHardware(config.type, config.hardware).handleId];
  if (!shape) return [];
  const panels: CabinetPanelGeometry[] = [];
  for (const { opening, kind, leaves } of fronts.openings) {
    leaves.forEach((leaf, index) => {
      if (leaf.golaGrip || leaf.pushOpen || leaf.slidingPlane !== undefined) return;
      const [xMm, yMm] = kind === "drawer"
        ? [leaf.xMm + leaf.widthMm / 2, leaf.yMm + leaf.heightMm / 2]
        : doorHandleSpot(config, opening, leaf, index, leaves.length);
      const vertical = kind === "door" && shape.verticalOnDoors;
      const [x, y] = place(xMm!, yMm!);
      const projection = m(shape.projectionMm);
      panels.push({
        name: `handle-${panels.length + 1}`,
        label: `${opening.label} handle`,
        size: vertical ? [m(shape.thickMm), m(shape.longMm), projection] : [m(shape.longMm), m(shape.thickMm), projection],
        position: [x, y, frontZ + board / 2 + projection / 2],
        material: "metal",
      });
    });
  }
  return panels;
}

/** Recessed gola profiles; full-width bands stop inside the sides, L under the top, wall clear of the bottom face. */
export function golaProfilePanels(config: CabinetConfig, fronts: ResolvedFronts, place: FacePlacer, outerDepth: number) {
  const boardMm = config.dimensions.boardThickness;
  return fronts.profiles.map((band, index): CabinetPanelGeometry => {
    const depth = m(band.depthMm - PROFILE_SETBACK_MM);
    const endTrim = band.kind === "C" ? 0 : boardMm;
    const lengthMm = band.lengthMm - endTrim * 2;
    const bottomMm = band.yMm + (band.kind === "wall" ? PROFILE_SETBACK_MM : 0);
    const heightMm = band.heightMm - (band.kind === "L" ? boardMm : band.kind === "wall" ? PROFILE_SETBACK_MM : 0);
    const [x, y] = place(band.xMm + endTrim + lengthMm / 2, bottomMm + heightMm / 2);
    return {
      name: `gola-${band.kind.toLowerCase()}-${index + 1}`,
      label: `Gola ${band.kind === "wall" ? "wall-unit" : band.kind} profile`,
      size: [m(lengthMm), m(heightMm), depth],
      position: [x, y, outerDepth / 2 - m(PROFILE_SETBACK_MM) - depth / 2],
      material: "metal",
    };
  });
}
