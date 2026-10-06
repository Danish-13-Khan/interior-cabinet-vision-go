import type { InteriorObjectEntity, InteriorProject } from "../../interiorProject";
import { isWallPanelObject } from "../../livingRoom/panelAttachment";
import { hostWallId, objectSpanOnWall } from "./wallPieces";

/** Unit vector an object faces in plan (rotation 0 faces +z). */
function facing(object: InteriorObjectEntity): { x: number; z: number } {
  const radians = ((object.rotation?.y ?? 0) * Math.PI) / 180;
  return { x: Math.round(Math.sin(radians) * 1e6) / 1e6, z: Math.round(Math.cos(radians) * 1e6) / 1e6 };
}

function overlapsOnWall(project: InteriorProject, a: InteriorObjectEntity, b: InteriorObjectEntity): boolean {
  const wall = project.walls.find((item) => item.id === hostWallId(a));
  if (!wall || hostWallId(a) !== hostWallId(b)) return false;
  const sa = objectSpanOnWall(a, wall);
  const sb = objectSpanOnWall(b, wall);
  const along = sa.startMm < sb.endMm - 1 && sb.startMm < sa.endMm - 1;
  const vertical = a.position.y < b.position.y + b.dimensions.heightMm - 1
    && b.position.y < a.position.y + a.dimensions.heightMm - 1;
  return along && vertical;
}

/**
 * Bring hosted furniture (TV unit, display niche) forward off any feature
 * panel behind it on the same wall, so its back sits on the panel face
 * instead of passing through it.
 */
export function standClearOfWallPanels(project: InteriorProject, objectIds: readonly string[]): InteriorProject {
  const objects = project.objects.map((object) => {
    if (!objectIds.includes(object.id)) return object;
    const forward = facing(object);
    const depthAlong = (item: InteriorObjectEntity) => item.position.x * forward.x + item.position.z * forward.z;
    const back = depthAlong(object) - object.dimensions.depthMm / 2;
    const panelFront = Math.max(back, ...project.objects
      .filter((other) => other.id !== object.id && other.roomId === object.roomId && isWallPanelObject(other))
      .filter((panel) => overlapsOnWall(project, object, panel))
      .map((panel) => depthAlong(panel) + panel.dimensions.depthMm / 2));
    const shift = panelFront - back;
    if (shift <= 0) return object;
    return {
      ...object,
      position: { ...object.position, x: object.position.x + forward.x * shift, z: object.position.z + forward.z * shift },
    };
  });
  return { ...project, objects };
}
