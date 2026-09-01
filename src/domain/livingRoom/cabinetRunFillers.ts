import { persistCabinetIdentityOnObject, RUN_FILLER_CATALOG_ID } from "../cabinetIdentity";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom } from "../interiorProject";
import { FILLER_MAX_MM, FILLER_MIN_MM, fillerWidthForGap, orderRunMembers } from "../cabinetRuns";
import { reflowCornerCabinetsForWalls } from "./cornerPlacement";
import {
  cabinetRunForObject,
  reflowCabinetRunsForWalls as reflowCabinetRunLayout,
  updateCabinetRun,
  type CabinetRunOptions,
} from "./cabinetRunLayout";
import { attached, placementAt, wallLength } from "./wallSegmentPlacement";

const FILLER_DEPTH_MM = 18;

export type CabinetRunFillerSide = "start" | "end" | "between";

export type CabinetRunFillerMetadata = {
  runId: string;
  side: CabinetRunFillerSide;
  index?: number;
};

export function isCabinetRunFiller(object: InteriorObjectEntity): boolean {
  return Boolean(object.extensions?.cabinetRunFiller);
}

export function cabinetRunFillerForObject(object: InteriorObjectEntity): CabinetRunFillerMetadata | null {
  const value = object.extensions?.cabinetRunFiller;
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  if (typeof source.runId !== "string") return null;
  if (source.side !== "start" && source.side !== "end" && source.side !== "between") return null;
  return {
    runId: source.runId,
    side: source.side,
    index: typeof source.index === "number" ? source.index : undefined,
  };
}

function runCabinets(project: InteriorProject, runId: string) {
  return project.objects.filter((object) => {
    const meta = cabinetRunForObject(object);
    return meta?.runId === runId && !isCabinetRunFiller(object);
  });
}

