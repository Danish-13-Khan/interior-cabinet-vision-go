import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import { orderRunMembers } from "../cabinetRuns";
import { attached, placementAt, wallLength } from "./wallSegmentPlacement";

export type CabinetRunAlignment = "start" | "center" | "end";
export type CabinetRunOptions = {
  gapMm?: number;
  alignment?: CabinetRunAlignment;
  /** When set, places the run starting at this wall offset (ignores alignment). */
  startAlongMm?: number;
  extendToWall?: boolean;
  fillersEnabled?: boolean;
};

export type CabinetRunMetadata = {
  runId: string;
  wallId: string;
  gapMm: number;
  alignment: CabinetRunAlignment;
  /** Explicit wall-start offset; when set, alignment is ignored on rearrange. */
  startAlongMm?: number;
  extendToWall: boolean;
  fillersEnabled: boolean;
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
    startAlongMm: typeof source.startAlongMm === "number" ? source.startAlongMm : undefined,
    extendToWall: Boolean(source.extendToWall),
    fillersEnabled: Boolean(source.fillersEnabled),
  };
}

function resolveRunOptions(options: CabinetRunOptions | undefined, wallId: string, objectIds: string[]): CabinetRunMetadata {
  return {
    runId: `run:${wallId}:${[...objectIds].sort().join("|")}`,
    wallId,
    gapMm: Math.max(0, Math.round(options?.gapMm ?? 0)),
    alignment: options?.alignment ?? "center",
    startAlongMm: typeof options?.startAlongMm === "number" ? options.startAlongMm : undefined,
    extendToWall: Boolean(options?.extendToWall),
    fillersEnabled: Boolean(options?.fillersEnabled),
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
  const startAlong = typeof options?.startAlongMm === "number"
    ? options.startAlongMm
    : metadata.startAlongMm;
  let cursor = typeof startAlong === "number"
    ? Math.max(0, Math.min(length - runLength, startAlong))
    : metadata.alignment === "start" ? 0
      : metadata.alignment === "end" ? length - runLength
        : (length - runLength) / 2;
  const stored: CabinetRunMetadata = {
    runId: metadata.runId,
    wallId: metadata.wallId,
    gapMm: Math.round(gapMm),
    alignment: metadata.alignment,
    extendToWall: metadata.extendToWall,
    fillersEnabled: metadata.fillersEnabled,
    ...(typeof startAlong === "number" ? { startAlongMm: Math.round(cursor) } : {}),
  };
  const arranged = new Map(cabinets.map((object) => {
    cursor += object.dimensions.widthMm / 2;
    const placed = attached(object, placementAt(wall, object, cursor));
    const value = { ...placed, extensions: { ...placed.extensions, cabinetRun: { ...stored } } };
    cursor += object.dimensions.widthMm / 2 + gapMm;
    return [object.id, value];
  }));
  return { ...project, objects: project.objects.map((object) => arranged.get(object.id) ?? object) };
}

export function updateCabinetRun(project: InteriorProject, runId: string, options: CabinetRunOptions) {
  const members = project.objects.filter((object) => runMetadata(object)?.runId === runId);
  const metadata = members[0] ? runMetadata(members[0]) : null;
  if (!metadata || members.length < 2) return project;
  // Explicit alignment from the inspector replaces a stored offset; keep offset only when
  // startAlongMm is supplied (or neither alignment nor offset is being changed).
  const startAlongMm = "startAlongMm" in options
    ? options.startAlongMm
    : options.alignment !== undefined
      ? undefined
      : metadata.startAlongMm;
  return arrangeCabinetRun(project, members.map((member) => member.id), metadata.wallId, {
    gapMm: options.gapMm ?? metadata.gapMm,
    alignment: options.alignment ?? metadata.alignment,
    startAlongMm,
    extendToWall: options.extendToWall ?? metadata.extendToWall,
    fillersEnabled: options.fillersEnabled ?? metadata.fillersEnabled,
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

/** Occupied millwork length: member widths plus the run gap between them. */
export function cabinetRunLengthMm(project: InteriorProject, runId: string): number {
  const members = project.objects.filter((object) => runMetadata(object)?.runId === runId);
  if (members.length === 0) return 0;
  const gapMm = runMetadata(members[0]!)?.gapMm ?? 0;
  const totalWidth = members.reduce((sum, object) => sum + object.dimensions.widthMm, 0);
  return Math.round(totalWidth + gapMm * Math.max(0, members.length - 1));
}
