# ADR-014: Plan topology and schema v2 contract

**Status:** Accepted for Phase D0. Implementation is deliberately deferred to Phase D0.5/D1.

This decision does not change the product agenda: **Menu → 2D creation → 3D → Render → Export**.

## Decision

Schema v2 represents the editable plan as a planar wall graph plus explicit room faces. A wall is an edge between two graph nodes and is not owned by one room. A room is a named face whose boundary is an ordered loop of directed wall uses. This makes one edge shareable by zero, one, or two rooms while preserving wall-attached openings.

```text
PlanTopology
  nodes[] ── endpoints in x/z millimetres
  walls[] ── edge: startNodeId → endNodeId
  rooms[] ── face: outerLoop uses directed wall ids; optional hole loops
  openings[] ── attached to a wall edge, offset from its start node
  surfaces[] ── polygon or room-loop reference + material

                         room-a boundary
                   ┌───────────┬───────────┐
                   │           │           │
                   │           │ shared    │
                   │           │ wall      │
                   │           │           │
                   └───────────┴───────────┘
                              room-b boundary
```

`RoomEntity.dimensions` remains a compatibility/cache field only while the rectangular adapter exists. The resolved room-face bounds are authoritative; the rectangular adapter writes the cache after its own resize operation, and every graph mutation invalidates it before any adapter or legacy export recomputes it. `activeRoomId`, object `roomId`, lights, and cameras keep their current semantics; they refer to a room face, not a wall owner.

## v2 type sketch

This is the target contract for D0.5, not code to merge into `types.ts` during D0.

```ts
type PlanNodeEntity = { id: EntityId; position: Point2Mm; extensions?: EntityExtensions };
type DirectedWallUse = { wallId: EntityId; direction: "forward" | "reverse" };
type PlanLoop = { id: EntityId; wallUses: DirectedWallUse[] };
type PlanRoomEntity = {
  id: EntityId; name: string; roomType: RoomType;
  outerLoopId: EntityId; holeLoopIds: EntityId[];
  wallThicknessMm: number; extensions?: EntityExtensions;
};
type PlanWallEntity = {
  id: EntityId; startNodeId: EntityId; endNodeId: EntityId;
  heightMm: number; thicknessMm: number; visible: boolean;
  materialId: EntityId | null; extensions?: EntityExtensions;
};
type OpeningMaterialSlots = Record<string, EntityId>;
type OpeningEntityV2 = {
  id: EntityId; wallId: EntityId; kind: OpeningKind;
  catalogItemId: string; offsetMm: number; widthMm: number; heightMm: number;
  sillHeightMm: number; swingDirection?: "in" | "out";
  materialSlots: OpeningMaterialSlots; parameters: Record<string, ParameterValue>;
  extensions?: EntityExtensions;
};
type SurfaceZoneEntity = {
  id: EntityId; kind: "floor" | "ceiling" | "wall";
  polygon: Point2Mm[] | null; roomId: EntityId | null; loopId: EntityId | null;
  materialId: EntityId | null; extensions?: EntityExtensions;
};
type InteriorProjectV2 = Omit<InteriorProjectV1, "schemaVersion" | "rooms" | "walls" | "openings"> & {
  schemaVersion: 2; nodes: PlanNodeEntity[]; loops: PlanLoop[];
  rooms: PlanRoomEntity[]; walls: PlanWallEntity[];
  openings: OpeningEntityV2[]; surfaces: SurfaceZoneEntity[];
};
```

## Validation rules

- Geometry remains mm-only; unit selection is never persisted in the document.
- Node ids, wall ids, loop ids, and room ids are unique. A wall has two distinct existing nodes.
- A loop contains at least three wall uses; each use is contiguous with the next (including the last-to-first join), and no wall is repeated in one loop.
- Outer loops use clockwise winding in plan coordinates; hole loops use counter-clockwise winding. `forward` means the stored wall direction (`startNodeId → endNodeId`), independently of the loop winding.
- Every room references one valid, closed outer loop; hole loops are closed, non-intersecting, and inside that outer loop.
- A wall can participate in zero, one, or two room outer/hole boundaries. More than two is an error. Opposite directions are required when two rooms use the same wall as an ordinary shared boundary.
- An opening references an existing wall only. `0 <= offsetMm`, `offsetMm + widthMm <= wallLengthMm`, and openings on a wall may not overlap. It has no mandatory `roomId`.
- Surface zones either reference a valid room/loop or carry a valid, simple polygon; they are not raster paint data.
- Objects, lights, and cameras may retain `roomId`; their containment check runs against the resolved room face rather than a rectangle.

## v1 → v2 migration

For each v1 room, create four nodes and four walls from its existing perimeter wall segments. Reuse a v1 wall's coordinates and id whenever they form the expected perimeter; otherwise generate deterministic replacement ids and retain the original id in `extensions.legacyId`. Create a clockwise room outer loop. Copy dimensions and wall thickness into the compatibility adapter metadata.

For every v1 opening, retain id, `wallId`, kind, offsets, and dimensions; drop the duplicated `roomId` only after verifying that its v1 wall belongs to the migrated room. Set procedural defaults: `catalogItemId` is `opening:door-single` for doors, `opening:window-fixed` for windows, and `opening:pass-through` otherwise; material slots and parameters start empty. Invalid legacy references follow the existing repair policy and produce a migration warning.

The file envelope and `schemaVersion` both become `2`. A v1 document must open through `v1-to-v2`, then save as v2. Migration is idempotent: a v2 document is never re-migrated. No coordinate, dimension, cabinet, or opening geometry may change in a successful migration.

## Command contract for A–D

`activeTool` values: `select`, `upload-underlay`, `draw-room`, `draw-wall`, `draw-surface`, `place-door`, `place-window`, `place-structural`.

Commands are atomic and serializable: `beginDraft`, `commitDraft`, `cancelDraft`, `createRoom`, `resizeRoom`, `createWall`, `moveNode`, `splitWall`, `joinNodes`, `deleteEntity`, `placeOpening`, `moveOpening`, `resizeOpening`, `updateSelection`. Every mutation is one undo/redo entry; draft updates never enter history. Phase A maps `createRoom`/`resizeRoom` to the existing rectangular adapter and maps `createWall` to partition creation. D1 replaces only the command handlers, not the UI state contract.

## Blast-radius checklist

| Consumer | D0.5/D1 action |
| --- | --- |
| Bounds and resize | Derive bounds from room loops; retain rectangular adapter temporarily. |
| Validation and migration | Implement v1-to-v2, graph, loop, opening, and containment validation. |
| Snapping | Use nodes, wall projections, intersections, and opening clearances. |
| Cabinet constraints | Replace rectangle-edge checks with face containment and wall distance. |
| Technical plans | Render resolved loops, shared walls once, and opening symbols from wall offsets. |
| Scene compiler | Extrude resolved wall graph and floor/ceiling faces; avoid duplicate shared walls. |
| Project files | Version envelope and document together; reject future versions. |

## Fixtures and proof

The canonical fixtures are in `fixtures/plan-topology/`.

- `v1-rectangle.interior.json` — preservation / migration input  
- `rectangle.v2.golden.json`, `l-room.v2.golden.json`, `two-rooms-shared-wall.v2.golden.json` — **loadable schema v2 projects** used by D0.5 tests  

D0.5 owns migration and topology validation tests that prove v1 geometry is preserved and shared-wall documents validate without single-`roomId` ownership.

## Consequences

This design supports shared walls without creating a second room workflow. It intentionally does not ship freeform editing, schema v2 runtime types, catalog UI, or Build chrome; those are D0.5, A, B, and D work respectively.
