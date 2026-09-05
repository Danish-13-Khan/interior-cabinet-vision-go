/** Intermediate format for CubiCasa / floorplan-to-3d–style outputs (lab Phase 6C). */

export type ModelPolygonClass = "wall" | "door" | "window" | "floor";

export type ModelPointPx = { x: number; y: number };

export type ModelPolygon = {
  class: ModelPolygonClass;
  /** Image-pixel ring or open polyline (≥2 points). */
  pointsPx: ModelPointPx[];
};

export type FloorplanModelOutput = {
  source: "cubicasa" | "floorplan-to-3d" | "fixture" | "unknown";
  imageWidthPx: number;
  imageHeightPx: number;
  polygons: ModelPolygon[];
  notes?: string[];
};
