import type { InteriorValidationIssue } from "../interiorProject/types";
import { validatePlanTopology } from "../interiorProject/planTopologyValidation";
import type {
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  PlanLoop,
  PlanNodeEntity,
  WallEntity,
} from "../interiorProject/types";
import { clampOpeningVertical } from "../interiorProject/openingVerticalBounds";
import { synchronizeWallCaches } from "../interiorProject/wallGraph";
import { synchronizeRoomSurfaceZones } from "../interiorProject/roomSurfaces";
import { mToMm, pointMToMm } from "./meters";
import type { NormalizedFloorplan } from "./types";
import { buildFloorplanApplySnapshot } from "./applyImpact";

function roomTypeFromLabel(label?: string): InteriorRoomEntity["roomType"] {
  const l = (label ?? "").toLowerCase();
  if (l.includes("bath")) return "bathroom";
  if (l.includes("bed")) return "bedroom";
  if (l.includes("kitchen")) return "kitchen";
  if (l.includes("office")) return "office";
  if (l.includes("util")) return "utility";
  if (l.includes("living") || l.includes("lounge")) return "living-room";
  return "custom";
}

function minThickM(graph: NormalizedFloorplan["graph"]) {
  const kept = graph.edges.filter((e) => e.role !== "dropped");
  if (!kept.length) return 0.15;
  return Math.min(...kept.map((e) => e.thickM));
}

/**
 * Replace shell topology from extract. Drops stale room-scoped entities.
 * Caller must only invoke when normalized.canApply is true.
 */
export function applyFloorplanToInterior(
  project: InteriorProject,
  normalized: NormalizedFloorplan,
): InteriorProject {
  if (!normalized.canApply) throw new Error("Apply blocked by geometry gates");
  const { draft, graph, roomMatches, openingAttachments } = normalized;
  const heightMm = mToMm(draft.defaults?.wall_height_m ?? 2.7);

  const nodes: PlanNodeEntity[] = graph.nodes.map((n) => ({
    id: `fp-node-${n.id}`,
    position: pointMToMm([n.x, n.y]),
  }));

  const walls: WallEntity[] = graph.edges
    .filter((e) => e.role !== "dropped")
    .map((e) => {
      const a = graph.nodes[e.a], b = graph.nodes[e.b];
      return {
        id: e.sourceId,
        roomId: null,
        start: pointMToMm([a.x, a.y]),
        end: pointMToMm([b.x, b.y]),
        startNodeId: `fp-node-${e.a}`,
        endNodeId: `fp-node-${e.b}`,
        heightMm,
        thicknessMm: mToMm(e.thickM),
        raised: true,
        visible: true,
        materialId: null,
        extensions: { fromFloorplanExtract: true },
      };
    });

  const loops: PlanLoop[] = [];
  const rooms: InteriorRoomEntity[] = [];
  for (const room of draft.polygons.rooms) {
    const id = room.id!;
    const match = roomMatches[id];
    if (!match || match.status !== "matched") continue;
    const loopId = `${id}:outer-loop`;
    loops.push({
      id: loopId,
      wallUses: match.wallUses.map((u) => ({
        wallId: u.wallSourceId,
        direction: u.direction,
      })),
      extensions: { fromFloorplanExtract: true },
    });
    const holeLoopIds: string[] = [];
    match.holeMatches.forEach((hole, i) => {
      if (hole.status !== "matched") return;
      const hid = `${id}:hole-${i}`;
      loops.push({
        id: hid,
        wallUses: hole.wallUses.map((u) => ({
          wallId: u.wallSourceId,
          direction: u.direction,
        })),
      });
      holeLoopIds.push(hid);
    });
    const xs = room.outer.map((p) => p[0]);
    const zs = room.outer.map((p) => p[1]);
    rooms.push({
      id,
      name: room.label || id,
      roomType: roomTypeFromLabel(room.label),
      dimensions: {
        widthMm: mToMm(Math.max(...xs) - Math.min(...xs)),
        heightMm,
        depthMm: mToMm(Math.max(...zs) - Math.min(...zs)),
      },
      wallThicknessMm: mToMm(minThickM(graph)),
      outerLoopId: loopId,
      holeLoopIds,
      extensions: { fromFloorplanExtract: true },
    });
  }

  if (rooms.length === 0) {
    throw new Error("Apply requires at least one matched room loop");
  }

  const openings: OpeningEntity[] = [];
  const wallIds = new Set(walls.map((w) => w.id));
  for (const poly of [...draft.polygons.doors, ...draft.polygons.windows]) {
    const id = poly.id!;
    const att = openingAttachments[id];
    if (!att || att.status !== "matched") continue;
    if (!wallIds.has(att.wallSourceId)) continue;
    const kind = draft.polygons.doors.some((d) => d.id === id) ? "door" : "window";
    const heightM = poly.opening?.height_m ?? (kind === "door" ? 2.1 : 1.2);
    const sillM = poly.opening?.sill_m ?? (kind === "door" ? 0 : 0.9);
    if (!(heightM > 0) || !(att.widthM > 0)) {
      throw new Error(`Opening ${id} has nonpositive dimensions (height_m=${heightM}, width_m=${att.widthM})`);
    }
    const hostHeight = walls.find((wall) => wall.id === att.wallSourceId)?.heightMm ?? heightMm;
    const vertical = clampOpeningVertical(
      { heightMm: mToMm(heightM), sillHeightMm: mToMm(sillM) },
      hostHeight,
    );
    openings.push({
      id,
      wallId: att.wallSourceId,
      kind,
      offsetMm: mToMm(att.offsetM),
      widthMm: mToMm(att.widthM),
      heightMm: vertical.heightMm,
      sillHeightMm: vertical.sillHeightMm,
      extensions: { fromFloorplanExtract: true, trimmed: att.trimmed },
    });
  }

  const activeRoomId = rooms[0].id;
  const now = new Date().toISOString();

  let next: InteriorProject = synchronizeWallCaches({
    ...project,
    updatedAt: now,
    activeRoomId,
    nodes,
    walls,
    loops,
    rooms,
    openings,
    objects: [],
    lights: project.lights.map((l) => ({ ...l, roomId: l.roomId ? activeRoomId : null })),
    cameras: project.cameras.map((c) => ({ ...c, roomId: activeRoomId })),
    surfaces: [],
    extensions: {
      ...project.extensions,
      floorplanExtractAppliedAt: now,
      floorplanSource: draft.source ?? null,
      floorplanExtractDraft: draft,
      wallGraphDomainVersion: 1,
    },
  });

  next = synchronizeRoomSurfaceZones(next);
  next = {
    ...next,
    extensions: {
      ...next.extensions,
      floorplanApplySnapshot: buildFloorplanApplySnapshot(next),
      floorplanExtractDraft: draft,
    },
  };

  const issues: InteriorValidationIssue[] = [];
  validatePlanTopology(next, issues);
  const fatal = issues.find((i) => i.severity === "error");
  if (fatal) {
    throw new Error(`Apply produced invalid topology: ${fatal.code} ${fatal.message}`);
  }
  return next;
}
