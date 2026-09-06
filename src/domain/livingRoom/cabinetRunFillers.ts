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
import {
  collectWallOccupancySpans,
  freeSegmentsInInterval,
} from "./cabinetRunPlacementPreview";
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


function referenceRoomId(members: InteriorObjectEntity[]): string {
  return members[0]!.roomId;
}

export function syncCabinetRunFillers(project: InteriorProject, runId: string): InteriorProject {
  const members = runCabinets(project, runId);
  const metadata = members[0] ? cabinetRunForObject(members[0]) : null;
  if (!metadata || members.length === 0) return project;

  // Keep prior start/end filler identity+width when reflow leaves a large end gap
  // (auto sync only places fillers for gaps within FILLER_MIN/MAX).
  const priorEndFillers = project.objects.filter((object) => {
    const meta = cabinetRunFillerForObject(object);
    return meta?.runId === runId && (meta.side === "start" || meta.side === "end");
  });

  // Drop this run's fillers first so occupancy reflects openings / other runs / corners only.
  const cleared = removeRunFillers(project, runId);
  const clearedMembers = runCabinets(cleared, runId);
  if (clearedMembers.length === 0) return cleared;

  const roomId = referenceRoomId(clearedMembers);
  const collected = collectWallOccupancySpans(cleared, metadata.wallId, roomId);
  if (!collected) return cleared;
  const { wall, lengthMm, occupied } = collected;
  if (!lengthMm) return cleared;

  const cabinets = orderRunMembers(clearedMembers, (cabinet) => offsetsAlongWall(cabinet, wall).start);
  const reference = cabinets[0]!;
  type Spec = {
    side: CabinetRunFillerSide;
    index?: number;
    widthMm: number;
    center: number;
    ref: InteriorObjectEntity;
    id?: string;
  };
  const specs: Spec[] = [];
  const priorBySide = {
    start: priorEndFillers.find((object) => cabinetRunFillerForObject(object)?.side === "start"),
    end: priorEndFillers.find((object) => cabinetRunFillerForObject(object)?.side === "end"),
  };

  const withoutIds = (ids: ReadonlySet<string>) => occupied.filter((span) => {
    if (ids.has(span.id)) return false;
    return !span.id.split("+").some((part) => ids.has(part));
  });

  for (let index = 0; index < cabinets.length - 1; index += 1) {
    const current = cabinets[index]!;
    const next = cabinets[index + 1]!;
    const currentSpan = offsetsAlongWall(current, wall);
    const nextSpan = offsetsAlongWall(next, wall);
    const intervalOccupied = withoutIds(new Set([current.id, next.id]));
    const freeSegments = freeSegmentsInInterval(intervalOccupied, currentSpan.end, nextSpan.start);
    // Place one filler per contiguous fillable segment (align with Complete Run proposal).
    for (const segment of freeSegments) {
      const widthMm = fillerWidthForGap(segment.lengthMm);
      if (widthMm === null) continue;
      specs.push({
        side: "between",
        index: index + 1,
        widthMm,
        center: segment.startMm + widthMm / 2,
        ref: current,
      });
    }
  }

  const firstSpan = offsetsAlongWall(cabinets[0]!, wall);
  const lastSpan = offsetsAlongWall(cabinets[cabinets.length - 1]!, wall);
  const startSegments = freeSegmentsInInterval(withoutIds(new Set([cabinets[0]!.id])), 0, firstSpan.start);
  for (const startBest of startSegments) {
    if (startBest.lengthMm >= FILLER_MIN_MM && startBest.lengthMm <= FILLER_MAX_MM) {
      specs.push({
        side: "start",
        widthMm: startBest.lengthMm,
        center: startBest.startMm + startBest.lengthMm / 2,
        ref: cabinets[0]!,
        id: priorBySide.start?.id,
      });
    }
  }
  if (
    priorBySide.start
    && !specs.some((spec) => spec.side === "start")
    && startSegments.some((segment) => segment.lengthMm >= priorBySide.start!.dimensions.widthMm)
  ) {
    // Preserve forced/manual start fillers (e.g. golden 100 mm) against the first cabinet
    // when the end gap is larger than FILLER_MAX_MM.
    const widthMm = priorBySide.start.dimensions.widthMm;
    specs.push({
      side: "start",
      widthMm,
      center: firstSpan.start - widthMm / 2,
      ref: cabinets[0]!,
      id: priorBySide.start.id,
    });
  }
  const endSegments = freeSegmentsInInterval(
    withoutIds(new Set([cabinets[cabinets.length - 1]!.id])),
    lastSpan.end,
    lengthMm,
  );
  for (const endBest of endSegments) {
    if (endBest.lengthMm >= FILLER_MIN_MM && endBest.lengthMm <= FILLER_MAX_MM) {
      specs.push({
        side: "end",
        widthMm: endBest.lengthMm,
        center: endBest.startMm + endBest.lengthMm / 2,
        ref: cabinets[cabinets.length - 1]!,
        id: priorBySide.end?.id,
      });
    }
  }
  if (
    priorBySide.end
    && !specs.some((spec) => spec.side === "end")
    && endSegments.some((segment) => segment.lengthMm >= priorBySide.end!.dimensions.widthMm)
  ) {
    // Preserve forced/manual end fillers against the last cabinet when the gap exceeds FILLER_MAX_MM.
    const widthMm = priorBySide.end.dimensions.widthMm;
    specs.push({
      side: "end",
      widthMm,
      center: lastSpan.end + widthMm / 2,
      ref: cabinets[cabinets.length - 1]!,
      id: priorBySide.end.id,
    });
  }

  const fillers = specs.map((spec) => {
    const draft = makeFillerDraft({
      id: spec.id ?? `filler:${runId}:${spec.side}${spec.index ?? ""}:${Math.round(spec.center)}`,
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
