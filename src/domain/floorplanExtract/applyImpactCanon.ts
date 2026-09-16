import type {
  InteriorObjectEntity,
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  PlanLoop,
  PlanNodeEntity,
  SurfaceZoneEntity,
  WallEntity,
} from "../interiorProject/types";

export function byId<T extends { id: string }>(a: T, b: T) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function wallCanon(w: WallEntity) {
  return {
    id: w.id,
    start: w.start,
    end: w.end,
    heightMm: w.heightMm,
    thicknessMm: w.thicknessMm,
    startNodeId: w.startNodeId ?? null,
    endNodeId: w.endNodeId ?? null,
    raised: w.raised ?? true,
    roomId: w.roomId ?? null,
    visible: w.visible,
    materialId: w.materialId,
    extensions: w.extensions ?? null,
  };
}

export function openingCanon(o: OpeningEntity) {
  return {
    id: o.id,
    roomId: o.roomId ?? null,
    wallId: o.wallId,
    kind: o.kind,
    offsetMm: o.offsetMm,
    widthMm: o.widthMm,
    heightMm: o.heightMm,
    sillHeightMm: o.sillHeightMm,
    catalogItemId: o.catalogItemId ?? null,
    materialSlots: o.materialSlots ?? null,
    parameters: o.parameters ?? null,
    swingDirection: o.swingDirection ?? null,
    extensions: o.extensions ?? null,
  };
}

export function roomCanon(r: InteriorRoomEntity) {
  return {
    id: r.id,
    name: r.name,
    roomType: r.roomType,
    dimensions: r.dimensions,
    wallThicknessMm: r.wallThicknessMm,
    outerLoopId: r.outerLoopId ?? null,
    holeLoopIds: [...(r.holeLoopIds ?? [])].sort(),
    extensions: r.extensions ?? null,
  };
}

export function nodeCanon(n: PlanNodeEntity) {
  return { id: n.id, x: n.position.x, z: n.position.z, extensions: n.extensions ?? null };
}

export function loopCanon(l: PlanLoop) {
  return {
    id: l.id,
    wallUses: l.wallUses.map((u) => ({ wallId: u.wallId, direction: u.direction })),
    extensions: l.extensions ?? null,
  };
}

export function objectCanon(o: InteriorObjectEntity) {
  return {
    id: o.id,
    roomId: o.roomId,
    kind: o.kind,
    category: o.category,
    catalogItemId: o.catalogItemId,
    catalogItemVersion: o.catalogItemVersion ?? null,
    name: o.name,
    position: o.position,
    rotation: o.rotation,
    dimensions: o.dimensions,
    materialSlots: o.materialSlots,
    parameters: o.parameters,
    extensions: o.extensions ?? null,
  };
}

export function surfaceCanon(s: SurfaceZoneEntity) {
  return {
    id: s.id,
    kind: s.kind,
    polygon: s.polygon,
    roomId: s.roomId,
    loopId: s.loopId,
    materialId: s.materialId,
    extensions: s.extensions ?? null,
  };
}

/** Shell topology + persisted wall/opening content Apply replaces. */
export function shellTopologyFingerprint(project: InteriorProject): string {
  return JSON.stringify({
    nodes: [...project.nodes].sort(byId).map(nodeCanon),
    walls: [...project.walls].sort(byId).map(wallCanon),
    openings: [...project.openings].sort(byId).map(openingCanon),
    rooms: [...project.rooms].sort(byId).map(roomCanon),
    loops: [...project.loops].sort(byId).map(loopCanon),
  });
}

/** Objects + surfaces Apply clears — included in ack reset key. */
export function discardedContentFingerprint(project: InteriorProject): string {
  return JSON.stringify({
    objects: [...project.objects].sort(byId).map(objectCanon),
    surfaces: [...project.surfaces].sort(byId).map(surfaceCanon),
  });
}

/** Full replacement-impact fingerprint (shell + discarded content). */
export function replacementImpactFingerprint(project: InteriorProject): string {
  return JSON.stringify({
    shell: shellTopologyFingerprint(project),
    discarded: discardedContentFingerprint(project),
  });
}