function offsetsAlongWall(object: InteriorObjectEntity, wall: ReturnType<typeof orientWallForRoom>) {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center = (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  return { start: center - half, end: center + half };
}

function removeRunFillers(project: InteriorProject, runId: string): InteriorProject {
  return {
    ...project,
    objects: project.objects.filter((object) => cabinetRunFillerForObject(object)?.runId !== runId),
  };
}

function persistFillersEnabled(project: InteriorProject, runId: string, enabled: boolean): InteriorProject {
  return {
    ...project,
    objects: project.objects.map((object) => {
      const meta = cabinetRunForObject(object);
      if (!meta || meta.runId !== runId || isCabinetRunFiller(object)) return object;
      return { ...object, extensions: { ...object.extensions, cabinetRun: { ...meta, fillersEnabled: enabled } } };
    }),
  };
}

function makeFillerDraft(options: {
  id: string;
  runId: string;
  roomId: string;
  wallId: string;
  side: CabinetRunFillerSide;
  index?: number;
  widthMm: number;
  heightMm: number;
  reference: InteriorObjectEntity;
}): InteriorObjectEntity {
  return {
    id: options.id,
    roomId: options.roomId,
    kind: "cabinet",
    category: "filler",
    catalogItemId: RUN_FILLER_CATALOG_ID,
    name: "Run filler",
    position: { ...options.reference.position },
    rotation: { ...options.reference.rotation },
    dimensions: { widthMm: options.widthMm, heightMm: options.heightMm, depthMm: FILLER_DEPTH_MM },
    materialSlots: { ...options.reference.materialSlots },
    parameters: { filler: true },
    extensions: {
      placement: "wall",
      wallAttachment: { wallId: options.wallId },
      cabinetRunFiller: { runId: options.runId, side: options.side, index: options.index },
    },
  };
}

export function syncCabinetRunFillers(project: InteriorProject, runId: string): InteriorProject {
  const members = runCabinets(project, runId);
  const metadata = members[0] ? cabinetRunForObject(members[0]) : null;
  if (!metadata || members.length === 0) return project;

  const storedWall = project.walls.find((item) => item.id === metadata.wallId);
  if (!storedWall) return project;
  const wall = orientWallForRoom(project, members[0]!.roomId, storedWall);
  const length = wallLength(wall);
  if (!length) return project;

  const cabinets = orderRunMembers(members, (cabinet) => offsetsAlongWall(cabinet, wall).start);
  const reference = cabinets[0]!;
  type Spec = { side: CabinetRunFillerSide; index?: number; widthMm: number; center: number; ref: InteriorObjectEntity };
  const specs: Spec[] = [];

  for (let index = 0; index < cabinets.length - 1; index += 1) {
    const current = cabinets[index]!;
    const next = cabinets[index + 1]!;
    const gap = offsetsAlongWall(next, wall).start - offsetsAlongWall(current, wall).end;
    // Use the same standard-width rule as the Cabinets CAD filler workflow.
    const widthMm = fillerWidthForGap(gap);
    if (widthMm === null) continue;
    specs.push({
      side: "between",
      index: index + 1,
      widthMm,
      center: offsetsAlongWall(current, wall).end + widthMm / 2,
      ref: current,
    });
  }

  const startGap = offsetsAlongWall(cabinets[0]!, wall).start;
  const endGap = length - offsetsAlongWall(cabinets[cabinets.length - 1]!, wall).end;
  if (startGap >= FILLER_MIN_MM && startGap <= FILLER_MAX_MM) {
    specs.push({ side: "start", widthMm: startGap, center: startGap / 2, ref: cabinets[0]! });
  }
  if (endGap >= FILLER_MIN_MM && endGap <= FILLER_MAX_MM) {
    specs.push({ side: "end", widthMm: endGap, center: length - endGap / 2, ref: cabinets[cabinets.length - 1]! });
  }

  const cleared = removeRunFillers(project, runId);
  const fillers = specs.map((spec) => {
    const draft = makeFillerDraft({
      id: `filler:${runId}:${spec.side}${spec.index ?? ""}`,
      runId,
      roomId: reference.roomId,
      wallId: metadata.wallId,
      side: spec.side,
      index: spec.index,
      widthMm: Math.round(spec.widthMm),
      heightMm: reference.dimensions.heightMm,
      reference: spec.ref,
    });
    return persistCabinetIdentityOnObject(attached(draft, placementAt(wall, draft, spec.center)));
  });
  return { ...cleared, objects: [...cleared.objects, ...fillers] };
}

export function countCabinetRunFillers(project: InteriorProject, runId: string): number {
  return project.objects.filter((object) => cabinetRunFillerForObject(object)?.runId === runId).length;
}

export type CabinetRunLayoutOptions = CabinetRunOptions & { fillersEnabled?: boolean };

export function updateCabinetRunLayout(project: InteriorProject, runId: string, options: CabinetRunLayoutOptions) {
  let next = updateCabinetRun(project, runId, options);
  if (options.fillersEnabled === true) {
    next = persistFillersEnabled(next, runId, true);
    return syncCabinetRunFillers(next, runId);
  }
  if (options.fillersEnabled === false) {
    next = removeRunFillers(next, runId);
    return persistFillersEnabled(next, runId, false);
  }
  const meta = next.objects.map(cabinetRunForObject).find((item) => item?.runId === runId);
  return meta?.fillersEnabled ? syncCabinetRunFillers(next, runId) : next;
}

export function reflowCabinetRunsForWalls(project: InteriorProject, wallIds: readonly string[]) {
  const reflowed = reflowCabinetRunLayout(project, wallIds);
  const runIds = new Set(
    reflowed.objects
      .map(cabinetRunForObject)
      .filter((meta): meta is NonNullable<typeof meta> => Boolean(meta?.fillersEnabled))
      .map((meta) => meta.runId),
  );
  const withFillers = [...runIds].reduce((next, runId) => syncCabinetRunFillers(next, runId), reflowed);
  return reflowCornerCabinetsForWalls(withFillers, wallIds);
}

/** Keep generated filler ownership consistent when a user deletes run members. */
export function reconcileCabinetRunsAfterObjectRemoval(project: InteriorProject, removedObjectIds: readonly string[]) {
  const removedIds = new Set(removedObjectIds);
  const affectedRunIds = new Set(
    project.objects
      .filter((object) => removedIds.has(object.id))
      .map(cabinetRunForObject)
      .filter((metadata): metadata is NonNullable<ReturnType<typeof cabinetRunForObject>> => Boolean(metadata))
      .map((metadata) => metadata.runId),
  );
  const withoutSelected = { ...project, objects: project.objects.filter((object) => !removedIds.has(object.id)) };
  return [...affectedRunIds].reduce((next, runId) => {
    const memberCount = runCabinets(next, runId).length;
    if (memberCount >= 2) return updateCabinetRunLayout(next, runId, {});
    const cleared = removeRunFillers(next, runId);
    return {
      ...cleared,
      objects: cleared.objects.map((object) => {
        const metadata = cabinetRunForObject(object);
        if (metadata?.runId !== runId) return object;
        const { cabinetRun: _cabinetRun, ...extensions } = object.extensions ?? {};
        return { ...object, extensions };
      }),
    };
  }, withoutSelected);
}
