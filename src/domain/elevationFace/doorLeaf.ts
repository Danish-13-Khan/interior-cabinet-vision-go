import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import {
  elevBifoldFolds,
  elevDoorSwingArc,
  handleSideForLeaf,
  hingeSideForLeaf,
  resolveDoorLeafCount,
} from "../constructionGraphics";
import { ELEV_DOOR_GAPS, elevMm, openingHitAttrs } from "./faceMetrics";
import { faceToSvg, line, rect } from "./svgPrimitives";

export function renderDoorLeaf(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  active: boolean,
): string[] {
  const elements: string[] = [];
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
  const style = opening.doorStyle ?? "double";
  const doorCount = resolveDoorLeafCount(style, opening.widthMm);
  if (doorCount === 0) return elements;

  const sideGap = elevMm(scale, ELEV_DOOR_GAPS.sideMm);
  const centerGap = elevMm(scale, ELEV_DOOR_GAPS.centerMm);
  const bottomGap = elevMm(scale, ELEV_DOOR_GAPS.bottomMm);
  const topGap = elevMm(scale, ELEV_DOOR_GAPS.sideMm);

  const ox = faceOriginX + opening.xMm;
  const oy = faceOriginY + opening.yMm;
  const topLeft = faceToSvg(
    ox,
    oy + opening.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  const width = opening.widthMm / scale;
  const height = opening.heightMm / scale;
  const gapsTotal = sideGap * 2 + centerGap * Math.max(0, doorCount - 1);
  const doorW = Math.max(2, (width - gapsTotal) / doorCount);
  const doorH = Math.max(2, height - topGap - bottomGap);
  const leafXs: number[] = [];
  const hinge = opening.doorHinge;

  for (let index = 0; index < doorCount; index += 1) {
    const dx = topLeft.x + sideGap + index * (doorW + centerGap);
    const dy = topLeft.y + topGap;
    leafXs.push(dx);
    elements.push(
      rect(
        dx,
        dy,
        doorW,
        doorH,
        `${openingHitAttrs(cabinet.id, opening.id, opening.contentType, active)} data-leaf-index="${index}"`,
      ),
    );
    elements.push(
      rect(
        dx,
        dy,
        doorW,
        doorH,
        `class="twod-door-leaf-edge" fill="none" pointer-events="none"`,
      ),
    );

    const handleSide = handleSideForLeaf(hinge, index, doorCount);
    const handleX =
      handleSide === "right"
        ? dx + doorW - elevMm(scale, 28)
        : dx + elevMm(scale, 28);
    const handleH = Math.min(doorH * 0.22, elevMm(scale, 120));
    elements.push(
      line(
        handleX,
        dy + doorH / 2 - handleH / 2,
        handleX,
        dy + doorH / 2 + handleH / 2,
        `class="twod-cabinet-opening twod-door-handle" pointer-events="none"`,
      ),
    );

    const hingeSide = hingeSideForLeaf(hinge, index, doorCount);
    const hx =
      hingeSide === "left"
        ? dx + elevMm(scale, 8)
        : dx + doorW - elevMm(scale, 8);
    for (const t of [0.18, 0.5, 0.82]) {
      elements.push(
        line(
          hx - elevMm(scale, 10),
          dy + doorH * t,
          hx + elevMm(scale, 10),
          dy + doorH * t,
          `class="twod-door-hinge twod-line-reference" pointer-events="none"`,
        ),
      );
    }

    if (doorCount <= 2 || index === 0 || index === doorCount - 1) {
      elements.push(elevDoorSwingArc(dx, dy, doorW, doorH, hingeSide));
    }
  }

  if (style === "bi-fold" && leafXs.length > 1) {
    elements.push(
      ...elevBifoldFolds(
        leafXs.map((x, i) => x + (i === 0 ? doorW : 0)),
        topLeft.y + topGap,
        doorH,
      ),
    );
  }

  return elements;
}
