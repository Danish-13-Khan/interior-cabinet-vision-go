import type { CabinetInstance, RoomBounds } from "../cabinetDimensions";
import {
  detectCabinetRuns,
  type CabinetRun,
  type CabinetRunSide,
} from "../cabinetLibrary";
import { resolveCabinetComposition } from "../cabinetComposition";
import { collectOpeningLeaves } from "../cabinetOpeningStructure";
import type { ProjectRoom } from "../projectRooms";
import type { RoomConfig } from "../roomModel";
import {
  cabinetFamilyIcon,
  cabinetFamilyTone,
  formatCabinetStructuredName,
  formatOpeningStructuredName,
  formatRunTreeLabel,
  formatWallTreeLabel,
  wallIcon,
} from "./naming";
import type { SceneTreeNode, SceneTreeWallId } from "./types";

const WALL_ORDER: SceneTreeWallId[] = [
  "back-wall",
  "left-wall",
  "right-wall",
  "free",
];

function roomBoundsFromConfig(config: RoomConfig): RoomBounds {
  return {
    widthMm: config.dimensions.widthMm,
    depthMm: config.dimensions.depthMm,
    heightMm: config.dimensions.heightMm,
  };
}

function collectCabinetIds(nodes: SceneTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.kind === "cabinet" && node.cabinetId) {
      ids.push(node.cabinetId);
    } else {
      ids.push(...node.cabinetIds);
    }
  }
  return [...new Set(ids)];
}

function buildOpeningNodes(
  cabinet: CabinetInstance,
  roomId: string,
  wallId: SceneTreeWallId,
  runId: string,
): SceneTreeNode[] {
  const structure = resolveCabinetComposition(cabinet.config).openingStructure;
  if (!structure) return [];
  const leaves = collectOpeningLeaves(structure.root);
  return leaves.map((leaf, index) => {
    const named = formatOpeningStructuredName(leaf, index);
    return {
      id: `opening:${roomId}:${cabinet.id}:${leaf.id}`,
      kind: "opening" as const,
      label: named.label,
      detail: named.detail,
      icon: named.icon,
      iconTone: "opening",
      roomId,
      wallId,
      runId,
      cabinetId: cabinet.id,
      openingId: leaf.id,
      openingContentType: leaf.contentType,
      cabinetIds: [cabinet.id],
      children: [],
    };
  });
}

function buildCabinetNode(
  cabinet: CabinetInstance,
  markIndex: number,
  roomId: string,
  wallId: SceneTreeWallId,
  runId: string,
): SceneTreeNode {
  const named = formatCabinetStructuredName(cabinet, markIndex);
  const children = buildOpeningNodes(cabinet, roomId, wallId, runId);
  return {
    id: `cabinet:${roomId}:${cabinet.id}`,
    kind: "cabinet",
    label: named.label,
    detail: named.detail,
    icon: cabinetFamilyIcon(cabinet.config.type),
    iconTone: cabinetFamilyTone(cabinet.config.type),
    roomId,
    wallId,
    runId,
    cabinetId: cabinet.id,
    cabinetType: cabinet.config.type,
    cabinetIds: [cabinet.id],
    children,
  };
}

function buildRunNode(
  run: CabinetRun,
  runIndex: number,
  cabinetsById: Map<string, CabinetInstance>,
  markIndexById: Map<string, number>,
  roomId: string,
): SceneTreeNode {
  const wallId = run.side;
  const children = run.cabinetIds
    .map((id) => cabinetsById.get(id))
    .filter((cabinet): cabinet is CabinetInstance => Boolean(cabinet))
    .map((cabinet) =>
      buildCabinetNode(
        cabinet,
        markIndexById.get(cabinet.id) ?? 0,
        roomId,
        wallId,
        run.id,
      ),
    );

  return {
    id: `run:${roomId}:${run.id}`,
    kind: "run",
    label: formatRunTreeLabel(run, runIndex),
    detail: `${children.length} cab`,
    icon: `R${String(runIndex + 1).padStart(2, "0")}`,
    iconTone: "run",
    roomId,
    wallId,
    runId: run.id,
    cabinetIds: collectCabinetIds(children),
    children,
  };
}

