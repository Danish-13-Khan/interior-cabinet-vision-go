import type { RoomDoor, RoomWindow } from "../roomModel";
import { path, quarterArcPath, line, rect } from "./svg";

export type PlanWallSide = "back-wall" | "left-wall" | "right-wall";

export function wallThicknessSvg(wallThicknessMm: number, scale: number) {
  return Math.max(1.2, Math.min(8, wallThicknessMm / scale));
}

/**
 * Plan door: thickness-aware jamb break + 90° swing arc.
 */
export function planDoorConvention(
  ox: number,
  oy: number,
  roomW: number,
  roomD: number,
  scale: number,
  wallT: number,
  door: RoomDoor,
): string[] {
  const elements: string[] = [];
  const side = door.side as PlanWallSide;
  const halfW = door.widthMm / scale / 2;
  const thick = wallT;

  if (side === "back-wall") {
    const cx = ox + door.positionMm / scale;
    const wallY = oy - roomD / scale / 2;
    const x0 = cx - halfW;
    const x1 = cx + halfW;
    elements.push(
      rect(x0, wallY - thick / 2, halfW * 2, thick, `class="twod-opening twod-opening-door twod-opening-jamb"`),
    );
    const swingIn = door.swingDirection === "in";
    const hingeX = x0;
    const tipX = x1;
    const openY = swingIn ? wallY + halfW * 2 : wallY - halfW * 2;
    const sweep = swingIn ? 1 : 0;
    const d = quarterArcPath(hingeX, wallY, tipX, wallY, hingeX, openY, sweep);
    elements.push(
      path(d, `class="twod-opening-swing twod-door-swing" fill="none" pointer-events="none"`),
      line(hingeX, wallY, hingeX, openY, `class="twod-opening-swing twod-line-hidden" pointer-events="none"`),
    );
    return elements;
  }

  const wallX =
    side === "left-wall" ? ox - roomW / scale / 2 : ox + roomW / scale / 2;
  const cy = oy + door.positionMm / scale;
  const y0 = cy - halfW;
  const y1 = cy + halfW;
  const jambX = side === "left-wall" ? wallX - thick / 2 : wallX - thick / 2;
  elements.push(
    rect(jambX, y0, thick, halfW * 2, `class="twod-opening twod-opening-door twod-opening-jamb"`),
  );
  const swingIn = door.swingDirection === "in";
  const hingeY = y0;
  const towardRoom = side === "left-wall" ? 1 : -1;
  const openDir = swingIn ? towardRoom : -towardRoom;
  const openX = wallX + openDir * halfW * 2;
  const sweep = openDir > 0 ? 1 : 0;
  const d = quarterArcPath(wallX, hingeY, wallX, y1, openX, hingeY, sweep);
  elements.push(
    path(d, `class="twod-opening-swing twod-door-swing" fill="none" pointer-events="none"`),
    line(wallX, hingeY, openX, hingeY, `class="twod-opening-swing twod-line-hidden" pointer-events="none"`),
  );
  return elements;
}

/**
 * Plan window: thickness jamb + sill centerline (reference) + glass tick.
 */
export function planWindowConvention(
  ox: number,
  oy: number,
  roomW: number,
  roomD: number,
  scale: number,
  wallT: number,
  win: RoomWindow,
): string[] {
  const elements: string[] = [];
  const side = win.side as PlanWallSide;
  const halfW = win.widthMm / scale / 2;
  const thick = wallT;

  if (side === "back-wall") {
    const cx = ox + win.positionMm / scale;
    const wallY = oy - roomD / scale / 2;
    const x0 = cx - halfW;
    elements.push(
      rect(x0, wallY - thick / 2, halfW * 2, thick, `class="twod-opening twod-opening-window twod-opening-jamb"`),
      line(x0 + 1, wallY, x0 + halfW * 2 - 1, wallY, `class="twod-opening-glass twod-line-center" pointer-events="none"`),
      line(cx, wallY - thick / 2, cx, wallY + thick / 2, `class="twod-line-reference twod-opening-sill" pointer-events="none"`),
    );
    return elements;
  }

  const wallX =
    side === "left-wall" ? ox - roomW / scale / 2 : ox + roomW / scale / 2;
  const cy = oy + win.positionMm / scale;
  const y0 = cy - halfW;
  elements.push(
    rect(wallX - thick / 2, y0, thick, halfW * 2, `class="twod-opening twod-opening-window twod-opening-jamb"`),
    line(wallX, y0 + 1, wallX, y0 + halfW * 2 - 1, `class="twod-opening-glass twod-line-center" pointer-events="none"`),
    line(wallX - thick / 2, cy, wallX + thick / 2, cy, `class="twod-line-reference twod-opening-sill" pointer-events="none"`),
  );
  return elements;
}

/** Elevation door swing: hinged leaf arc respecting in/out. */
export function elevRoomDoorSwing(
  x: number,
  floorY: number,
  w: number,
  h: number,
  swingDirection: "in" | "out",
): string[] {
  const hingeX = x;
  const tipX = x + w;
  const openY = swingDirection === "in" ? floorY - Math.min(w, h * 0.45) : floorY + Math.min(w * 0.25, 10);
  const sweep = swingDirection === "in" ? 1 : 0;
  // For "out", keep arc mostly above floor visually by using smaller radius upward still
  const endY = swingDirection === "in" ? openY : floorY - Math.min(w * 0.35, h * 0.25);
  const d = quarterArcPath(hingeX, floorY, tipX, floorY, hingeX + (swingDirection === "in" ? 0 : w * 0.05), endY, sweep);
  return [
    path(d, `class="twod-opening-swing twod-door-swing" fill="none" pointer-events="none"`),
    line(hingeX, floorY, hingeX, Math.min(floorY, endY), `class="twod-opening-swing twod-line-hidden" pointer-events="none"`),
  ];
}
