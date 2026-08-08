import type { CabinetInstance } from "./cabinetDimensions";
import {
  layoutCabinetElevationFace,
  type CabinetElevationFaceLayout,
  type OpeningFaceRect,
} from "./openingLayout";

type ElevationSvgOptions = {
  showDetails?: boolean;
  activeOpeningId?: string | null;
  scale: number;
};

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  attrs: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs} />`;
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  attrs: string,
) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs} />`;
}

/** Convert face-local mm (origin bottom-left of carcass) to SVG within cabinet box. */
function faceToSvg(
  faceXMm: number,
  faceYMm: number,
  cabinetSvgX: number,
  cabinetSvgY: number,
  carcassHeightMm: number,
  scale: number,
) {
  return {
    x: cabinetSvgX + faceXMm / scale,
    y: cabinetSvgY + (carcassHeightMm - faceYMm) / scale,
  };
}

function renderDoorLeaf(
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

function renderDrawerStack(
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

function renderOpenShelf(
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

function renderDividerOrEmpty(
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

/**
 * Draw engineered cabinet face details for front/side elevation.
 * Coordinates: cabinetSvgX/Y is top-left of the carcass box in SVG space.
 */
export function renderElevationFaceGraphics(
  cabinet: CabinetInstance,
  cabinetSvgX: number,
  cabinetSvgY: number,
  cabinetSvgWidth: number,
  cabinetSvgHeight: number,
  options: ElevationSvgOptions,
): string[] {
  const elements: string[] = [];
  if (options.showDetails === false) return elements;

  const layout = layoutCabinetElevationFace(cabinet.config);
  const scale = options.scale;
  const activeId =
    options.activeOpeningId ?? layout.activeOpeningId ?? null;

  // Toe kick band
  if (layout.toeKickHeightMm > 0) {
    const toeH = layout.toeKickHeightMm / scale;
    elements.push(
      rect(
        cabinetSvgX,
        cabinetSvgY + cabinetSvgHeight - toeH,
        cabinetSvgWidth,
        toeH,
        `class="twod-toe-kick" fill="rgba(68,64,60,0.18)" stroke="#57534e" stroke-width="1" pointer-events="none"`,
      ),
    );
    elements.push(
      line(
        cabinetSvgX,
        cabinetSvgY + cabinetSvgHeight - toeH,
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY + cabinetSvgHeight - toeH,
        `class="twod-toe-kick-line" stroke="#57534e" stroke-width="1.1" pointer-events="none"`,
      ),
    );
  }

  // Carcass fillers
  if (layout.leftFillerMm > 0) {
    const w = layout.leftFillerMm / scale;
    elements.push(
      rect(
        cabinetSvgX,
        cabinetSvgY,
        w,
        cabinetSvgHeight - layout.toeKickHeightMm / scale,
        `class="twod-filler" fill="rgba(148,163,184,0.35)" stroke="#64748b" stroke-width="0.9" pointer-events="none"`,
      ),
    );
  }
  if (layout.rightFillerMm > 0) {
    const w = layout.rightFillerMm / scale;
    elements.push(
      rect(
        cabinetSvgX + cabinetSvgWidth - w,
        cabinetSvgY,
        w,
        cabinetSvgHeight - layout.toeKickHeightMm / scale,
        `class="twod-filler" fill="rgba(148,163,184,0.35)" stroke="#64748b" stroke-width="0.9" pointer-events="none"`,
      ),
    );
  }

  // End panels as thicker outer edges
  if (layout.leftEndPanel) {
    elements.push(
      rect(
        cabinetSvgX - 3,
        cabinetSvgY,
        3,
        cabinetSvgHeight,
        `class="twod-end-panel" fill="#78716c" stroke="#44403c" stroke-width="0.6" pointer-events="none"`,
      ),
    );
  }
  if (layout.rightEndPanel) {
    elements.push(
      rect(
        cabinetSvgX + cabinetSvgWidth,
        cabinetSvgY,
        3,
        cabinetSvgHeight,
        `class="twod-end-panel" fill="#78716c" stroke="#44403c" stroke-width="0.6" pointer-events="none"`,
      ),
    );
  }

  for (const opening of layout.openings) {
    const active = activeId === opening.id;
    if (opening.contentType === "door") {
      elements.push(
        ...renderDoorLeaf(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else if (opening.contentType === "drawer-stack") {
      elements.push(
        ...renderDrawerStack(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else if (opening.contentType === "open-shelf") {
      elements.push(
        ...renderOpenShelf(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    } else {
      elements.push(
        ...renderDividerOrEmpty(
          opening,
          cabinet,
          cabinetSvgX,
          cabinetSvgY,
          layout,
          scale,
          active,
        ),
      );
    }
  }

  return elements;
}

export function describeElevationFace(layout: CabinetElevationFaceLayout): string {
  return `${layout.openings.length} openings · face ${Math.round(layout.faceWidthMm)}×${Math.round(layout.faceHeightMm)} · toe ${layout.toeKickHeightMm}`;
}
