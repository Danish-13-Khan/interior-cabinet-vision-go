import type { GeminiFloorProposal } from "./proposalTypes";

/**
 * Deliberately bad Vision-like geometry for Phase 6 demos.
 * Raw looks skewed; 6A cleaned snaps ortho and merges stubs.
 */
export const SAMPLE_MESSY_KITCHEN_MM: GeminiFloorProposal = {
  units: "mm",
  scaleConfidence: "low",
  assumedWallHeightMm: 2700,
  rooms: [
    {
      id: "kitchen",
      name: "Kitchen (messy Vision)",
      outlineMm: [
        { x: 40, y: -80 },
        { x: 3680, y: 120 },
        { x: 3520, y: 3080 },
        { x: -60, y: 2920 },
      ],
    },
  ],
  walls: [
    { id: "w1", a: { x: 20, y: -60 }, b: { x: 3650, y: 140 }, thicknessMm: 100 },
    { id: "w1-stub", a: { x: 1800, y: 40 }, b: { x: 3650, y: 140 }, thicknessMm: 100 },
    { id: "w2", a: { x: 3620, y: 80 }, b: { x: 3480, y: 3050 }, thicknessMm: 100 },
    { id: "w3", a: { x: 3500, y: 3100 }, b: { x: -40, y: 2880 }, thicknessMm: 100 },
    { id: "w4", a: { x: -20, y: 2950 }, b: { x: 60, y: -40 }, thicknessMm: 100 },
    { id: "w-noise", a: { x: 900, y: 1400 }, b: { x: 980, y: 1480 }, thicknessMm: 100 },
  ],
  openings: [
    { id: "door-1", kind: "door", wallId: "w1", widthMm: 900, heightMm: 2100 },
  ],
  notes: [
    "Messy offline fixture — simulates sloppy Vision walls.",
    "Switch Raw → 6A cleaned to see Phase 6 cleanup.",
  ],
};
