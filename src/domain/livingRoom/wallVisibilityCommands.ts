import type { InteriorProject, WallEntity } from "../interiorProject";

/** Per-wall visibility — reuses WallEntity.visible (no parallel hidden-id store). */
export function setWallVisible(
  project: InteriorProject,
  wallId: string,
  visible: boolean,
): InteriorProject {
  let changed = false;
  const walls = project.walls.map((wall) => {
    if (wall.id !== wallId || wall.visible === visible) return wall;
    changed = true;
    return { ...wall, visible };
  });
  return changed ? { ...project, walls } : project;
}

/** Show All Walls — every wall visible; does not touch objects/panels. */
export function showAllWalls(project: InteriorProject): InteriorProject {
  if (project.walls.every((wall) => wall.visible)) return project;
  return {
    ...project,
    walls: project.walls.map((wall) => (wall.visible ? wall : { ...wall, visible: true })),
  };
}

export function listHiddenWalls(project: InteriorProject): WallEntity[] {
  return project.walls.filter((wall) => !wall.visible);
}

export function wallVisibilityLabel(wall: WallEntity, projectWallIndex: number): string {
  const side = wall.extensions?.wallSide;
  if (typeof side === "string" && side.length > 0) {
    return `Wall · ${side}`;
  }
  return `Wall ${projectWallIndex + 1}`;
}

/** Label using the wall’s index in `project.walls` (not hidden-list order). */
export function wallVisibilityLabelInProject(
  project: InteriorProject,
  wall: WallEntity,
): string {
  const index = project.walls.findIndex((item) => item.id === wall.id);
  return wallVisibilityLabel(wall, Math.max(0, index));
}