function buildLooseRun(
  cabinets: CabinetInstance[],
  side: CabinetRunSide,
  markIndexById: Map<string, number>,
  roomId: string,
): SceneTreeNode {
  const runId = `loose-${side}`;
  const children = cabinets.map((cabinet) =>
    buildCabinetNode(
      cabinet,
      markIndexById.get(cabinet.id) ?? 0,
      roomId,
      side,
      runId,
    ),
  );

  return {
    id: `run:${roomId}:${runId}`,
    kind: "run",
    label: `Loose · ${formatWallTreeLabel(side)}`,
    detail: `${children.length} item${children.length === 1 ? "" : "s"}`,
    icon: "LS",
    iconTone: "run",
    roomId,
    wallId: side,
    runId,
    cabinetIds: collectCabinetIds(children),
    children,
  };
}

function sideForLooseCabinet(cabinet: CabinetInstance): CabinetRunSide {
  if (cabinet.placement.attachment !== "floor") {
    return cabinet.placement.attachment;
  }
  return "free";
}

function buildWallNodes(
  cabinets: CabinetInstance[],
  runs: CabinetRun[],
  markIndexById: Map<string, number>,
  roomId: string,
): SceneTreeNode[] {
  const cabinetsById = new Map(cabinets.map((cabinet) => [cabinet.id, cabinet]));
  const inRun = new Set(runs.flatMap((run) => run.cabinetIds));
  const loose = cabinets.filter((cabinet) => !inRun.has(cabinet.id));

  const runsBySide = new Map<CabinetRunSide, CabinetRun[]>();
  for (const run of runs) {
    const list = runsBySide.get(run.side) ?? [];
    list.push(run);
    runsBySide.set(run.side, list);
  }

  const looseBySide = new Map<CabinetRunSide, CabinetInstance[]>();
  for (const cabinet of loose) {
    const side = sideForLooseCabinet(cabinet);
    const list = looseBySide.get(side) ?? [];
    list.push(cabinet);
    looseBySide.set(side, list);
  }

  let runOrdinal = 0;
  const walls: SceneTreeNode[] = [];

  for (const side of WALL_ORDER) {
    const sideRuns = runsBySide.get(side) ?? [];
    const sideLoose = looseBySide.get(side) ?? [];
    if (sideRuns.length === 0 && sideLoose.length === 0) continue;

    const children: SceneTreeNode[] = [];
    for (const run of sideRuns) {
      children.push(
        buildRunNode(run, runOrdinal, cabinetsById, markIndexById, roomId),
      );
      runOrdinal += 1;
    }
    if (sideLoose.length > 0) {
      children.push(
        buildLooseRun(sideLoose, side, markIndexById, roomId),
      );
      runOrdinal += 1;
    }

    walls.push({
      id: `wall:${roomId}:${side}`,
      kind: "wall",
      label: formatWallTreeLabel(side),
      detail: `${collectCabinetIds(children).length} cab`,
      icon: wallIcon(side),
      iconTone: "wall",
      roomId,
      wallId: side,
      cabinetIds: collectCabinetIds(children),
      children,
    });
  }

  return walls;
}

function buildRoomNode(room: ProjectRoom): SceneTreeNode {
  const bounds = roomBoundsFromConfig(room.config);
  const runs = detectCabinetRuns(room.cabinets, bounds);
  const markIndexById = new Map(
    room.cabinets.map((cabinet, index) => [cabinet.id, index]),
  );
  const children = buildWallNodes(room.cabinets, runs, markIndexById, room.id);

  return {
    id: `room:${room.id}`,
    kind: "room",
    label: room.name,
    detail: `${room.cabinets.length} item${room.cabinets.length === 1 ? "" : "s"}`,
    icon: "RM",
    iconTone: "room",
    roomId: room.id,
    cabinetIds: room.cabinets.map((cabinet) => cabinet.id),
    children,
  };
}

/** Build room → wall → run → cabinet → opening hierarchy for the object tree. */
export function buildSceneTree(rooms: ProjectRoom[]): SceneTreeNode[] {
  return rooms.map((room) => buildRoomNode(room));
}

/** Flat walk for tests / reveal helpers. */
export function flattenSceneTree(nodes: SceneTreeNode[]): SceneTreeNode[] {
  const out: SceneTreeNode[] = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children.length > 0) {
      out.push(...flattenSceneTree(node.children));
    }
  }
  return out;
}

export function findSceneTreeNode(
  nodes: SceneTreeNode[],
  predicate: (node: SceneTreeNode) => boolean,
): SceneTreeNode | null {
  for (const node of nodes) {
    if (predicate(node)) return node;
    const child = findSceneTreeNode(node.children, predicate);
    if (child) return child;
  }
  return null;
}
