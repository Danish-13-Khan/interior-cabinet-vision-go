import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import type { OpeningContentType } from "../cabinetOpeningStructure";
import {
  elevBifoldFolds,
  elevDoorSwingArc,
  handleSideForLeaf,
  hingeSideForLeaf,
  resolveDoorLeafCount,
} from "../constructionGraphics";
import { faceToSvg, line, rect } from "./svgPrimitives";

function openingHitAttrs(
  cabinetId: string,
  openingId: string,
  contentType: OpeningContentType,
  active: boolean,
  extra: string,
) {
  return `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinetId}" data-opening-id="${openingId}" data-content-type="${contentType}" ${extra}`;
}

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
  const gap = 2 / scale;
  const style = opening.doorStyle ?? "double";
  const doorCount = resolveDoorLeafCount(style, opening.widthMm);
  if (doorCount === 0) return elements;

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
  const doorW = (width - gap * (doorCount + 1)) / doorCount;
  const leafXs: number[] = [];
  const hinge = opening.doorHinge;

  for (let index = 0; index < doorCount; index += 1) {
    const dx = topLeft.x + gap + index * (doorW + gap);
    const dy = topLeft.y + gap;
    const dh = height - gap * 2;
    leafXs.push(dx);
    elements.push(
      rect(
        dx,
        dy,
        doorW,
        dh,
        openingHitAttrs(
          cabinet.id,
          opening.id,
          opening.contentType,
          active,
          `fill="rgba(255,255,255,0.22)"`,
        ),
      ),
    );

    const handleSide = handleSideForLeaf(hinge, index, doorCount);
    const handleX = handleSide === "right" ? dx + doorW - 4 : dx + 4;
    elements.push(
      line(
        handleX,
        dy + dh * 0.42,
        handleX,
        dy + dh * 0.58,
        `class="twod-cabinet-opening twod-door-handle" pointer-events="none"`,
      ),
    );

    // Hinge ticks
    const hingeSide = hingeSideForLeaf(hinge, index, doorCount);
    const hx = hingeSide === "left" ? dx + 1.2 : dx + doorW - 1.2;
    for (const t of [0.2, 0.5, 0.8]) {
      elements.push(
        line(
          hx - 1.2,
          dy + dh * t,
          hx + 1.2,
          dy + dh * t,
          `class="twod-door-hinge twod-line-reference" pointer-events="none"`,
        ),
      );
    }

    // Swing arcs for outer leaves only (skip inner bifold panels)
    if (doorCount <= 2 || index === 0 || index === doorCount - 1) {
      elements.push(elevDoorSwingArc(dx, dy, doorW, dh, hingeSide));
    }
  }

  if (style === "bi-fold" && leafXs.length > 1) {
    elements.push(
      ...elevBifoldFolds(
        leafXs.map((x, i) => x + (i === 0 ? doorW : 0)),
        topLeft.y + gap,
        height - gap * 2,
      ),
    );
  }

  return elements;
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
  const count = Math.max(1, opening.drawerCount || 1);
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
  const reveal = 2.5 / scale;
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
  const drawerH = height / count;

  for (let index = 0; index < count; index += 1) {
    const dy = topLeft.y + index * drawerH;
    elements.push(
      rect(
        topLeft.x + reveal,
        dy + reveal * 0.6,
        width - reveal * 2,
        drawerH - reveal * 1.2,
        openingHitAttrs(
          cabinet.id,
          opening.id,
          opening.contentType,
          active,
          `fill="rgba(255,255,255,0.22)"`,
        ),
      ),
    );
    // Front face highlight line
    elements.push(
      line(
        topLeft.x + reveal,
        dy + reveal * 0.6,
        topLeft.x + width - reveal,
        dy + reveal * 0.6,
        `class="twod-drawer-reveal twod-line-reference" pointer-events="none"`,
      ),
    );
    const pullY = dy + drawerH / 2;
    const pullW = Math.min(width * 0.35, 14 / scale);
    elements.push(
      line(
        topLeft.x + width / 2 - pullW,
        pullY,
        topLeft.x + width / 2 + pullW,
        pullY,
        `class="twod-cabinet-opening twod-drawer-pull" pointer-events="none"`,
      ),
    );
  }
  return elements;
}

export function renderOpenShelf(
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
  elements.push(
    rect(
      topLeft.x,
      topLeft.y,
      width,
      height,
      openingHitAttrs(
        cabinet.id,
        opening.id,
        opening.contentType,
        active,
        `fill="rgba(248,250,252,0.35)"`,
      ),
    ),
  );
  const shelves = Math.max(0, opening.shelfCount);
  const shelfThick = Math.max(1.1, 3 / scale);
  for (let index = 1; index <= shelves; index += 1) {
    const sy = topLeft.y + (height * index) / (shelves + 1);
    elements.push(
      rect(
        topLeft.x + 2 / scale,
        sy - shelfThick / 2,
        width - 4 / scale,
        shelfThick,
        `class="twod-shelf-board" pointer-events="none"`,
      ),
      line(
        topLeft.x + 2 / scale,
        sy,
        topLeft.x + width - 2 / scale,
        sy,
        `class="twod-cabinet-opening twod-shelf-line twod-line-interior" pointer-events="none"`,
      ),
    );
    // Adjustable shelf pin ticks (hidden convention)
    elements.push(
      line(
        topLeft.x + 3 / scale,
        sy - 2,
        topLeft.x + 3 / scale,
        sy + 2,
        `class="twod-shelf-pin twod-line-hidden" pointer-events="none"`,
      ),
      line(
        topLeft.x + width - 3 / scale,
        sy - 2,
        topLeft.x + width - 3 / scale,
        sy + 2,
        `class="twod-shelf-pin twod-line-hidden" pointer-events="none"`,
      ),
    );
  }
  return elements;
}

export function renderDividerOrEmpty(
  opening: OpeningFaceRect,
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  layout: CabinetElevationFaceLayout,
  scale: number,
  active: boolean,
): string[] {
  const faceOriginX = layout.leftFillerMm;
  const faceOriginY = layout.toeKickHeightMm;
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
  if (opening.contentType === "divider") {
    return [
      rect(
        topLeft.x + width / 2 - 2 / scale,
        topLeft.y,
        4 / scale,
        height,
        openingHitAttrs(
          cabinet.id,
          opening.id,
          opening.contentType,
          active,
          `fill="#8a8680"`,
        ),
      ),
    ];
  }
  return [
    rect(
      topLeft.x,
      topLeft.y,
      width,
      height,
      openingHitAttrs(
        cabinet.id,
        opening.id,
        opening.contentType,
        active,
        `fill="rgba(255,255,255,0.12)"`,
      ),
    ),
  ];
}
