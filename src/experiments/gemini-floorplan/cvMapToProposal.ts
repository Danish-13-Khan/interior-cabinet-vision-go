import { proposalBounds } from "./proposalBounds";
import type { PixelSegment } from "./geometryMode";
import type { GeminiFloorProposal, ProposalWall } from "./proposalTypes";

export type InkBox = { minX: number; minY: number; maxX: number; maxY: number };

/** Map pixel segments into proposal mm using ink bbox ↔ proposal bounds. */
export function mapSegmentsToProposalWalls(
  segments: PixelSegment[],
  inkBox: InkBox,
  proposal: GeminiFloorProposal,
): ProposalWall[] {
  const bounds = proposalBounds(proposal);
  if (!bounds) return [];
  const { minX, minY, width, height } = bounds;
  const iw = Math.max(inkBox.maxX - inkBox.minX, 1);
  const ih = Math.max(inkBox.maxY - inkBox.minY, 1);

  function toMm(px: number, py: number) {
    const nx = (px - inkBox.minX) / iw;
    const ny = (py - inkBox.minY) / ih;
    return {
      x: minX + nx * width,
      y: minY + ny * height,
    };
  }

  return segments.map((s, i) => {
    const a = toMm(s.x1, s.y1);
    const b = toMm(s.x2, s.y2);
    return {
      id: `cv-w${i + 1}`,
      a,
      b,
      thicknessMm: 100,
    };
  });
}
