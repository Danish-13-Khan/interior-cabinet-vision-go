import { distMm } from "./proposalGeom";
import { proposalBounds } from "./proposalBounds";
import type { FloorplanModelOutput, ModelPolygon } from "./floorplanModelTypes";
import type {
  GeminiFloorProposal,
  ProposalOpening,
  ProposalPoint,
  ProposalWall,
} from "./proposalTypes";

function mapPx(
  p: ProposalPoint,
  model: FloorplanModelOutput,
  minX: number,
  minY: number,
  width: number,
  height: number,
): ProposalPoint {
  const nx = p.x / Math.max(model.imageWidthPx - 1, 1);
  const ny = p.y / Math.max(model.imageHeightPx - 1, 1);
  return { x: minX + nx * width, y: minY + ny * height };
}

/** Consecutive edges; closes ring when first≈last or ≥3 points without duplicate close. */
function edgesFromPolygon(poly: ModelPolygon): Array<[ProposalPoint, ProposalPoint]> {
  const pts = poly.pointsPx;
  if (pts.length < 2) return [];
  if (pts.length === 2) return [[pts[0], pts[1]]];

  const first = pts[0];
  const last = pts[pts.length - 1];
  const alreadyClosed = Math.hypot(first.x - last.x, first.y - last.y) < 2;
  const edges: Array<[ProposalPoint, ProposalPoint]> = [];
  const lastIdx = alreadyClosed ? pts.length - 2 : pts.length - 1;
  for (let i = 0; i < lastIdx; i++) edges.push([pts[i], pts[i + 1]]);
  if (!alreadyClosed && pts.length >= 3) edges.push([pts[pts.length - 1], pts[0]]);
  return edges;
}

function wallEdgesFromModel(
  model: FloorplanModelOutput,
  minX: number,
  minY: number,
  width: number,
  height: number,
  minEdgeMm: number,
): ProposalWall[] {
  const walls: ProposalWall[] = [];
  let i = 0;
  for (const poly of model.polygons) {
    if (poly.class !== "wall") continue;
    for (const [pa, pb] of edgesFromPolygon(poly)) {
      const a = mapPx(pa, model, minX, minY, width, height);
      const b = mapPx(pb, model, minX, minY, width, height);
      if (distMm(a, b) < minEdgeMm) continue;
      i += 1;
      walls.push({ id: `model-w${i}`, a, b, thicknessMm: 100 });
    }
  }
  return walls;
}

function openingsFromModel(
  model: FloorplanModelOutput,
  minX: number,
  minY: number,
  width: number,
  height: number,
): ProposalOpening[] {
  const openings: ProposalOpening[] = [];
  let i = 0;
  for (const poly of model.polygons) {
    if (poly.class !== "door" && poly.class !== "window") continue;
    const pts = poly.pointsPx.map((p) => mapPx(p, model, minX, minY, width, height));
    if (pts.length < 2) continue;
    i += 1;
    openings.push({
      id: `model-${poly.class}-${i}`,
      kind: poly.class,
      widthMm: Math.round(distMm(pts[0], pts[pts.length - 1])) || undefined,
      heightMm: poly.class === "door" ? 2100 : 1200,
    });
  }
  return openings;
}

/**
 * Adapt CubiCasa-class polygon JSON → lab proposal geometry.
 * Uses Vision proposal bounds for mm scale; keeps Vision rooms/labels.
 */
export function adaptModelOutputToProposal(
  model: FloorplanModelOutput,
  vision: GeminiFloorProposal,
  options?: { minEdgeMm?: number },
): GeminiFloorProposal {
  const bounds = proposalBounds(vision);
  if (!bounds) {
    return {
      ...vision,
      notes: [...(vision.notes ?? []), "Phase 6C: model adapt skipped (empty Vision bounds)."],
    };
  }
  const { minX, minY, width, height } = bounds;
  const walls = wallEdgesFromModel(model, minX, minY, width, height, options?.minEdgeMm ?? 200);
  const modelOpenings = openingsFromModel(model, minX, minY, width, height);
  const openings = vision.openings?.length ? vision.openings : modelOpenings;
  const note = `Phase 6C model (${model.source}): walls from polygons; Vision room labels kept.`;
  const notes = [...(vision.notes ?? []), ...(model.notes ?? [])];
  if (!notes.includes(note)) notes.push(note);
  return {
    ...vision,
    walls: walls.length ? walls : vision.walls,
    openings,
    notes,
  };
}
