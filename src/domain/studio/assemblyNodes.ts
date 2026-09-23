import type { CabinetInstance } from "../cabinetDimensions";
import { layoutCabinetElevationFace } from "../openingLayout";
import { expandCabinetPieces, type PhysicalPiece } from "../partIdentity/pieces";
import type { DesignHierarchyNode } from "./designHierarchy";

function groupNode(
  id: string,
  label: string,
  detail: string,
  depth: number,
  roomId: string,
  objectId: string,
  openingId: string | null,
): DesignHierarchyNode {
  return {
    id, kind: "group", label, detail, depth, roomId, objectId,
    wallId: null, openingId,
  };
}

function partNode(piece: PhysicalPiece, depth: number, roomId: string, objectId: string): DesignHierarchyNode {
  return {
    id: piece.pieceId,
    kind: "part",
    label: piece.label,
    detail: piece.detail,
    depth,
    roomId,
    objectId,
    wallId: null,
    openingId: piece.openingId,
    cutlistKey: piece.cutlistKey,
    constructionKey: piece.constructionKey,
    pieceId: piece.pieceId,
  };
}

function drawerNodes(
  pieces: readonly PhysicalPiece[],
  roomId: string,
  objectId: string,
): DesignHierarchyNode[] {
  const indexes = [...new Set(pieces.map((piece) => piece.drawerIndex).filter((index): index is number => index !== null))];
  const nodes: DesignHierarchyNode[] = [];
  for (const index of indexes) {
    const members = pieces.filter((piece) => piece.drawerIndex === index);
    const sample = members[0];
    if (!sample?.openingId) continue;
    nodes.push(groupNode(
      `asm:${sample.cabinetId}:${sample.openingId}:drawer:${index}`,
      `Drawer ${index}`,
      `${members.length} parts`,
      4,
      roomId,
      objectId,
      sample.openingId,
    ));
    nodes.push(...members.map((piece) => partNode(piece, 5, roomId, objectId)));
  }
  return nodes;
}

/** Carcass pieces, then one node per opening, with each drawer holding its front and box. */
export function assemblyPartNodes(
  cabinet: CabinetInstance,
  roomId: string,
  objectId: string,
  cabinetIndex = 1,
): DesignHierarchyNode[] {
  const pieces = expandCabinetPieces(cabinet, cabinetIndex);
  const openings = layoutCabinetElevationFace(cabinet.config).openings;
  const nodes: DesignHierarchyNode[] = [];
  const carcass = pieces.filter((piece) => !piece.openingId);
  if (carcass.length) {
    nodes.push(groupNode(`group:${cabinet.id}:Carcass`, "Carcass", `${carcass.length} parts`, 3, roomId, objectId, null));
    nodes.push(...carcass.map((piece) => partNode(piece, 4, roomId, objectId)));
  }
  for (const opening of openings) {
    const members = pieces.filter((piece) => piece.openingId === opening.id);
    const loose = members.filter((piece) => piece.drawerIndex === null);
    nodes.push(groupNode(
      `asm:${cabinet.id}:${opening.id}`,
      opening.label,
      members.length ? `${members.length} parts` : "Empty",
      3,
      roomId,
      objectId,
      opening.id,
    ));
    nodes.push(...loose.map((piece) => partNode(piece, 4, roomId, objectId)));
    nodes.push(...drawerNodes(members, roomId, objectId));
  }
  return nodes;
}
