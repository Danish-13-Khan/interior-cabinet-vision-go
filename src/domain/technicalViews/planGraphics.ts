import { SCALE } from "./constants";
import { line, rect, text } from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";
import { resolveDisplay } from "./viewLayers";
import type { RoomConfig } from "../roomModel";
import { formatOpeningTag } from "../draftingAnnotations";
import {
  planDoorConvention,
  planWindowConvention,
  wallThicknessSvg,
} from "../constructionGraphics";

export function planRoomOutline(
  ox: number,
  oy: number,
  rw: number,
  rd: number,
  showWallLabels: boolean,
  wallThicknessMm = 120,
) {
  const left = ox - rw / SCALE / 2;
  const top = oy - rd / SCALE / 2;
  const w = rw / SCALE;
  const d = rd / SCALE;
  const thick = wallThicknessSvg(wallThicknessMm, SCALE);
  const elements = [
    rect(left, top, w, d, `class="twod-wall twod-wall-outline twod-plan-floor"`),
    rect(
      left + thick,
      top + thick,
      Math.max(2, w - thick * 2),
      Math.max(2, d - thick * 2),
      `class="twod-wall twod-wall-inner"`,
    ),
    // Reference centerlines
    line(
      ox,
      top,
      ox,
      top + d,
      `class="twod-line-center twod-wall-centerline" pointer-events="none"`,
    ),
    line(
      left,
      oy,
      left + w,
      oy,
      `class="twod-line-center twod-wall-centerline" pointer-events="none"`,
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
  const wallT = wallThicknessSvg(room.dimensions.wallThicknessMm, SCALE);
  const elements: string[] = [];

  for (const [doorIndex, door] of room.doors.entries()) {
    elements.push(
      ...planDoorConvention(ox, oy, rw, rd, SCALE, wallT, door),
    );
    if (display.showOpeningTags) {
      const side = door.side;
      const cx =
        side === "back-wall"
          ? ox + door.positionMm / SCALE
          : side === "left-wall"
            ? ox - rw / SCALE / 2
            : ox + rw / SCALE / 2;
      const cy =
        side === "back-wall"
          ? oy - rd / SCALE / 2
          : oy + door.positionMm / SCALE;
      elements.push(
        text(
          cx,
          cy - wallT - 4,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  for (const [winIndex, win] of room.windows.entries()) {
    elements.push(
      ...planWindowConvention(ox, oy, rw, rd, SCALE, wallT, win),
    );
    if (display.showOpeningTags) {
      const side = win.side;
      const cx =
        side === "back-wall"
          ? ox + win.positionMm / SCALE
          : side === "left-wall"
            ? ox - rw / SCALE / 2
            : ox + rw / SCALE / 2;
      const cy =
        side === "back-wall"
          ? oy - rd / SCALE / 2
          : oy + win.positionMm / SCALE;
      elements.push(
        text(
          cx,
          cy - wallT - 4,
          formatOpeningTag(
            "window",
            winIndex,
            win.widthMm,
            win.heightMm,
            win.sillHeightMm,
          ),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  return elements;
}
