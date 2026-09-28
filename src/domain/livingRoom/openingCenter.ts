import type { OpeningEntity, Point3Mm, WallEntity } from "../interiorProject";

/** World point at the opening's horizontal centre, at sill height. */
export function openingCenterMm(
  opening: Pick<OpeningEntity, "offsetMm" | "widthMm" | "sillHeightMm">,
  wall: Pick<WallEntity, "start" | "end">,
): Point3Mm {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const along = opening.offsetMm + opening.widthMm / 2;
  return {
    x: wall.start.x + (dx / length) * along,
    y: opening.sillHeightMm,
    z: wall.start.z + (dz / length) * along,
  };
}
