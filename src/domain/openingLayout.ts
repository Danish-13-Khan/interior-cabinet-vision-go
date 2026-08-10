import type { CabinetConfig } from "./cabinetDimensions";
import { resolveCabinetComposition } from "./cabinetComposition";
import type {
  DoorHinge,
  DoorStyle,
  OpeningContentType,
  OpeningNode,
  OpeningStructure,
} from "./cabinetOpeningStructure";
import {
  getOpeningNodeRatio,
  normalizeOpeningStructure,
} from "./cabinetOpeningStructure";

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
  drawerRatios?: number[];
  shelfCount: number;
  shelvesAdjustable: boolean;
  parentAxis?: "vertical" | "horizontal";
  siblingIndex: number;
  siblingCount: number;
  /** Stable shop marker index within the cabinet face (0-based). */
  markerIndex: number;
};

export type CabinetElevationFaceLayout = {
  carcassWidthMm: number;
  carcassHeightMm: number;
  toeKickHeightMm: number;
  leftFillerMm: number;
  rightFillerMm: number;
  leftEndPanel: boolean;
  rightEndPanel: boolean;
  boardThicknessMm: number;
  /** Side / top / bottom carcass board insets inside the face. */
  faceInsetLeftMm: number;
  faceInsetRightMm: number;
  faceInsetTopMm: number;
  faceInsetBottomMm: number;
  /** Opening face width after fillers (end panels drawn outside). */
  faceWidthMm: number;
  faceHeightMm: number;
  /** Clear opening inside carcass boards. */
  clearWidthMm: number;
  clearHeightMm: number;
  openings: OpeningFaceRect[];
  activeOpeningId: string | null;
};

function layoutNode(
  node: OpeningNode,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  parentAxis?: "vertical" | "horizontal",
  siblingIndex = 0,
  siblingCount = 1,
): Omit<OpeningFaceRect, "markerIndex">[] {
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
        drawerRatios: node.drawerRatios,
        shelfCount: node.shelfCount ?? 0,
        shelvesAdjustable: node.shelvesAdjustable !== false,
        parentAxis,
        siblingIndex,
        siblingCount,
      },
    ];
  }

  const shares = node.children.map((child) => getOpeningNodeRatio(child));
  const shareTotal = shares.reduce((sum, value) => sum + value, 0) || 1;

  const rects: Omit<OpeningFaceRect, "markerIndex">[] = [];
  let cursor = 0;
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]!;
    const share = shares[index]! / shareTotal;
    if (node.axis === "vertical") {
      const childWidth = widthMm * share;
      rects.push(
        ...layoutNode(
          child,
          xMm + cursor,
          yMm,
          childWidth,
          heightMm,
          node.axis,
          index,
          node.children.length,
        ),
      );
      cursor += childWidth;
    } else {
      const childHeight = heightMm * share;
      const topOffset = heightMm - cursor - childHeight;
      rects.push(
        ...layoutNode(
          child,
          xMm,
          yMm + topOffset,
          widthMm,
          childHeight,
          node.axis,
          index,
          node.children.length,
        ),
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
  return layoutNode(structure.root, 0, 0, width, height).map((rect, index) => ({
    ...rect,
    widthMm: Math.max(1, rect.widthMm),
    heightMm: Math.max(1, rect.heightMm),
    markerIndex: index,
  }));
}

/** Full elevation face engineering layout for a cabinet config. */
export function layoutCabinetElevationFace(
  config: CabinetConfig,
): CabinetElevationFaceLayout {
  const composition = resolveCabinetComposition(config);
  const carcassWidthMm = config.dimensions.width;
  const carcassHeightMm = config.dimensions.height;
  const boardThicknessMm = Math.max(12, config.dimensions.boardThickness ?? 18);
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

  // Carcass boards inset the clear opening (shop-drawing segmentation).
  const faceInsetLeftMm = Math.min(boardThicknessMm, faceWidthMm * 0.2);
  const faceInsetRightMm = faceInsetLeftMm;
  const faceInsetTopMm = Math.min(boardThicknessMm, faceHeightMm * 0.2);
  const faceInsetBottomMm = Math.min(boardThicknessMm, faceHeightMm * 0.2);
  const clearWidthMm = Math.max(
    1,
    faceWidthMm - faceInsetLeftMm - faceInsetRightMm,
  );
  const clearHeightMm = Math.max(
    1,
    faceHeightMm - faceInsetTopMm - faceInsetBottomMm,
  );

  const structure = composition.openingStructure
    ? normalizeOpeningStructure(
        config.type,
        composition.openingStructure,
        clearWidthMm,
      )
    : null;
  const rawOpenings = structure
    ? layoutOpeningStructure(structure, clearWidthMm, clearHeightMm)
    : [];
  const openings = rawOpenings.map((opening, index) => ({
    ...opening,
    xMm: opening.xMm + faceInsetLeftMm,
    yMm: opening.yMm + faceInsetBottomMm,
    markerIndex: index,
  }));

  return {
    carcassWidthMm,
    carcassHeightMm,
    toeKickHeightMm,
    leftFillerMm,
    rightFillerMm,
    leftEndPanel: composition.endPanels.left,
    rightEndPanel: composition.endPanels.right,
    boardThicknessMm,
    faceInsetLeftMm,
    faceInsetRightMm,
    faceInsetTopMm,
    faceInsetBottomMm,
    faceWidthMm,
    faceHeightMm,
    clearWidthMm,
    clearHeightMm,
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
