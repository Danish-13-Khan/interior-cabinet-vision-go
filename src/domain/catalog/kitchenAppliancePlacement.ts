import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import { placementAt, wallLength } from "../livingRoom/wallSegmentPlacement";

export type KitchenWallPlacement = {
  catalogItemId: string;
  alongMm: number;
  elevateYMm?: number;
  /** Extra mm toward room center so GLBs sit clearly on the floor plate. */
  inwardNudgeMm?: number;
};

/** Snap Kenney appliances onto a wall so they share the room floor with the run. */
export function snapCatalogObjectsToWall(
  project: InteriorProject,
  wallId: string,
  placements: ReadonlyArray<KitchenWallPlacement>,
): InteriorProject {
  const stored = project.walls.find((wall) => wall.id === wallId);
  const roomId = project.activeRoomId ?? project.rooms[0]?.id;
  if (!stored || !roomId) return project;
  const wall = orientWallForRoom(project, roomId, stored);
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const nx = -uz;
  const nz = ux;
  return {
    ...project,
    objects: project.objects.map((object) => placeObject(object, placements, wall, wallId, nx, nz)),
  };
}

function placeObject(
  object: InteriorObjectEntity,
  placements: ReadonlyArray<KitchenWallPlacement>,
  wall: ReturnType<typeof orientWallForRoom>,
  wallId: string,
  nx: number,
  nz: number,
): InteriorObjectEntity {
  const target = placements.find((item) => item.catalogItemId === object.catalogItemId);
  if (!target) return object;
  const place = placementAt(wall, object, target.alongMm);
  const nudge = target.inwardNudgeMm ?? 0;
  return {
    ...object,
    position: {
      x: place.position.x + nx * nudge,
      y: target.elevateYMm ?? place.position.y,
      z: place.position.z + nz * nudge,
    },
    rotation: { ...object.rotation, y: place.rotationY },
    extensions: { ...object.extensions, wallAttachment: { wallId } },
  };
}
