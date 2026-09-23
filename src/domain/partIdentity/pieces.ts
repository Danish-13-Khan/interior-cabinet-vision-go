import type { CabinetInstance } from "../cabinetDimensions";
import { layoutCabinetElevationFace, type OpeningFaceRect } from "../openingLayout";
import { createCabinetProductionCutlist, type ProductionCutlistLine } from "../productionCutlist";
import { buildCabinetPartIndex } from "./resolve";

export type PhysicalPiece = {
  pieceId: string;
  cabinetId: string;
  openingId: string | null;
  openingLabel: string | null;
  drawerIndex: number | null;
  role: string;
  label: string;
  cutlistKey: string;
  constructionKey: string;
  geometryNames: string[];
  detail: string;
};

function pieceId(cabinetId: string, scope: string, role: string, index: number) {
  return `${cabinetId}:piece:${scope}:${role}:${index}`;
}

function claimLine(lines: readonly ProductionCutlistLine[], used: Set<string>, partIds: string[]) {
  for (const partId of partIds) {
    const line = lines.find((item) => item.partId === partId && !used.has(item.key));
    if (!line) continue;
    used.add(line.key);
    return line;
  }
  return null;
}

function addPiece(
  pieces: PhysicalPiece[],
  cabinetId: string,
  opening: OpeningFaceRect | null,
  role: string,
  index: number,
  label: string,
  line: ProductionCutlistLine,
  geometryNames: string[],
  drawerIndex: number | null = null,
) {
  pieces.push({
    pieceId: pieceId(cabinetId, opening ? opening.stableId || opening.id : "case", role, index),
    cabinetId,
    openingId: opening?.id ?? null,
    openingLabel: opening?.label ?? null,
    drawerIndex,
    role,
    label,
    cutlistKey: line.key,
    constructionKey: line.partId,
    geometryNames,
    detail: `${line.material} · ${line.thicknessMm} mm`,
  });
}

function emitDoors(
  pieces: PhysicalPiece[],
  cabinetId: string,
  opening: OpeningFaceRect,
  openingCount: number,
  lines: readonly ProductionCutlistLine[],
  used: Set<string>,
) {
  const count = opening.doorStyle === "single" ? 1 : 2;
  const line = claimLine(lines, used, [`door-${opening.id}`, "door"]);
  if (!line) return;
  for (let index = 1; index <= count; index += 1) {
    const geometry = openingCount === 1 && count === 2
      ? index === 1 ? "left-door" : "right-door"
      : openingCount === 1 ? "door" : `door-${opening.id}-${index}`;
    addPiece(pieces, cabinetId, opening, "door", index, `${opening.label} · Door ${index}`, line, [geometry]);
  }
}

function emitShelves(
  pieces: PhysicalPiece[],
  cabinetId: string,
  opening: OpeningFaceRect,
  openingCount: number,
  lines: readonly ProductionCutlistLine[],
  used: Set<string>,
) {
  if (opening.shelfCount <= 0) return;
  if (opening.contentType !== "door" && opening.contentType !== "open-shelf") return;
  const line = claimLine(lines, used, [`shelf-${opening.id}`, "shelf"]);
  if (!line) return;
  for (let index = 1; index <= opening.shelfCount; index += 1) {
    const geometry = openingCount === 1 ? `shelf-${index}` : `shelf-${opening.id}-${index}`;
    addPiece(pieces, cabinetId, opening, "shelf", index, `${opening.label} · Shelf ${index}`, line, [geometry]);
  }
}

function emitDrawers(
  pieces: PhysicalPiece[],
  cabinetId: string,
  opening: OpeningFaceRect,
  openingCount: number,
  lines: readonly ProductionCutlistLine[],
  used: Set<string>,
  drawerOpeningCount: number,
) {
  const count = Math.max(1, opening.drawerCount);
  const suffix = drawerOpeningCount === 1 ? "" : `-${opening.id}`;
  const custom = opening.drawerRatios?.length === count;
  const side = claimLine(lines, used, [`drawer-side${suffix}`, "drawer-side"]);
  const end = claimLine(lines, used, [`drawer-front-back${suffix}`, "drawer-front-back"]);
  const bottom = claimLine(lines, used, [`drawer-bottom${suffix}`, "drawer-bottom"]);
  const sharedFront = custom ? null : claimLine(lines, used, [`drawer-front${suffix}`, "drawer-front"]);
  for (let drawer = 1; drawer <= count; drawer += 1) {
    const front = custom
      ? claimLine(lines, used, [`drawer-front${suffix}-${drawer}`, `drawer-front-${drawer}`])
      : sharedFront;
    const geometry = openingCount === 1 ? `drawer-front-${drawer}` : `drawer-${opening.id}-${drawer}`;
    if (front) addPiece(pieces, cabinetId, opening, `drawer:${drawer}:front`, 1, `Drawer ${drawer} · Front`, front, [geometry], drawer);
    if (side) {
      addPiece(pieces, cabinetId, opening, `drawer:${drawer}:side`, 1, `Drawer ${drawer} · Left side`, side, [], drawer);
      addPiece(pieces, cabinetId, opening, `drawer:${drawer}:side`, 2, `Drawer ${drawer} · Right side`, side, [], drawer);
    }
    if (end) {
      addPiece(pieces, cabinetId, opening, `drawer:${drawer}:end`, 1, `Drawer ${drawer} · Box front`, end, [], drawer);
      addPiece(pieces, cabinetId, opening, `drawer:${drawer}:end`, 2, `Drawer ${drawer} · Box back`, end, [], drawer);
    }
    if (bottom) addPiece(pieces, cabinetId, opening, `drawer:${drawer}:bottom`, 1, `Drawer ${drawer} · Bottom`, bottom, [], drawer);
  }
}

function emitCase(
  pieces: PhysicalPiece[],
  cabinet: CabinetInstance,
  lines: readonly ProductionCutlistLine[],
  used: Set<string>,
) {
  const meshes = new Map(buildCabinetPartIndex(cabinet).links.map((link) => [link.cutlistKey, link.geometryNames]));
  for (const line of lines) {
    if (used.has(line.key)) continue;
    const names = line.quantity === 1 ? meshes.get(line.key) ?? [] : [];
    const count = Math.max(1, line.quantity);
    for (let index = 1; index <= count; index += 1) {
      addPiece(
        pieces,
        cabinet.id,
        null,
        line.partId,
        index,
        count > 1 ? `${line.label} ${index}` : line.label,
        line,
        count === 1 ? names : names[index - 1] ? [names[index - 1]!] : [],
      );
    }
  }
}

/** One stable id per physical piece. Opening splits keep the original opening id. */
export function expandCabinetPieces(cabinet: CabinetInstance, cabinetIndex = 1): PhysicalPiece[] {
  const lines = createCabinetProductionCutlist(cabinet, cabinetIndex);
  const layout = layoutCabinetElevationFace(cabinet.config);
  const used = new Set<string>();
  const pieces: PhysicalPiece[] = [];
  const drawerOpenings = layout.openings.filter((opening) => opening.contentType === "drawer-stack").length;
  for (const opening of layout.openings) {
    if (opening.contentType === "door") emitDoors(pieces, cabinet.id, opening, layout.openings.length, lines, used);
    if (opening.contentType === "drawer-stack") {
      emitDrawers(pieces, cabinet.id, opening, layout.openings.length, lines, used, drawerOpenings);
    }
    emitShelves(pieces, cabinet.id, opening, layout.openings.length, lines, used);
  }
  emitCase(pieces, cabinet, lines, used);
  return pieces;
}
