import type { GeminiFloorProposal } from "./proposalTypes";

/** Offline sample used when no API key — rectangle kitchen in mm. */
export const SAMPLE_RECT_KITCHEN_MM: GeminiFloorProposal = {
  units: "mm",
  scaleConfidence: "medium",
  assumedWallHeightMm: 2700,
  rooms: [
    {
      id: "kitchen",
      name: "Kitchen",
      outlineMm: [
        { x: 0, y: 0 },
        { x: 3600, y: 0 },
        { x: 3600, y: 3000 },
        { x: 0, y: 3000 },
      ],
    },
  ],
  walls: [
    { id: "w1", a: { x: 0, y: 0 }, b: { x: 3600, y: 0 }, thicknessMm: 100 },
    { id: "w2", a: { x: 3600, y: 0 }, b: { x: 3600, y: 3000 }, thicknessMm: 100 },
    { id: "w3", a: { x: 3600, y: 3000 }, b: { x: 0, y: 3000 }, thicknessMm: 100 },
    { id: "w4", a: { x: 0, y: 3000 }, b: { x: 0, y: 0 }, thicknessMm: 100 },
  ],
  openings: [
    { id: "door-1", kind: "door", wallId: "w1", widthMm: 900, heightMm: 2100 },
    { id: "win-1", kind: "window", wallId: "w2", widthMm: 1200, heightMm: 1200 },
  ],
  notes: ["Offline fixture — not from Gemini Vision."],
};

/** Same kitchen expressed in metres (tests unit normalize). */
export const SAMPLE_RECT_KITCHEN_M: GeminiFloorProposal = {
  units: "m",
  scaleConfidence: "low",
  assumedWallHeightMm: 2.7,
  rooms: [
    {
      id: "kitchen",
      name: "Kitchen",
      outlineMm: [
        { x: 0, y: 0 },
        { x: 3.6, y: 0 },
        { x: 3.6, y: 3 },
        { x: 0, y: 3 },
      ],
    },
  ],
  walls: [
    { id: "w1", a: { x: 0, y: 0 }, b: { x: 3.6, y: 0 }, thicknessMm: 0.1 },
    { id: "w2", a: { x: 3.6, y: 0 }, b: { x: 3.6, y: 3 }, thicknessMm: 0.1 },
    { id: "w3", a: { x: 3.6, y: 3 }, b: { x: 0, y: 3 }, thicknessMm: 0.1 },
    { id: "w4", a: { x: 0, y: 3 }, b: { x: 0, y: 0 }, thicknessMm: 0.1 },
  ],
  notes: ["Fixture in metres — normalize to mm before 3D."],
};

export const SAMPLE_L_ROOM_CM: GeminiFloorProposal = {
  units: "cm",
  scaleConfidence: "medium",
  assumedWallHeightMm: 270,
  rooms: [
    {
      id: "living",
      name: "L Living",
      outlineMm: [
        { x: 0, y: 0 },
        { x: 500, y: 0 },
        { x: 500, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 500 },
        { x: 0, y: 500 },
      ],
    },
  ],
  walls: [
    { id: "w1", a: { x: 0, y: 0 }, b: { x: 500, y: 0 }, thicknessMm: 12 },
    { id: "w2", a: { x: 500, y: 0 }, b: { x: 500, y: 300 }, thicknessMm: 12 },
    { id: "w3", a: { x: 500, y: 300 }, b: { x: 300, y: 300 }, thicknessMm: 12 },
    { id: "w4", a: { x: 300, y: 300 }, b: { x: 300, y: 500 }, thicknessMm: 12 },
    { id: "w5", a: { x: 300, y: 500 }, b: { x: 0, y: 500 }, thicknessMm: 12 },
    { id: "w6", a: { x: 0, y: 500 }, b: { x: 0, y: 0 }, thicknessMm: 12 },
  ],
  notes: ["L-shaped offline fixture in centimetres."],
};
