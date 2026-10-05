import { millimetresToMetres as m, type CabinetConfig } from "../cabinetDimensions";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { slidingLeaves, slidingPullXMm } from "../cabinetConstruction/slidingFronts";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import type { SlidingDoorSpec } from "../frontSystem/slidingDefaults";
import { slidingCarcassConfig, slidingCarcassDepthMm } from "../frontSystem/slidingSpec";
import { layoutCabinetElevationFace } from "../openingLayout";
import { frontLeafPanels, type FacePlacer } from "./frontPanels";
import type { CabinetPanelGeometry } from "./types";

const PULL_SIZE_MM = { width: 20, height: 180, depth: 3 };
const TRACK_HEIGHT_MM = 12;
const END_PANEL_NAMES = new Set(["left-end-panel", "right-end-panel"]);

/** Leaf centre z (cabinet-local metres, full depth centred on 0): rear plane T/4, front plane 3T/4 ahead of the carcass. */
export function slidingLeafZ(depthMm: number, trackAllowanceMm: number, plane: 0 | 1): number {
  const carcassFrontMm = depthMm / 2 - trackAllowanceMm;
  return m(carcassFrontMm + trackAllowanceMm * (plane === 0 ? 0.25 : 0.75));
}

/**
 * 3D for a sliding wardrobe: the carcass is built `depth − trackAllowance` deep and pushed
 * back so its back stays on the wall; leaves sit on two planes `trackAllowance / 2` apart in
 * front of it (inside the overall depth); end panels keep full depth; no hinges, flush pulls.
 */
export function slidingWardrobeGeometry(
  config: CabinetConfig,
  spec: SlidingDoorSpec,
  buildCarcass: (carcass: CabinetConfig) => CabinetPanelGeometry[],
): CabinetPanelGeometry[] {
  const depthMm = config.dimensions.depth;
  const trackMm = depthMm - slidingCarcassDepthMm(config, spec);
  const shift = -m(trackMm) / 2;
  const panels = buildCarcass(slidingCarcassConfig(config, spec)).map((panel): CabinetPanelGeometry => (
    END_PANEL_NAMES.has(panel.name)
      ? { ...panel, size: [panel.size[0], panel.size[1], m(depthMm)], position: [panel.position[0], panel.position[1], 0] }
      : { ...panel, position: [panel.position[0], panel.position[1], panel.position[2] + shift] }
  ));

  const layout = layoutCabinetElevationFace(config);
  const outerWidth = m(config.dimensions.width);
  const outerHeight = m(config.dimensions.height);
  const toeKick = m(config.toeKickHeight);
  const board = m(config.dimensions.boardThickness);
  const place: FacePlacer = (xMm, yMm) => [
    -outerWidth / 2 + m(layout.leftFillerMm + xMm),
    -outerHeight / 2 + toeKick + m(yMm),
  ];
  const construction = normalizeConstructionSpec(config.type, config.construction);
  const leaves = slidingLeaves(resolveFrontGaps(config).openings);
  leaves.forEach((leaf, index) => {
    const z = slidingLeafZ(depthMm, trackMm, leaf.slidingPlane ?? 0);
    const name = `sliding-shutter-${index + 1}`;
    panels.push(...frontLeafPanels(name, `Sliding Shutter ${index + 1}`, leaf, place, z, board,
      construction.frontStyle, construction.faceFrame));
    const [x, y] = place(slidingPullXMm(leaf, index, leaves.length, spec.overlapMm), leaf.yMm + leaf.heightMm / 2);
    panels.push({
      name: `sliding-pull-${index + 1}`,
      label: `Sliding Shutter ${index + 1} flush pull`,
      size: [m(PULL_SIZE_MM.width), m(PULL_SIZE_MM.height), m(PULL_SIZE_MM.depth)],
      position: [x, y, z + board / 2 - m(PULL_SIZE_MM.depth) / 2],
      material: "metal",
    });
  });

  const faceHeightMm = config.dimensions.height - config.toeKickHeight;
  const trackZ = m(depthMm / 2 - trackMm / 2);
  for (const [name, label, yMm] of [
    ["sliding-track-bottom", "Sliding track (bottom)", TRACK_HEIGHT_MM / 2],
    ["sliding-track-top", "Sliding track (top)", faceHeightMm - TRACK_HEIGHT_MM / 2],
  ] as const) {
    const [, y] = place(0, yMm);
    panels.push({
      name, label,
      size: [outerWidth, m(TRACK_HEIGHT_MM), m(trackMm)],
      position: [0, y, trackZ],
      material: "metal",
    });
  }
  return panels;
}
