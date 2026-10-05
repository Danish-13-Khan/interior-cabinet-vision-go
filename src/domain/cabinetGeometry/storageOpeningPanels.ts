import { millimetresToMetres, type CabinetConfig } from "../cabinetDimensions";
import { resolveFrontGaps, type FrontLeaf } from "../cabinetConstruction/frontGaps";
import { layoutCabinetElevationFace, type OpeningFaceRect } from "../openingLayout";
import type { CabinetPanelGeometry } from "./types";

const SHELF_SIDE_CLEARANCE_MM = 3;

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.8;
}

function openingBoundaryPanels(
  openings: OpeningFaceRect[],
  config: CabinetConfig,
  leftFillerMm: number,
  usableDepth: number,
  shelfCenterZ: number,
): CabinetPanelGeometry[] {
  const panels: CabinetPanelGeometry[] = [];
  const seen = new Set<string>();
  const board = millimetresToMetres(config.dimensions.boardThickness);
  const outerWidth = millimetresToMetres(config.dimensions.width);
  const outerHeight = millimetresToMetres(config.dimensions.height);
  const toeKick = millimetresToMetres(config.toeKickHeight);

  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const a = openings[i]!;
      const b = openings[j]!;
      const aRight = a.xMm + a.widthMm;
      const bRight = b.xMm + b.widthMm;
      const aTop = a.yMm + a.heightMm;
      const bTop = b.yMm + b.heightMm;

      if (nearlyEqual(aRight, b.xMm) || nearlyEqual(bRight, a.xMm)) {
        const xMm = nearlyEqual(aRight, b.xMm) ? aRight : bRight;
        const start = Math.max(a.yMm, b.yMm);
        const end = Math.min(aTop, bTop);
        const key = `v-${Math.round(xMm)}-${Math.round(start)}-${Math.round(end)}`;
        if (end - start > 1 && !seen.has(key)) {
          seen.add(key);
          panels.push({
            name: `assembly-divider-${seen.size}`,
            label: "Assembly Divider",
            size: [board, millimetresToMetres(end - start), usableDepth],
            position: [
              -outerWidth / 2 + millimetresToMetres(leftFillerMm + xMm),
              -outerHeight / 2 + toeKick + millimetresToMetres((start + end) / 2),
              shelfCenterZ,
            ],
            material: "board",
          });
        }
      }

      if (nearlyEqual(aTop, b.yMm) || nearlyEqual(bTop, a.yMm)) {
        const yMm = nearlyEqual(aTop, b.yMm) ? aTop : bTop;
        const start = Math.max(a.xMm, b.xMm);
        const end = Math.min(aRight, bRight);
        const key = `h-${Math.round(yMm)}-${Math.round(start)}-${Math.round(end)}`;
        if (end - start > 1 && !seen.has(key)) {
          seen.add(key);
          panels.push({
            name: `assembly-partition-${seen.size}`,
            label: "Assembly Partition",
            size: [millimetresToMetres(end - start), board, usableDepth],
            position: [
              -outerWidth / 2 + millimetresToMetres(leftFillerMm + (start + end) / 2),
              -outerHeight / 2 + toeKick + millimetresToMetres(yMm),
              shelfCenterZ,
            ],
            material: "board",
          });
        }
      }
    }
  }
  return panels;
}

function frontName(kind: "door" | "drawer", opening: OpeningFaceRect, index: number, leafCount: number, single: boolean) {
  if (kind === "drawer") return single ? `drawer-front-${index + 1}` : `drawer-${opening.id}-${index + 1}`;
  if (single && leafCount === 2) return index === 0 ? "left-door" : "right-door";
  return single ? "door" : `door-${opening.id}-${index + 1}`;
}

/** Shelves and assembly boards per opening; doors and drawer fronts sized by `resolveFrontGaps`. */
export function openingComponentPanels(
  config: CabinetConfig,
  outerDepth: number,
  boardThickness: number,
  usableShelfDepth: number,
  shelfCenterZ: number,
): CabinetPanelGeometry[] {
  const layout = layoutCabinetElevationFace(config);
  const outerWidth = millimetresToMetres(config.dimensions.width);
  const outerHeight = millimetresToMetres(config.dimensions.height);
  const toeKick = millimetresToMetres(config.toeKickHeight);
  const frontZ = outerDepth / 2 + boardThickness / 2;
  const single = layout.openings.length === 1;
  const panels = openingBoundaryPanels(layout.openings, config, layout.leftFillerMm, usableShelfDepth, shelfCenterZ);
  const centre = (leaf: FrontLeaf): [number, number, number] => [
    -outerWidth / 2 + millimetresToMetres(layout.leftFillerMm + leaf.xMm + leaf.widthMm / 2),
    -outerHeight / 2 + toeKick + millimetresToMetres(leaf.yMm + leaf.heightMm / 2),
    frontZ,
  ];

  for (const { opening, kind, leaves } of resolveFrontGaps(config).openings) {
    leaves.forEach((leaf, index) => {
      panels.push({
        name: frontName(kind, opening, index, leaves.length, single),
        label: `${opening.label} ${kind === "door" ? "Door" : "Drawer"} ${index + 1}`,
        size: [millimetresToMetres(leaf.widthMm), millimetresToMetres(leaf.heightMm), boardThickness],
        position: centre(leaf),
        material: "door",
      });
    });
  }

  for (const opening of layout.openings) {
    if ((opening.contentType !== "door" && opening.contentType !== "open-shelf") || opening.shelfCount <= 0) continue;
    const width = millimetresToMetres(opening.widthMm);
    const height = millimetresToMetres(opening.heightMm);
    const x = -outerWidth / 2 + millimetresToMetres(layout.leftFillerMm + opening.xMm + opening.widthMm / 2);
    const y = -outerHeight / 2 + toeKick + millimetresToMetres(opening.yMm + opening.heightMm / 2);
    const spacing = height / (opening.shelfCount + 1);
    for (let index = 0; index < opening.shelfCount; index += 1) {
      panels.push({
        name: single ? `shelf-${index + 1}` : `shelf-${opening.id}-${index + 1}`,
        label: `${opening.label} Shelf ${index + 1}`,
        size: [Math.max(boardThickness, width - millimetresToMetres(SHELF_SIDE_CLEARANCE_MM * 2)), boardThickness, usableShelfDepth],
        position: [x, y - height / 2 + spacing * (index + 1), shelfCenterZ],
        material: "board",
      });
    }
  }
  return panels;
}
