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
import { faceToSvg, line, rect, text } from "./svgPrimitives";

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
  const count = Math.max(1, opening.drawerCount || 1);
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
  const sideGap = elevMm(scale, ELEV_DRAWER_SIDE_MM);
  const centerGap = elevMm(scale, ELEV_DRAWER_GAP_MM);
  const bottomGap = elevMm(scale, ELEV_DRAWER_BOTTOM_MM);
  const topGap = elevMm(scale, ELEV_DRAWER_GAP_MM);

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
  const available = Math.max(
    count * 4,
    height - topGap - bottomGap - centerGap * (count - 1),
  );
  const ratios =
    opening.drawerRatios?.length === count
      ? opening.drawerRatios
      : Array.from({ length: count }, () => 1 / count);
  const frontW = Math.max(2, width - sideGap * 2);

  let drawerCursor = topLeft.y + topGap;
  for (let index = 0; index < count; index += 1) {
    const drawerH = available * (ratios[index] ?? 1 / count);
    const dy = drawerCursor;
    elements.push(
      rect(
        topLeft.x + sideGap,
        dy,
        frontW,
        drawerH,
        `${openingHitAttrs(cabinet.id, opening.id, opening.contentType, active)} data-drawer-index="${index}"`,
      ),
    );
    elements.push(
      rect(
        topLeft.x + sideGap,
        dy,
        frontW,
        drawerH,
        `class="twod-drawer-front-edge" fill="none" pointer-events="none"`,
      ),
    );
    elements.push(
      line(
        topLeft.x + sideGap,
        dy,
        topLeft.x + sideGap + frontW,
        dy,
        `class="twod-drawer-reveal twod-line-reference" pointer-events="none"`,
      ),
    );
    // Side box depth cue
    elements.push(
      line(
        topLeft.x + sideGap,
        dy + elevMm(scale, 6),
        topLeft.x + sideGap + elevMm(scale, 10),
        dy + elevMm(scale, 6),
        `class="twod-line-hidden twod-drawer-box-cue" pointer-events="none"`,
      ),
    );
    const pullY = dy + drawerH / 2;
    const pullW = Math.min(frontW * 0.32, elevMm(scale, 140));
    elements.push(
      line(
        topLeft.x + width / 2 - pullW / 2,
        pullY,
        topLeft.x + width / 2 + pullW / 2,
        pullY,
        `class="twod-cabinet-opening twod-drawer-pull" pointer-events="none"`,
      ),
    );
    if (drawerH > elevMm(scale, 80) && frontW > elevMm(scale, 120)) {
      elements.push(
        text(
          topLeft.x + sideGap + elevMm(scale, 8),
          dy + elevMm(scale, 14),
          `D${index + 1}`,
          `class="twod-drawer-index" font-size="5.5" pointer-events="none"`,
        ),
      );
    }
    drawerCursor += drawerH + centerGap;
  }
  return elements;
}
