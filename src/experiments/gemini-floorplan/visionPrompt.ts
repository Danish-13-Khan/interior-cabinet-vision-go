/** Prompt + JSON schema hints for Gemini Vision floor-plan extract. */

export const FLOORPLAN_VISION_SYSTEM = `You extract architectural floor-plan geometry from an image.
Return ONLY JSON matching the schema. Prefer plan coordinates in millimetres when scale is readable.
If scale is unclear, use relative plan units and set scaleConfidence to "low", and note assumptions.
Do not invent millwork or furniture. Walls and rooms only, with optional doors/windows.`;

export const FLOORPLAN_VISION_USER = `Extract walls and rooms from this floor-plan image.
Use this JSON shape:
{
  "units": "mm"|"cm"|"m"|"ft"|"in",
  "scaleConfidence": "low"|"medium"|"high",
  "assumedWallHeightMm": number,
  "rooms": [{ "id": string, "name"?: string, "outlineMm": [{ "x": number, "y": number }] }],
  "walls": [{ "id": string, "a": { "x": number, "y": number }, "b": { "x": number, "y": number }, "thicknessMm"?: number }],
  "openings"?: [{ "id": string, "kind": "door"|"window"|"opening", "wallId"?: string, "widthMm"?: number, "heightMm"?: number }],
  "notes"?: string[]
}
Coordinates share one plan origin; keep walls consistent with room outlines.`;

/** Gemini responseSchema subset for structured JSON mode. */
export const FLOORPLAN_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    units: { type: "string", enum: ["mm", "cm", "m", "ft", "in"] },
    scaleConfidence: { type: "string", enum: ["low", "medium", "high"] },
    assumedWallHeightMm: { type: "number" },
    rooms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          outlineMm: {
            type: "array",
            items: {
              type: "object",
              properties: { x: { type: "number" }, y: { type: "number" } },
              required: ["x", "y"],
            },
          },
        },
        required: ["id", "outlineMm"],
      },
    },
    walls: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          a: {
            type: "object",
            properties: { x: { type: "number" }, y: { type: "number" } },
            required: ["x", "y"],
          },
          b: {
            type: "object",
            properties: { x: { type: "number" }, y: { type: "number" } },
            required: ["x", "y"],
          },
          thicknessMm: { type: "number" },
        },
        required: ["id", "a", "b"],
      },
    },
    openings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["door", "window", "opening"] },
          wallId: { type: "string" },
          widthMm: { type: "number" },
          heightMm: { type: "number" },
        },
        required: ["id", "kind"],
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["units", "scaleConfidence", "assumedWallHeightMm", "rooms", "walls"],
} as const;
