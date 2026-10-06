import type { CabinetInstance } from "../cabinetDimensions";
import { resolveFrontGaps } from "../cabinetConstruction/frontGaps";
import { SLIDING_OPENING_ID, slidingPullXMm } from "../cabinetConstruction/slidingFronts";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import type { CabinetElevationFaceLayout } from "../openingLayout";
import { elevMm, openingHitAttrs } from "./faceMetrics";
import { faceRectToSvg } from "./resolvedFronts";
import { line, rect } from "./svgPrimitives";

/** True when the elevation should draw sliding shutters instead of hinged door leaves. */
export function hasSlidingFronts(cabinet: CabinetInstance): boolean {
  return Boolean(normalizeConstructionSpec(cabinet.config.type, cabinet.config.construction).sliding);
}

/**
 * Sliding shutters in elevation (§3.4): overlapping leaves drawn as such (rear-track leaves
 * first, hidden rear edges dashed under the front leaf), one flush pull per leaf, no hinge
 * marks and no swing arcs. Sizes come from the one front resolver, like the cut list.
 */
export function renderSlidingLeaves(
  cabinet: CabinetInstance,
  layout: CabinetElevationFaceLayout,
  cabinetSvgX: number,
  cabinetSvgY: number,
  scale: number,
  activeId: string | null,
): string[] {
  const spec = normalizeConstructionSpec(cabinet.config.type, cabinet.config.construction).sliding;
  const entry = resolveFrontGaps(cabinet.config).openings.find((item) => item.opening.id === SLIDING_OPENING_ID);
  if (!spec || !entry) return [];
  const doorOpeningId = layout.openings.find((opening) => opening.contentType === "door")?.id ?? SLIDING_OPENING_ID;
  const active = activeId === doorOpeningId;
  const leaves = entry.leaves.map((leaf, index) => ({ leaf, index }));
  const ordered = [...leaves.filter(({ leaf }) => leaf.slidingPlane === 0), ...leaves.filter(({ leaf }) => leaf.slidingPlane === 1)];
  const elements: string[] = [];
  for (const { leaf, index } of ordered) {
    const box = faceRectToSvg(leaf, layout, cabinetSvgX, cabinetSvgY, scale);
    const plane = leaf.slidingPlane ?? 0;
    elements.push(rect(box.x, box.y, box.width, box.height,
      `${openingHitAttrs(cabinet.id, doorOpeningId, "door", active)} data-leaf-index="${index}" data-sliding-plane="${plane}"`));
    elements.push(rect(box.x, box.y, box.width, box.height,
      `class="twod-door-leaf-edge twod-sliding-leaf" data-sliding-plane="${plane}" fill="none" pointer-events="none"`));
    const pull = faceRectToSvg(
      { xMm: slidingPullXMm(leaf, index, entry.leaves.length, spec.overlapMm), yMm: leaf.yMm, widthMm: 0, heightMm: leaf.heightMm },
      layout, cabinetSvgX, cabinetSvgY, scale,
    );
    const pullH = Math.min(box.height * 0.22, elevMm(scale, 180));
    elements.push(line(pull.x, box.y + box.height / 2 - pullH / 2, pull.x, box.y + box.height / 2 + pullH / 2,
      `class="twod-cabinet-opening twod-door-handle twod-sliding-pull" pointer-events="none"`));
  }
  // Rear-leaf edges hidden behind a front leaf: dashed, so the overlap reads on the sheet.
  for (const front of entry.leaves.filter((leaf) => leaf.slidingPlane === 1)) {
    for (const rear of entry.leaves.filter((leaf) => leaf.slidingPlane === 0)) {
      for (const edgeMm of [rear.xMm, rear.xMm + rear.widthMm]) {
        if (edgeMm <= front.xMm || edgeMm >= front.xMm + front.widthMm) continue;
        const edge = faceRectToSvg({ xMm: edgeMm, yMm: rear.yMm, widthMm: 0, heightMm: rear.heightMm }, layout, cabinetSvgX, cabinetSvgY, scale);
        elements.push(line(edge.x, edge.y, edge.x, edge.y + edge.height,
          `class="twod-sliding-overlap twod-line-reference" stroke-dasharray="4 3" pointer-events="none"`));
      }
    }
  }
  return elements;
}
