import { createCanvas } from "@napi-rs/canvas";

type CanvasPair = {
  canvas: { width: number; height: number } | null;
  context: CanvasRenderingContext2D | null;
};

/** Node canvas factory for PDF.js page renders (glyphs, images, paths). */
export class ProposalCanvasFactory {
  constructor(_options?: { enableHWA?: boolean }) {}

  create(width: number, height: number): CanvasPair {
    const canvas = createCanvas(Math.max(1, Math.floor(width)), Math.max(1, Math.floor(height)));
    return {
      canvas,
      context: canvas.getContext("2d") as unknown as CanvasRenderingContext2D,
    };
  }

  reset(pair: CanvasPair, width: number, height: number) {
    if (!pair.canvas) return;
    pair.canvas.width = Math.max(1, Math.floor(width));
    pair.canvas.height = Math.max(1, Math.floor(height));
  }

  destroy(pair: CanvasPair) {
    if (pair.canvas) {
      pair.canvas.width = 0;
      pair.canvas.height = 0;
    }
    pair.canvas = null;
    pair.context = null;
  }
}

export function readCanvasPixels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  return context.getImageData(0, 0, width, height).data;
}
