import type { CabinetConfig } from "./cabinetDimensions";
import { resolveCabinetComposition } from "./cabinetComposition";
import type {
  DoorHinge,
  DoorStyle,
  OpeningContentType,
  OpeningNode,
  OpeningStructure,
} from "./cabinetOpeningStructure";
import { normalizeOpeningStructure } from "./cabinetOpeningStructure";

export type OpeningFaceRect = {
  id: string;
  label: string;
  contentType: OpeningContentType;
  /** Origin at bottom-left of the face (above toe kick), mm. */
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  doorStyle?: DoorStyle;
  doorHinge?: DoorHinge;
  drawerCount: number;
  shelfCount: number;
};

export type CabinetElevationFaceLayout = {
  carcassWidthMm: number;
  carcassHeightMm: number;
  toeKickHeightMm: number;
  leftFillerMm: number;
  rightFillerMm: number;
  leftEndPanel: boolean;
  rightEndPanel: boolean;
  /** Opening face width after fillers (end panels drawn outside). */
  faceWidthMm: number;
  faceHeightMm: number;
  openings: OpeningFaceRect[];
  activeOpeningId: string | null;
};

function layoutNode(
  node: OpeningNode,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
): OpeningFaceRect[] {
  if (node.kind === "leaf") {
    return [
      {
        id: node.id,
        label: node.label,
        contentType: node.contentType,
        xMm,
        yMm,
        widthMm,
        heightMm,
        doorStyle: node.doorStyle,
        doorHinge: node.doorHinge,
        drawerCount: node.drawerCount ?? 0,
        shelfCount: node.shelfCount ?? 0,
      },
    ];
  }

  const totalRatio = node.children.reduce(
    (sum, child) => sum + (child.kind === "leaf" ? child.ratio : 1),
    0,
  ) || 1;

  const childSizes = node.children.map((child) => {
    const ratio = child.kind === "leaf" ? child.ratio : 1 / node.children.length;
    return ratio / totalRatio;
  });

  // Normalize equal share for nested splits without leaf ratios
  const normalized =
    node.children.every((child) => child.kind === "split")
      ? node.children.map(() => 1 / node.children.length)
      : childSizes.map((value, index) => {
          const child = node.children[index]!;
          if (child.kind === "split") {
            // Use remaining share equally among split siblings if mixed — keep ratio path
            return value;
          }
          return value;
        });

  // Prefer explicit leaf ratios; for pure splits use equal division
  const shares = node.children.map((child, index) => {
    if (child.kind === "leaf") return Math.max(0.05, child.ratio);
    if (node.children.every((item) => item.kind === "split")) {
      return 1;
    }
    return normalized[index] ?? 1;
  });
  const shareTotal = shares.reduce((sum, value) => sum + value, 0) || 1;

  const rects: OpeningFaceRect[] = [];
  let cursor = 0;
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]!;
    const share = shares[index]! / shareTotal;
    if (node.axis === "vertical") {
      const childWidth = widthMm * share;
      rects.push(
        ...layoutNode(child, xMm + cursor, yMm, childWidth, heightMm),
      );
      cursor += childWidth;
    } else {
      // horizontal: stack from top of face downward in elevation (y grows up in mm space)
      // Face y=0 is bottom; first child (top of tree) is at top of face.
      const childHeight = heightMm * share;
      // Place from top: remaining height above bottom
      const topOffset = heightMm - cursor - childHeight;
      rects.push(
        ...layoutNode(child, xMm, yMm + topOffset, widthMm, childHeight),
      );
      cursor += childHeight;
    }
  }
  return rects;
}

/** Layout an opening structure into absolute face rectangles (mm). */
export function layoutOpeningStructure(
  structure: OpeningStructure,
  faceWidthMm: number,
  faceHeightMm: number,
): OpeningFaceRect[] {
  const width = Math.max(1, faceWidthMm);
  const height = Math.max(1, faceHeightMm);
  return layoutNode(structure.root, 0, 0, width, height).map((rect) => ({
    ...rect,
    widthMm: Math.max(1, rect.widthMm),
    heightMm: Math.max(1, rect.heightMm),
  }));
}

/** Full elevation face engineering layout for a cabinet config. */
export function layoutCabinetElevationFace(
  config: CabinetConfig,
): CabinetElevationFaceLayout {
  const composition = resolveCabinetComposition(config);
  const carcassWidthMm = config.dimensions.width;
  const carcassHeightMm = config.dimensions.height;
  const toeKickHeightMm = composition.toeKick.enabled
    ? composition.toeKick.heightMm
    : 0;
  const leftFillerMm = composition.fillers.leftMm;
  const rightFillerMm = composition.fillers.rightMm;
  const faceWidthMm = Math.max(
    1,
    carcassWidthMm - leftFillerMm - rightFillerMm,
  );
  const faceHeightMm = Math.max(1, carcassHeightMm - toeKickHeightMm);
  const structure = composition.openingStructure
    ? normalizeOpeningStructure(
        config.type,
        composition.openingStructure,
        faceWidthMm,
      )
    : null;
  const openings = structure
    ? layoutOpeningStructure(structure, faceWidthMm, faceHeightMm)
    : [];

  return {
    carcassWidthMm,
    carcassHeightMm,
    toeKickHeightMm,
    leftFillerMm,
    rightFillerMm,
    leftEndPanel: composition.endPanels.left,
    rightEndPanel: composition.endPanels.right,
    faceWidthMm,
    faceHeightMm,
    openings,
    activeOpeningId: structure?.activeOpeningId ?? null,
  };
}

export function findOpeningFaceRect(
  layout: CabinetElevationFaceLayout,
  openingId: string,
): OpeningFaceRect | null {
  return layout.openings.find((opening) => opening.id === openingId) ?? null;
}
