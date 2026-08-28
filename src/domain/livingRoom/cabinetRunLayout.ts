import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import { orderRunMembers } from "../cabinetRuns";
import { attached, placementAt, wallLength } from "./wallSegmentPlacement";

export type CabinetRunAlignment = "start" | "center" | "end";
export type CabinetRunOptions = {
  gapMm?: number;
  alignment?: CabinetRunAlignment;
  extendToWall?: boolean;
};

export type CabinetRunMetadata = {
  runId: string;
  wallId: string;
  gapMm: number;
  alignment: CabinetRunAlignment;
  extendToWall: boolean;
};

function runMetadata(object: InteriorObjectEntity): CabinetRunMetadata | null {
  const value = object.extensions?.cabinetRun;
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (typeof source.runId !== "string" || typeof source.wallId !== "string") return null;
  return {
    runId: source.runId,
    wallId: source.wallId,
    gapMm: typeof source.gapMm === "number" ? source.gapMm : 0,
    alignment: source.alignment === "start" || source.alignment === "end" ? source.alignment : "center",
    extendToWall: Boolean(source.extendToWall),
  };
}

function resolveRunOptions(options: CabinetRunOptions | undefined, wallId: string, objectIds: string[]): CabinetRunMetadata {
  return {
    runId: `run:${wallId}:${[...objectIds].sort().join("|")}`,
    wallId,
    gapMm: Math.max(0, Math.round(options?.gapMm ?? 0)),
    alignment: options?.alignment ?? "center",
    extendToWall: Boolean(options?.extendToWall),
  };
}

export function arrangeCabinetRun(
  project: InteriorProject,
  objectIds: string[],
  wallId: string,
  options?: CabinetRunOptions,
) {
  const selectedCabinets = project.objects.filter((object) => objectIds.includes(object.id) && object.kind === "cabinet");
  const storedWall = project.walls.find((item) => item.id === wallId);
  if (!storedWall || selectedCabinets.length < 2) return project;
  const roomId = selectedCabinets[0]!.roomId;
  const wall = orientWallForRoom(project, roomId, storedWall);
  const length = wallLength(wall);
  if (!length) return project;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const cabinets = orderRunMembers(selectedCabinets, (cabinet) =>
    (cabinet.position.x - wall.start.x) * ux + (cabinet.position.z - wall.start.z) * uz,
  );
  const metadata = resolveRunOptions(options, wallId, cabinets.map((cabinet) => cabinet.id));
  const totalWidth = cabinets.reduce((sum, object) => sum + object.dimensions.widthMm, 0);
  const gaps = Math.max(0, cabinets.length - 1);
  const available = length - totalWidth;
  if (available < 0) return project;
  const gapMm = metadata.extendToWall && gaps > 0 ? available / gaps : Math.min(metadata.gapMm, gaps ? available / gaps : 0);
  const runLength = totalWidth + gapMm * gaps;
  let cursor = metadata.alignment === "start" ? 0
    : metadata.alignment === "end" ? length - runLength
      : (length - runLength) / 2;
  const arranged = new Map(cabinets.map((object) => {
    cursor += object.dimensions.widthMm / 2;
    const placed = attached(object, placementAt(wall, object, cursor));
    const value = { ...placed, extensions: { ...placed.extensions, cabinetRun: { ...metadata, gapMm: Math.round(gapMm) } } };
    cursor += object.dimensions.widthMm / 2 + gapMm;
    return [object.id, value];
  }));
  return { ...project, objects: project.objects.map((object) => arranged.get(object.id) ?? object) };
}

export function updateCabinetRun(project: InteriorProject, runId: string, options: CabinetRunOptions) {
  const members = project.objects.filter((object) => runMetadata(object)?.runId === runId);
  const metadata = members[0] ? runMetadata(members[0]) : null;
  if (!metadata || members.length < 2) return project;
  return arrangeCabinetRun(project, members.map((member) => member.id), metadata.wallId, {
    gapMm: options.gapMm ?? metadata.gapMm,
    alignment: options.alignment ?? metadata.alignment,
    extendToWall: options.extendToWall ?? metadata.extendToWall,
  });
}

export function reflowCabinetRunsForWalls(project: InteriorProject, wallIds: readonly string[]) {
  const affectedWalls = new Set(wallIds);
  const runIds = new Set(
    project.objects
      .map(runMetadata)
      .filter((metadata): metadata is CabinetRunMetadata => Boolean(metadata && affectedWalls.has(metadata.wallId)))
      .map((metadata) => metadata.runId),
  );
  return [...runIds].reduce((next, runId) => updateCabinetRun(next, runId, {}), project);
}

export function cabinetRunForObject(object: InteriorObjectEntity) {
  return runMetadata(object);
}
