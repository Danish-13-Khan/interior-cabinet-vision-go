/** Shared Phase 6 geometry view modes. */
export type GeometryViewMode = "raw" | "cleaned" | "cv" | "model";

export type GrayBuffer = {
  width: number;
  height: number;
  /** Luminance 0–255, length width*height */
  data: Uint8Array;
};

export type BinaryMask = {
  width: number;
  height: number;
  /** 1 = ink (wall), 0 = background */
  data: Uint8Array;
};

export type PixelSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  axis: "h" | "v";
};
