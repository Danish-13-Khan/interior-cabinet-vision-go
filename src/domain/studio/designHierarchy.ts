import type { InteriorProject } from "../interiorProject";
import { selectRoomObjects, selectRoomOpenings, selectRoomWalls } from "../interiorProject";

export type DesignHierarchyKind =
  | "room"
  | "wall"
  | "door"
  | "window"
  | "opening"
  | "run"
  | "cabinet"
  | "furniture"
  | "group"
  | "part";

export type DesignHierarchyNode = {
  id: string;
  kind: DesignHierarchyKind;
  label: string;
  detail: string;
  depth: number;
  roomId: string;
  objectId: string | null;
  wallId: string | null;
  openingId: string | null;
  cutlistKey?: string | null;
  constructionKey?: string | null;
  /** Stable physical piece. Distinct from the grouped cut-list key. */
  pieceId?: string | null;
};

function roomNodes(project: InteriorProject, roomId: string, active: boolean): DesignHierarchyNode[] {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room) return [];
  const nodes: DesignHierarchyNode[] = [{
    id: `room:${room.id}`,
    kind: "room",
    label: room.name,
    detail: active ? "Active room" : "Room",
    depth: 0,
    roomId: room.id,
    objectId: null,
    wallId: null,
    openingId: null,
  }];
  if (!active) return nodes;
  const walls = selectRoomWalls(project, room.id);
  walls.forEach((wall, index) => {
    nodes.push({
      id: `wall:${wall.id}`,
      kind: "wall",
      label: `Wall ${index + 1}`,
      detail: `${Math.round(Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z))} mm`,
      depth: 1,
      roomId: room.id,
      objectId: null,
      wallId: wall.id,
      openingId: null,
    });
  });
  for (const opening of selectRoomOpenings(project, room.id)) {
    const kind = opening.kind === "door" || opening.kind === "window" ? opening.kind : "opening";
    const wallIndex = walls.findIndex((wall) => wall.id === opening.wallId);
    nodes.push({
      id: `opening:${opening.id}`,
      kind,
      label: `${kind[0]!.toUpperCase()}${kind.slice(1)} ${opening.widthMm}×${opening.heightMm}`,
      detail: wallIndex >= 0 ? `Wall ${wallIndex + 1}` : "Opening",
      depth: 1,
      roomId: room.id,
      objectId: null,
      wallId: opening.wallId,
      openingId: opening.id,
    });
  }
  for (const object of selectRoomObjects(project, room.id)) {
    const manufactured = object.kind === "cabinet";
    nodes.push({
      id: `object:${object.id}`,
      kind: manufactured ? "cabinet" : "furniture",
      label: object.name,
      detail: manufactured ? "Manufactured cabinetry" : "Bought-in",
      depth: 1,
      roomId: room.id,
      objectId: object.id,
      wallId: null,
      openingId: null,
    });
  }
  return nodes;
}

export function buildDesignHierarchy(project: InteriorProject): DesignHierarchyNode[] {
  const activeFirst = [...project.rooms].sort((a, b) => {
    if (a.id === project.activeRoomId) return -1;
    if (b.id === project.activeRoomId) return 1;
    return 0;
  });
  return activeFirst.flatMap((room) => roomNodes(project, room.id, room.id === project.activeRoomId));
}

export function filterDesignHierarchy(nodes: readonly DesignHierarchyNode[], query: string): DesignHierarchyNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...nodes];
  const matchedRooms = new Set(
    nodes.filter((node) => `${node.label} ${node.detail} ${node.kind}`.toLowerCase().includes(needle)).map((node) => node.roomId),
  );
  return nodes.filter((node) => {
    if (node.kind === "room") return matchedRooms.has(node.roomId);
    return `${node.label} ${node.detail} ${node.kind}`.toLowerCase().includes(needle);
  });
}
