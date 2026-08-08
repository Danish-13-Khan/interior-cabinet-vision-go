import type { CabinetInstance } from "../cabinetDimensions";
import { formatOpeningTag } from "../draftingAnnotations";
import type { DoorSide, RoomConfig, WindowSide } from "../roomModel";
import { SCALE } from "./constants";
import { dimensionLabel, line, rect, text } from "./svgPrimitives";
import type { TechnicalViewOptions } from "./types";
import { resolveDisplay } from "./viewLayers";

export function elevationRoomShell(
  ox: number,
  oy: number,
  spanMm: number,
  heightMm: number,
  wallLabel: string | null,
) {
  const left = ox - spanMm / SCALE / 2;
  const top = oy - heightMm / SCALE / 2;
  const w = spanMm / SCALE;
  const h = heightMm / SCALE;
  const floorY = top + h;
  const elements = [
    rect(left, top, w, h, `class="twod-wall twod-wall-outline twod-elev-field"`),
    line(left, floorY, left + w, floorY, `class="twod-wall twod-floor-line"`),
    // Ceiling tick
    line(left, top, left + w, top, `class="twod-wall twod-ceiling-line"`),
  ];
  if (wallLabel) {
    elements.push(
      text(
        ox,
        top - 6,
        wallLabel,
        `class="twod-wall-label" font-size="7" text-anchor="middle"`,
      ),
    );
  }
  return elements;
}

export function elevationOpeningsGraphics(
  room: RoomConfig,
  ox: number,
  oy: number,
  heightMm: number,
  sides: Array<DoorSide | WindowSide>,
  options: TechnicalViewOptions,
) {
  const display = resolveDisplay(options);
  const elements: string[] = [];
  const floorY = oy + heightMm / SCALE / 2;

  const windows = room.windows.filter((item) =>
    (sides as WindowSide[]).includes(item.side),
  );
  for (const [winIndex, window] of windows.entries()) {
    const x = ox + window.positionMm / SCALE - window.widthMm / SCALE / 2;
    const y = floorY - (window.sillHeightMm + window.heightMm) / SCALE;
    const w = window.widthMm / SCALE;
    const h = window.heightMm / SCALE;
    elements.push(rect(x, y, w, h, `class="twod-opening twod-opening-window"`));
    elements.push(
      line(x + 2, y + 2, x + w - 2, y + h - 2, `class="twod-opening-glass" pointer-events="none"`),
      line(x + w - 2, y + 2, x + 2, y + h - 2, `class="twod-opening-glass" pointer-events="none"`),
    );
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + w / 2,
          y - 3,
          formatOpeningTag(
            "window",
            winIndex,
            window.widthMm,
            window.heightMm,
            window.sillHeightMm,
          ),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  const doors = room.doors.filter((item) =>
    (sides as DoorSide[]).includes(item.side),
  );
  for (const [doorIndex, door] of doors.entries()) {
    const x = ox + door.positionMm / SCALE - door.widthMm / SCALE / 2;
    const y = floorY - door.heightMm / SCALE;
    const w = door.widthMm / SCALE;
    const h = door.heightMm / SCALE;
    elements.push(rect(x, y, w, h, `class="twod-opening twod-opening-door"`));
    // Swing arc hint
    elements.push(
      line(
        x + w,
        floorY,
        x + w + Math.min(12, w * 0.35),
        floorY - Math.min(14, h * 0.2),
        `class="twod-opening-swing" pointer-events="none"`,
      ),
    );
    if (display.showOpeningTags) {
      elements.push(
        text(
          x + w / 2,
          y - 3,
          formatOpeningTag("door", doorIndex, door.widthMm, door.heightMm),
          `class="twod-tag twod-tag-opening" font-size="6.5" text-anchor="middle"`,
        ),
      );
    }
  }

  return elements;
}

export function wallCabinetClearances(
  wallCabinets: CabinetInstance[],
  floorCabinets: CabinetInstance[],
  roomHeightMm: number,
  ox: number,
  oy: number,
) {
  const elements: string[] = [];
  const floorY = oy + roomHeightMm / SCALE / 2;
  const ceilingY = oy - roomHeightMm / SCALE / 2;

  for (const wallCab of wallCabinets) {
    const bottom = wallCab.placement.y;
    const top = wallCab.placement.y + wallCab.config.dimensions.height;
    const ceilingClear = roomHeightMm - top;
    const cx = ox + wallCab.placement.x / SCALE;
    const bottomY = floorY - bottom / SCALE;
    const topY = floorY - top / SCALE;

    if (ceilingClear > 20) {
      elements.push(
        line(
          cx + 14,
          topY,
          cx + 14,
          ceilingY,
          `class="twod-dim twod-wall-clearance" data-dim="clearance"`,
        ),
        text(
          cx + 17,
          (topY + ceilingY) / 2 + 2,
          `${dimensionLabel(ceilingClear)} clear`,
          `class="twod-annotation twod-wall-clearance" font-size="6" text-anchor="start"`,
        ),
      );
    }

    for (const floorCab of floorCabinets) {
      if (
        Math.abs(floorCab.placement.x - wallCab.placement.x) >
        Math.max(floorCab.config.dimensions.width, wallCab.config.dimensions.width)
      ) {
        continue;
      }
      const gap = bottom - (floorCab.placement.y + floorCab.config.dimensions.height);
      if (gap > 20) {
        const floorTopY =
          floorY - (floorCab.placement.y + floorCab.config.dimensions.height) / SCALE;
        elements.push(
          line(
            cx - 14,
            floorTopY,
            cx - 14,
            bottomY,
            `class="twod-dim twod-wall-clearance" data-dim="clearance"`,
          ),
          text(
            cx - 17,
            (floorTopY + bottomY) / 2 + 2,
            `${dimensionLabel(gap)} gap`,
            `class="twod-annotation twod-wall-clearance" font-size="6" text-anchor="end"`,
          ),
        );
      }
      break;
    }
  }

  return elements;
}

/** Side-view mount line from wall face into cabinet depth. */
export function sideMountIndicators(
  cabinets: CabinetInstance[],
  ox: number,
  oy: number,
  roomHeightMm: number,
  roomDepthMm: number,
) {
  const elements: string[] = [];
  const floorY = oy + roomHeightMm / SCALE / 2;
  const backX = ox - roomDepthMm / SCALE / 2;

  for (const cabinet of cabinets) {
    if (cabinet.placement.attachment === "floor") continue;
    const topY = floorY - (cabinet.placement.y + cabinet.config.dimensions.height) / SCALE;
    const bottomY = floorY - cabinet.placement.y / SCALE;
    const z = cabinet.placement.z / SCALE;
    elements.push(
      line(
        backX,
        (topY + bottomY) / 2,
        ox + z,
        (topY + bottomY) / 2,
        `class="twod-mount-line" pointer-events="none"`,
      ),
    );
  }
  return elements;
}
