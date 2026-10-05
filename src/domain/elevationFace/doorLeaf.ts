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
import { faceRectToSvg, leafSpan, resolvedOpeningFronts } from "./resolvedFronts";
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
  const style = opening.doorStyle ?? "double";
  const doorCount = resolveDoorLeafCount(style, opening.widthMm);
  if (doorCount === 0) return elements;

  const resolved = resolvedOpeningFronts(cabinet.config, opening.id);
  const span = resolved ? leafSpan(resolved.leaves) : null;
  const centerGap = elevMm(scale, resolved?.centerMm ?? ELEV_DOOR_GAPS.centerMm);
  const row = span
    ? faceRectToSvg(span, layout, cabinetSvgX, cabinetSvgY, scale)
    : fallbackRow(opening, layout, cabinetSvgX, cabinetSvgY, scale);
  const doorW = Math.max(2, (row.width - centerGap * Math.max(0, doorCount - 1)) / doorCount);
  const doorH = Math.max(2, row.height);
  const dy = row.y;
  const leafXs: number[] = [];
  const hinge = opening.doorHinge;

  for (let index = 0; index < doorCount; index += 1) {
    const dx = row.x + index * (doorW + centerGap);
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
    if (!span?.golaGrip && !span?.pushOpen) {
      elements.push(
        line(
          handleX,
          dy + doorH / 2 - handleH / 2,
          handleX,
          dy + doorH / 2 + handleH / 2,
          `class="twod-cabinet-opening twod-door-handle" pointer-events="none"`,
        ),
      );
    }

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
        dy,
        doorH,
      ),
    );
  }

  return elements;
}

/** Openings the resolver does not front (unsupported types) keep the overlay-gap sketch. */
function fallbackRow(
  opening: OpeningFaceRect,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
) {
  const sideGap = elevMm(scale, ELEV_DOOR_GAPS.sideMm);
  const bottomGap = elevMm(scale, ELEV_DOOR_GAPS.bottomMm);
  const topLeft = faceToSvg(
    layout.leftFillerMm + opening.xMm,
    layout.toeKickHeightMm + opening.yMm + opening.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  return {
    x: topLeft.x + sideGap,
    y: topLeft.y + sideGap,
    width: opening.widthMm / scale - sideGap * 2,
    height: opening.heightMm / scale - sideGap - bottomGap,
  };
}
