import type { InteriorProject, Point3Mm } from "../../domain/interiorProject";
import { openingOffsetAtPoint } from "../../domain/livingRoom";
import type { ModelTransformTarget } from "./ModelMoveGizmo";

export type MovePreviewResult = { position: Point3Mm; rotationY: number } | null | void;

export function openingCenterOnWall(
  wall: InteriorProject["walls"][number],
  opening: InteriorProject["openings"][number],
): Point3Mm {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const center = opening.offsetMm + opening.widthMm / 2;
  return {
    x: wall.start.x + (dx / length) * center,
    y: opening.sillHeightMm,
    z: wall.start.z + (dz / length) * center,
  };
}

export function resolveModelTransformPosition(input: {
  target: ModelTransformTarget;
  proposed: Point3Mm;
  project: InteriorProject;
  snapSizeMm: number;
  onMovePreview?: (objectId: string, position: Point3Mm) => MovePreviewResult;
}): Point3Mm {
  const { target, proposed, project, snapSizeMm, onMovePreview } = input;
  if (target.kind === "object") {
    const preview = onMovePreview?.(target.id, proposed);
    if (preview && typeof preview === "object" && preview.position) return preview.position;
    return proposed;
  }
  const opening = project.openings.find((item) => item.id === target.id);
  const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
  if (!opening || !wall) return target.positionMm;
  const offsetMm = openingOffsetAtPoint(wall, proposed, opening.widthMm, snapSizeMm);
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const center = offsetMm + opening.widthMm / 2;
  return {
    x: wall.start.x + (dx / length) * center,
    y: Math.min(Math.max(0, wall.heightMm - opening.heightMm), Math.max(0, proposed.y)),
    z: wall.start.z + (dz / length) * center,
  };
}

export function openingPatchFromTransform(
  project: InteriorProject,
  target: ModelTransformTarget,
  resolved: Point3Mm,
  snapSizeMm: number,
): { offsetMm: number; sillHeightMm: number } | null {
  const opening = project.openings.find((item) => item.id === target.id);
  const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
  if (!opening || !wall) return null;
  return {
    offsetMm: openingOffsetAtPoint(wall, resolved, opening.widthMm, snapSizeMm),
    sillHeightMm: Math.max(0, resolved.y),
  };
}
