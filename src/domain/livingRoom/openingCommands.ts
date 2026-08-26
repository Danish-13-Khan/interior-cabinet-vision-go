import {
  validateInteriorProject,
  type InteriorProject,
  type OpeningEntity,
} from "../interiorProject";

function safe(project: InteriorProject) {
  return validateInteriorProject(project).project;
}

function wallLength(project: InteriorProject, wallId: string) {
  const wall = project.walls.find((item) => item.id === wallId);
  return wall ? Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) : 0;
}

function normaliseOpening(project: InteriorProject, opening: OpeningEntity): OpeningEntity {
  const length = wallLength(project, opening.wallId);
  const widthMm = Math.min(Math.max(300, opening.widthMm), Math.max(300, length - 200));
  return {
    ...opening,
    offsetMm: Math.min(Math.max(0, opening.offsetMm), Math.max(0, length - widthMm)),
    widthMm,
    heightMm: Math.max(300, opening.heightMm),
    sillHeightMm: Math.max(0, opening.sillHeightMm),
  };
}

export function addLivingRoomOpening(project: InteriorProject, opening: OpeningEntity) {
  return safe({ ...project, openings: [...project.openings, normaliseOpening(project, opening)] });
}

export function updateLivingRoomOpening(
  project: InteriorProject,
  openingId: string,
  patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "swingDirection" | "materialSlots" | "parameters">>,
) {
  return safe({
    ...project,
    openings: project.openings.map((opening) => opening.id === openingId
      ? normaliseOpening(project, { ...opening, ...patch })
      : opening),
  });
}

export function deleteLivingRoomOpening(project: InteriorProject, openingId: string) {
  return safe({ ...project, openings: project.openings.filter((opening) => opening.id !== openingId) });
}
