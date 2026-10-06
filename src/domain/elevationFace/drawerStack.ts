import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import {
  ELEV_DRAWER_BOTTOM_MM,
  ELEV_DRAWER_GAP_MM,
  ELEV_DRAWER_SIDE_MM,
  elevMm,
  openingHitAttrs,
} from "./faceMetrics";
import { faceRectToSvg, resolvedOpeningFronts } from "./resolvedFronts";
import { faceToSvg, line, rect, text } from "./svgPrimitives";

type DrawerBox = { x: number; y: number; width: number; height: number; golaGrip: boolean; pushOpen: boolean };

/** Top-first drawer fronts in SVG space, sized by the production resolver when it fronts this opening. */
function drawerBoxes(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
): DrawerBox[] {
  const resolved = resolvedOpeningFronts(cabinet.config, opening.id);
  if (resolved) {
    return [...resolved.leaves].reverse().map((leaf) => ({
      ...faceRectToSvg(leaf, layout, cabinetSvgX, cabinetSvgY, scale),
      golaGrip: Boolean(leaf.golaGrip),
      // Push-open and drawers behind sliding shutters both draw without a pull.
      pushOpen: Boolean(leaf.pushOpen || leaf.behindSliding),
    }));
  }
  const count = Math.max(1, opening.drawerCount || 1);
  const sideGap = elevMm(scale, ELEV_DRAWER_SIDE_MM);
  const centerGap = elevMm(scale, ELEV_DRAWER_GAP_MM);
  const bottomGap = elevMm(scale, ELEV_DRAWER_BOTTOM_MM);
  const topLeft = faceToSvg(
    layout.leftFillerMm + opening.xMm,
    layout.toeKickHeightMm + opening.yMm + opening.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  const width = opening.widthMm / scale;
  const height = opening.heightMm / scale;
  const available = Math.max(count * 4, height - centerGap - bottomGap - centerGap * (count - 1));
  const ratios = opening.drawerRatios?.length === count
    ? opening.drawerRatios
    : Array.from({ length: count }, () => 1 / count);
  let cursor = topLeft.y + centerGap;
  return ratios.map((ratio) => {
    const box = { x: topLeft.x + sideGap, y: cursor, width: Math.max(2, width - sideGap * 2), height: available * ratio, golaGrip: false, pushOpen: false };
    cursor += box.height + centerGap;
    return box;
  });
}

export function renderDrawerStack(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  active: boolean,
): string[] {
  const elements: string[] = [];
  drawerBoxes(opening, cabinet, cabinetSvgX, cabinetSvgY, layout, scale).forEach((box, index) => {
    const { x, y: dy, width: frontW, height: drawerH } = box;
    elements.push(
      rect(
        x,
        dy,
        frontW,
        drawerH,
        `${openingHitAttrs(cabinet.id, opening.id, opening.contentType, active)} data-drawer-index="${index}"`,
      ),
    );
    elements.push(
      rect(
        x,
        dy,
        frontW,
        drawerH,
        `class="twod-drawer-front-edge" fill="none" pointer-events="none"`,
      ),
    );
    elements.push(
      line(
        x,
        dy,
        x + frontW,
        dy,
        `class="twod-drawer-reveal twod-line-reference" pointer-events="none"`,
      ),
    );
    // Side box depth cue
    elements.push(
      line(
        x,
        dy + elevMm(scale, 6),
        x + elevMm(scale, 10),
        dy + elevMm(scale, 6),
        `class="twod-line-hidden twod-drawer-box-cue" pointer-events="none"`,
      ),
    );
    if (!box.golaGrip && !box.pushOpen) {
      const pullY = dy + drawerH / 2;
      const pullW = Math.min(frontW * 0.32, elevMm(scale, 140));
      elements.push(
        line(
          x + frontW / 2 - pullW / 2,
          pullY,
          x + frontW / 2 + pullW / 2,
          pullY,
          `class="twod-cabinet-opening twod-drawer-pull" pointer-events="none"`,
        ),
      );
    }
    if (drawerH > elevMm(scale, 80) && frontW > elevMm(scale, 120)) {
      elements.push(
        text(
          x + elevMm(scale, 8),
          dy + elevMm(scale, 14),
          `D${index + 1}`,
          `class="twod-drawer-index" font-size="5.5" pointer-events="none"`,
        ),
      );
    }
  });
  return elements;
}
