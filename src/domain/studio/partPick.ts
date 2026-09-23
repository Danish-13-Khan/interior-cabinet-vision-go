import type { CabinetInstance } from "../cabinetDimensions";
import {
  buildCabinetPartIndex,
  parseCutlistKey,
  resolveFromCutlistKey,
  resolveFromGeometryName,
} from "../partIdentity";
import { expandCabinetPieces } from "../partIdentity/pieces";

export type PartPick = {
  /** Individual leaf. Null when the selection is the whole cut-list line. */
  pieceId: string | null;
  /** Grouped manufacturing line. Engineering rows match this, not pieceId. */
  cutlistKey: string;
  cabinetId: string;
  objectId: string;
  geometryNames: string[];
  label: string;
};

function objectIdFor(cabinet: CabinetInstance) {
  return cabinet.interiorObjectId || cabinet.id;
}

function toPick(
  cabinet: CabinetInstance,
  link: { pieceId?: string | null; cutlistKey: string; geometryNames: string[]; label: string },
): PartPick {
  return {
    pieceId: link.pieceId ?? null,
    cutlistKey: link.cutlistKey,
    cabinetId: cabinet.id,
    objectId: objectIdFor(cabinet),
    geometryNames: link.geometryNames,
    label: link.label,
  };
}

function piecePick(cabinet: CabinetInstance, key: string): PartPick | null {
  const piece = expandCabinetPieces(cabinet).find((item) => item.pieceId === key);
  if (!piece) return null;
  return toPick(cabinet, {
    pieceId: piece.pieceId,
    cutlistKey: piece.cutlistKey,
    geometryNames: piece.geometryNames,
    label: piece.label,
  });
}

export function partPickForCutlistKey(cabinets: readonly CabinetInstance[], key: string | null): PartPick | null {
  if (!key) return null;
  const parsed = parseCutlistKey(key);
  const cabinet = parsed ? cabinets.find((item) => item.id === parsed.cabinetId) : null;
  if (!cabinet) return null;
  const piece = key.includes(":piece:") ? piecePick(cabinet, key) : null;
  if (piece) return piece;
  const link = resolveFromCutlistKey(buildCabinetPartIndex(cabinet), key);
  return link ? toPick(cabinet, link) : null;
}

export function partPickForMesh(
  cabinets: readonly CabinetInstance[],
  objectId: string,
  geometryName: string,
): PartPick | null {
  const cabinet = cabinets.find((item) => objectIdFor(item) === objectId || item.id === objectId);
  if (!cabinet || !geometryName) return null;
  const piece = expandCabinetPieces(cabinet).find((item) => item.geometryNames.includes(geometryName));
  if (piece) {
    return toPick(cabinet, {
      pieceId: piece.pieceId,
      cutlistKey: piece.cutlistKey,
      geometryNames: piece.geometryNames,
      label: piece.label,
    });
  }
  const link = resolveFromGeometryName(buildCabinetPartIndex(cabinet), geometryName);
  return link ? toPick(cabinet, link) : null;
}

/** Drop a stored part when its object, room, or geometry no longer matches. */
export function retainedPartKey(input: {
  cutlistKey: string | null;
  cabinets: readonly CabinetInstance[];
  activeRoomId: string | null;
  selectedObjectIds: readonly string[];
  objectRoomId: (objectId: string) => string | null;
}) {
  const pick = partPickForCutlistKey(input.cabinets, input.cutlistKey);
  if (!pick) return null;
  if (!input.selectedObjectIds.includes(pick.objectId)) return null;
  const roomId = input.objectRoomId(pick.objectId);
  if (input.activeRoomId && roomId && roomId !== input.activeRoomId) return null;
  return input.cutlistKey;
}
