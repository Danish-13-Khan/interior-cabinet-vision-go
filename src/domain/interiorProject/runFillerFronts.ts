import { orientWallForRoom } from "./planTopology";
import type { InteriorObjectEntity, InteriorProject } from "./types";

function stringField(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object") return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : null;
}

function runMember(project: InteriorProject, filler: InteriorObjectEntity, runId: string) {
  return project.objects.find((object) => (
    object.roomId === filler.roomId &&
    !object.extensions?.cabinetRunFiller &&
    stringField(object.extensions?.cabinetRun, "runId") === runId
  ));
}

/**
 * Older files stored run fillers against the wall behind the run. Slide each
 * filler along its wall normal so its front meets the run's cabinet fronts;
 * width, id and position along the wall are kept.
 */
export function seatRunFillersAtFronts(project: InteriorProject): InteriorProject {
  let changed = false;
  const objects = project.objects.map((filler) => {
    const runId = stringField(filler.extensions?.cabinetRunFiller, "runId");
    if (!runId) return filler;
    const member = runMember(project, filler, runId);
    const wallId = member ? stringField(member.extensions?.cabinetRun, "wallId") : null;
    const stored = wallId ? project.walls.find((wall) => wall.id === wallId) : undefined;
    if (!member || !stored) return filler;
    const wall = orientWallForRoom(project, member.roomId, stored);
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
    if (!length) return filler;
    const nx = -(wall.end.z - wall.start.z) / length;
    const nz = (wall.end.x - wall.start.x) / length;
    const fromCentreline = (point: { x: number; z: number }) =>
      (point.x - wall.start.x) * nx + (point.z - wall.start.z) * nz;
    const memberFront = fromCentreline(member.position) + member.dimensions.depthMm / 2;
    const target = Math.max(
      wall.thicknessMm / 2 + filler.dimensions.depthMm / 2,
      memberFront - filler.dimensions.depthMm / 2,
    );
    const shift = target - fromCentreline(filler.position);
    if (Math.abs(shift) < 0.5) return filler;
    changed = true;
    return {
      ...filler,
      position: {
        ...filler.position,
        x: Math.round(filler.position.x + nx * shift),
        z: Math.round(filler.position.z + nz * shift),
      },
    };
  });
  return changed ? { ...project, objects } : project;
}
