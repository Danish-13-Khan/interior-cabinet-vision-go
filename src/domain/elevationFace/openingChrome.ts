import type {
  CabinetElevationFaceLayout,
  OpeningFaceRect,
} from "../openingLayout";
import { ELEVATION_CONTENT_SHORT_LABELS } from "../elevationOpeningEdit";
import { faceToSvg, line, rect, text } from "./svgPrimitives";

function openingSvgBox(
  opening: OpeningFaceRect,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
) {
  const ox = layout.leftFillerMm + opening.xMm;
  const oy = layout.toeKickHeightMm + opening.yMm;
  const topLeft = faceToSvg(
    ox,
    oy + opening.heightMm,
    cabinetSvgX,
    cabinetSvgY,
    layout.carcassHeightMm,
    scale,
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: opening.widthMm / scale,
    height: opening.heightMm / scale,
  };
}

function nearlyEqual(a: number, b: number, epsilon = 0.6) {
  return Math.abs(a - b) <= epsilon;
}

function sharedBoundary(
  a: OpeningFaceRect,
  b: OpeningFaceRect,
): { axis: "vertical" | "horizontal"; xMm: number; yMm: number; lengthMm: number } | null {
  const aRight = a.xMm + a.widthMm;
  const aTop = a.yMm + a.heightMm;
  const bRight = b.xMm + b.widthMm;
  const bTop = b.yMm + b.heightMm;

  if (nearlyEqual(aRight, b.xMm) || nearlyEqual(bRight, a.xMm)) {
    const xMm = nearlyEqual(aRight, b.xMm) ? aRight : bRight;
    const yStart = Math.max(a.yMm, b.yMm);
    const yEnd = Math.min(aTop, bTop);
    if (yEnd - yStart > 1) {
      return { axis: "vertical", xMm, yMm: yStart, lengthMm: yEnd - yStart };
    }
  }

  if (nearlyEqual(aTop, b.yMm) || nearlyEqual(bTop, a.yMm)) {
    const yMm = nearlyEqual(aTop, b.yMm) ? aTop : bTop;
    const xStart = Math.max(a.xMm, b.xMm);
    const xEnd = Math.min(aRight, bRight);
    if (xEnd - xStart > 1) {
      return { axis: "horizontal", xMm: xStart, yMm, lengthMm: xEnd - xStart };
    }
  }

  return null;
}

export function renderOpeningBoundaries(
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
): string[] {
  const elements: string[] = [];
  const openings = layout.openings;
  for (let i = 0; i < openings.length; i += 1) {
    for (let j = i + 1; j < openings.length; j += 1) {
      const boundary = sharedBoundary(openings[i]!, openings[j]!);
      if (!boundary) continue;
      const faceOriginX = layout.leftFillerMm;
      const faceOriginY = layout.toeKickHeightMm;
      if (boundary.axis === "vertical") {
        const top = faceToSvg(
          faceOriginX + boundary.xMm,
          faceOriginY + boundary.yMm + boundary.lengthMm,
          cabinetSvgX,
          cabinetSvgY,
          layout.carcassHeightMm,
          scale,
        );
        const bottom = faceToSvg(
          faceOriginX + boundary.xMm,
          faceOriginY + boundary.yMm,
          cabinetSvgX,
          cabinetSvgY,
          layout.carcassHeightMm,
          scale,
        );
        elements.push(
          line(
            top.x,
            top.y,
            bottom.x,
            bottom.y,
            `class="twod-opening-boundary" stroke="#1e293b" stroke-width="1.35" stroke-dasharray="4 2" pointer-events="none"`,
          ),
        );
      } else {
        const left = faceToSvg(
          faceOriginX + boundary.xMm,
          faceOriginY + boundary.yMm,
          cabinetSvgX,
          cabinetSvgY,
          layout.carcassHeightMm,
          scale,
        );
        const right = faceToSvg(
          faceOriginX + boundary.xMm + boundary.lengthMm,
          faceOriginY + boundary.yMm,
          cabinetSvgX,
          cabinetSvgY,
          layout.carcassHeightMm,
          scale,
        );
        elements.push(
          line(
            left.x,
            left.y,
            right.x,
            right.y,
            `class="twod-opening-boundary" stroke="#1e293b" stroke-width="1.35" stroke-dasharray="4 2" pointer-events="none"`,
          ),
        );
      }
    }
  }
  return elements;
}

export function renderOpeningChrome(
  opening: OpeningFaceRect,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
  active: boolean,
): string[] {
  const box = openingSvgBox(opening, layout, cabinetSvgX, cabinetSvgY, scale);
  const elements: string[] = [];
  const contentLabel = ELEVATION_CONTENT_SHORT_LABELS[opening.contentType];
  const sizeLabel = `${Math.round(opening.widthMm)}×${Math.round(opening.heightMm)}`;

  elements.push(
    rect(
      box.x,
      box.y,
      box.width,
      box.height,
      `class="twod-opening-chrome ${active ? "is-active-opening" : ""}" data-opening-chrome="${opening.id}" fill="none" stroke="${active ? "#1d4ed8" : "#57534e"}" stroke-width="${active ? 2 : 1.05}" pointer-events="none"`,
    ),
  );

  if (active) {
    const tick = 5;
    const corners: Array<[number, number, number, number]> = [
      [box.x, box.y, box.x + tick, box.y],
      [box.x, box.y, box.x, box.y + tick],
      [box.x + box.width, box.y, box.x + box.width - tick, box.y],
      [box.x + box.width, box.y, box.x + box.width, box.y + tick],
      [box.x, box.y + box.height, box.x + tick, box.y + box.height],
      [box.x, box.y + box.height, box.x, box.y + box.height - tick],
      [box.x + box.width, box.y + box.height, box.x + box.width - tick, box.y + box.height],
      [box.x + box.width, box.y + box.height, box.x + box.width, box.y + box.height - tick],
    ];
    for (const [x1, y1, x2, y2] of corners) {
      elements.push(
        line(
          x1,
          y1,
          x2,
          y2,
          `class="twod-opening-active-tick" stroke="#1d4ed8" stroke-width="2" pointer-events="none"`,
        ),
      );
    }
  }

  if (box.width > 36 && box.height > 22) {
    elements.push(
      text(
        box.x + box.width / 2,
        box.y + Math.min(14, box.height * 0.28),
        escapeXml(`${opening.label} · ${contentLabel}`),
        `class="twod-opening-label" text-anchor="middle" font-size="9" font-weight="650" fill="${active ? "#1e3a8a" : "#334155"}" pointer-events="none"`,
      ),
    );
    if (box.height > 34) {
      elements.push(
        text(
          box.x + box.width / 2,
          box.y + Math.min(26, box.height * 0.48),
          escapeXml(sizeLabel),
          `class="twod-opening-size" text-anchor="middle" font-size="8" fill="#64748b" pointer-events="none"`,
        ),
      );
    }
  }

  return elements;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
