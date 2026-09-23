import type { CabinetInstance, CabinetProject, RoomBounds } from "../cabinetDimensions";
import { detectCabinetRuns } from "../cabinetRuns/detect";
import { partTreeNodeId } from "../partIdentity";
import { createCabinetProductionCutlist, createProjectProductionCutlist, type ProductionCutlistLine } from "../productionCutlist";
import type { DesignHierarchyNode } from "./designHierarchy";

const GROUPS: Record<string, string> = {
  Side: "Carcass",
  TopBottom: "Carcass",
  Back: "Carcass",
  EndPanel: "Carcass",
  ToeKick: "Carcass",
  Stretcher: "Carcass",
  FaceFrame: "Carcass",
  Shelf: "Compartments",
  Divider: "Compartments",
  Door: "Doors",
  DrawerFront: "Drawers",
  DrawerBox: "Box parts",
};

export function manufacturingGroup(category: string) {
  return GROUPS[category] ?? "Carcass";
}

function matchCabinet(objectId: string, cabinets: readonly CabinetInstance[]) {
  return cabinets.find((cabinet) => cabinet.interiorObjectId === objectId || cabinet.id === objectId) ?? null;
}

function runBuckets(cabinets: readonly CabinetInstance[], roomBounds: RoomBounds | null) {
  const detected = roomBounds ? detectCabinetRuns([...cabinets], roomBounds) : [];
  const claimed = new Set(detected.flatMap((run) => run.cabinetIds));
  const missing = cabinets.filter((cabinet) => !claimed.has(cabinet.id)).map((cabinet) => cabinet.id);
  const runs = detected.map((run, index) => ({
    id: run.id,
    label: `Run ${index + 1} · ${run.side}`,
    cabinetIds: run.cabinetIds,
  }));
  if (missing.length) runs.push({ id: "run:placed", label: "Run", cabinetIds: missing });
  return runs;
}

function partNodes(cabinet: CabinetInstance, index: number, roomId: string, objectId: string): DesignHierarchyNode[] {
  const lines = createCabinetProductionCutlist(cabinet, index);
  const grouped = new Map<string, ProductionCutlistLine[]>();
  for (const line of lines) {
    const title = manufacturingGroup(String(line.category));
    grouped.set(title, [...(grouped.get(title) ?? []), line]);
  }
  const nodes: DesignHierarchyNode[] = [];
  for (const [title, groupLines] of grouped) {
    nodes.push({
      id: `group:${cabinet.id}:${title}`,
      kind: "group",
      label: title,
      detail: `${groupLines.length} parts`,
      depth: 3,
      roomId,
      objectId,
      wallId: null,
      openingId: null,
    });
    for (const line of groupLines) {
      nodes.push({
        id: partTreeNodeId(cabinet.id, line.partId, roomId),
        kind: "part",
        label: line.label,
        detail: `${line.material} · ${line.thicknessMm} mm`,
        depth: 4,
        roomId,
        objectId,
        wallId: null,
        openingId: null,
        cutlistKey: line.key,
        constructionKey: line.partId,
      });
    }
  }
  return nodes;
}

export function attachManufacturingParts(
  nodes: readonly DesignHierarchyNode[],
  cabinets: readonly CabinetInstance[],
  roomBounds: RoomBounds | null,
): DesignHierarchyNode[] {
  const result: DesignHierarchyNode[] = [];
  const started = new Set<string>();
  for (const node of nodes) {
    if (node.kind !== "cabinet" || !node.objectId) {
      result.push(node);
      continue;
    }
    const cabinet = matchCabinet(node.objectId, cabinets);
    if (!cabinet) {
      result.push(node);
      continue;
    }
    if (started.has(node.roomId)) continue;
    started.add(node.roomId);
    const roomCabinets = cabinets.filter((item) => nodes.some((row) =>
      row.kind === "cabinet" && row.roomId === node.roomId && matchCabinet(row.objectId ?? "", [item]),
    ));
    for (const run of runBuckets(roomCabinets, roomBounds)) {
      result.push({
        id: `run:${node.roomId}:${run.id}`,
        kind: "run",
        label: run.label,
        detail: `${run.cabinetIds.length} cabinets`,
        depth: 1,
        roomId: node.roomId,
        objectId: null,
        wallId: null,
        openingId: null,
      });
      for (const cabinetId of run.cabinetIds) {
        const placed = roomCabinets.find((item) => item.id === cabinetId);
        const source = nodes.find((row) => row.kind === "cabinet" && row.objectId && matchCabinet(row.objectId, placed ? [placed] : []));
        if (!placed || !source) continue;
        const index = cabinets.findIndex((item) => item.id === placed.id) + 1;
        result.push({ ...source, depth: 2 });
        result.push(...partNodes(placed, index, node.roomId, source.objectId!));
      }
    }
  }
  return result;
}

export function visibleHierarchyNodes(
  nodes: readonly DesignHierarchyNode[],
  input: { isolatedObjectId: string | null; hiddenObjectIds: readonly string[] },
) {
  const hidden = new Set(input.hiddenObjectIds);
  return nodes.filter((node) => {
    if (!node.objectId) return true;
    if (hidden.has(node.objectId)) return false;
    if (input.isolatedObjectId && node.objectId !== input.isolatedObjectId) return false;
    return true;
  });
}

export function collapseHierarchy(nodes: readonly DesignHierarchyNode[], collapsedIds: ReadonlySet<string>) {
  const visible: DesignHierarchyNode[] = [];
  let skipDeeperThan: number | null = null;
  for (const node of nodes) {
    if (skipDeeperThan !== null && node.depth > skipDeeperThan) continue;
    skipDeeperThan = null;
    visible.push(node);
    if (collapsedIds.has(node.id)) skipDeeperThan = node.depth;
  }
  return visible;
}

/** Viewport isolation filters cabinets. Manufacturing export keeps the full project. */
export function manufacturingExportDespiteIsolation(
  project: CabinetProject,
  isolatedCabinetIds: readonly string[] | null,
) {
  const allowed = new Set(isolatedCabinetIds ?? []);
  const viewportIds = !isolatedCabinetIds?.length
    ? project.cabinets.map((cabinet) => cabinet.id)
    : project.cabinets.filter((cabinet) => allowed.has(cabinet.id)).map((cabinet) => cabinet.id);
  const lines = createProjectProductionCutlist(project);
  return {
    viewportIds,
    exportCabinetIds: [...new Set(lines.map((line) => line.cabinetId))],
    exportLineCount: lines.length,
  };
}
