import type { CabinetInstance } from "../cabinetDimensions";
import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
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
  const gap = 2 / scale;
  const style = opening.doorStyle ?? "double";
  const doorCount =
    style === "single" || opening.widthMm < 600
      ? 1
      : style === "none"
        ? 0
        : 2;
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

  for (let index = 0; index < doorCount; index += 1) {
    const dx = topLeft.x + gap + index * (doorW + gap);
    const dy = topLeft.y + gap;
    const dh = height - gap * 2;
    elements.push(
      rect(
        dx,
        dy,
        doorW,
        dh,
        `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinet.id}" data-opening-id="${opening.id}" fill="rgba(255,255,255,0.35)" stroke="${active ? "#1d4ed8" : "#44403c"}" stroke-width="${active ? 1.6 : 1.05}"`,
      ),
    );
    const handleX =
      index === 0 && doorCount === 2 ? dx + doorW - 4 : dx + 4;
    elements.push(
      line(
        handleX,
        dy + dh * 0.45,
        handleX,
        dy + dh * 0.55,
        `class="twod-cabinet-opening" stroke="#292524" stroke-width="1.5" pointer-events="none"`,
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
        topLeft.x + 2 / scale,
        dy + 1 / scale,
        width - 4 / scale,
        drawerH - 2 / scale,
        `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinet.id}" data-opening-id="${opening.id}" fill="rgba(255,255,255,0.28)" stroke="${active ? "#1d4ed8" : "#44403c"}" stroke-width="${active ? 1.6 : 1.05}"`,
      ),
    );
    elements.push(
      line(
        topLeft.x + width / 2 - 8 / scale,
        dy + drawerH / 2,
        topLeft.x + width / 2 + 8 / scale,
        dy + drawerH / 2,
        `class="twod-cabinet-opening" stroke="#292524" stroke-width="1.4" pointer-events="none"`,
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
      `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinet.id}" data-opening-id="${opening.id}" fill="rgba(248,250,252,0.5)" stroke="${active ? "#1d4ed8" : "#78716c"}" stroke-width="${active ? 1.5 : 1}" stroke-dasharray="3 2"`,
    ),
  );
  const shelves = Math.max(0, opening.shelfCount);
  for (let index = 1; index <= shelves; index += 1) {
    const sy = topLeft.y + (height * index) / (shelves + 1);
    elements.push(
      line(
        topLeft.x + 2 / scale,
        sy,
        topLeft.x + width - 2 / scale,
        sy,
        `class="twod-cabinet-opening" stroke="#78716c" stroke-width="0.9" stroke-dasharray="3 2" pointer-events="none"`,
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
        `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinet.id}" data-opening-id="${opening.id}" fill="${active ? "#93c5fd" : "#a8a29e"}" stroke="#44403c" stroke-width="0.8"`,
      ),
    ];
  }
  return [
    rect(
      topLeft.x,
      topLeft.y,
      width,
      height,
      `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinet.id}" data-opening-id="${opening.id}" fill="rgba(255,255,255,0.15)" stroke="${active ? "#1d4ed8" : "#a8a29e"}" stroke-width="1" stroke-dasharray="2 2"`,
    ),
  ];
}
