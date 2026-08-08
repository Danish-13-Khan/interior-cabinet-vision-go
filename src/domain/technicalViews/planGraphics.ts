import { SCALE } from "./constants";
import { line, rect, text } from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";
import { resolveDisplay } from "./viewLayers";
import type { RoomConfig } from "../roomModel";
import { formatOpeningTag } from "../draftingAnnotations";

type PlanOpeningSide = "back-wall" | "left-wall" | "right-wall";

function planOpeningRect(
  ox: number,
  oy: number,
  rw: number,
  rd: number,
  side: PlanOpeningSide,
  positionMm: number,
  widthMm: number,
  kind: "door" | "window",
) {
  const dx =
    side === "back-wall"
      ? ox + positionMm / SCALE
      : side === "left-wall"
        ? ox - rw / SCALE / 2 - 5
        : ox + rw / SCALE / 2 + 1;
  const dy =
    side === "back-wall" ? oy - rd / SCALE / 2 - 5 : oy + positionMm / SCALE;
  const dw = side === "back-wall" ? widthMm / SCALE : 3.5;
  const dh = side === "back-wall" ? 3.5 : widthMm / SCALE;
  return {
    x: dx - dw / 2,
    y: dy - dh / 2,
    w: dw,
    h: dh,
    cx: dx,
    cy: dy,
    cls: kind === "door" ? "twod-opening twod-opening-door" : "twod-opening twod-opening-window",
  };
}

export function planRoomOutline(
  ox: number,
  oy: number,
  rw: number,
  rd: number,
  showWallLabels: boolean,
) {
  const left = ox - rw / SCALE / 2;
  const top = oy - rd / SCALE / 2;
  const w = rw / SCALE;
  const d = rd / SCALE;
  const elements = [
    rect(left, top, w, d, `class="twod-wall twod-wall-outline twod-plan-floor"`),
    // Inner face for wall thickness read
    rect(
      left + 1.5,
      top + 1.5,
      Math.max(2, w - 3),
      Math.max(2, d - 3),
      `class="twod-wall twod-wall-inner"`,
    ),
  ];
  if (showWallLabels) {
    elements.push(
      text(
        ox,
        top - 6,
        "BACK WALL",
        `class="twod-wall-label" font-size="7" text-anchor="middle"`,
      ),
      text(
        ox,
        top + d + 11,
        "FRONT",
        `class="twod-wall-label" font-size="7" text-anchor="middle"`,
      ),
      text(
        left - 8,
        oy,
        "LEFT",
        `class="twod-wall-label" font-size="7" text-anchor="middle" transform="rotate(-90 ${left - 8} ${oy})"`,
      ),
      text(
        left + w + 10,
        oy,
        "RIGHT",
        `class="twod-wall-label" font-size="7" text-anchor="middle" transform="rotate(90 ${left + w + 10} ${oy})"`,
      ),
    );
  }
  return elements;
}

export function planOpeningsGraphics(
  room: RoomConfig,
  ox: number,
  oy: number,
  options: TechnicalViewOptions,
) {
  const display = resolveDisplay(options);
  const rw = room.dimensions.widthMm;
  const rd = room.dimensions.depthMm;
  const elements: string[] = [];

  for (const [doorIndex, door] of room.doors.entries()) {
    const side = door.side as PlanOpeningSide;
    const geom = planOpeningRect(ox, oy, rw, rd, side, door.positionMm, door.widthMm, "door");
    elements.push(rect(geom.x, geom.y, geom.w, geom.h, `class="${geom.cls}"`));
    if (display.showOpeningTags) {
      elements.push(
        text(
          geom.cx,
          geom.cy - 6,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [winIndex, win] of room.windows.entries()) {
    const side = win.side as PlanOpeningSide;
    const geom = planOpeningRect(ox, oy, rw, rd, side, win.positionMm, win.widthMm, "window");
    elements.push(rect(geom.x, geom.y, geom.w, geom.h, `class="${geom.cls}"`));
    // Glass tick
    elements.push(
      line(
        geom.cx - geom.w * 0.35,
        geom.cy,
        geom.cx + geom.w * 0.35,
        geom.cy,
        `class="twod-opening-glass" pointer-events="none"`,
      ),
    );
    if (display.showOpeningTags) {
      elements.push(
        text(
          geom.cx,
          geom.cy - 6,
          formatOpeningTag("window", winIndex, win.widthMm, win.heightMm, win.sillHeightMm),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  return elements;
}
