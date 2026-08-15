import { drawHeroVignette } from "../export/heroExportPolish";
import { applyContactFromDepth } from "./contactFromDepth";
import { applyUnsharp } from "./unsharp";

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read still engine input."));
    image.src = dataUrl;
  });
}

function drawToContext(image: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not run the still engine.");
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context };
}

/**
 * Deterministic hero still engine: grade + optional depth contact + unsharp + vignette.
 * Does not invent geometry or swap materials.
 */
export async function runHeroStillEngine(input: {
  plateDataUrl: string;
  depthDataUrl?: string;
  contrast?: number;
  saturate?: number;
  vignette?: number;
}) {
  const plateImage = await loadImage(input.plateDataUrl);
  const { canvas, context } = drawToContext(plateImage, plateImage.width, plateImage.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  if (input.depthDataUrl) {
    const depthImage = await loadImage(input.depthDataUrl);
    const depthCanvas = drawToContext(depthImage, canvas.width, canvas.height);
    applyContactFromDepth(
      pixels.data,
      depthCanvas.context.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
    );
  }
  applyUnsharp(pixels.data, canvas.width, canvas.height);
  context.putImageData(pixels, 0, 0);
  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height;
  const out = output.getContext("2d");
  if (!out) throw new Error("Could not grade the still.");
  out.filter = `contrast(${input.contrast ?? 1.14}) saturate(${input.saturate ?? 1.1})`;
  out.drawImage(canvas, 0, 0);
  out.filter = "none";
  drawHeroVignette(out, output.width, output.height, input.vignette ?? 0.16);
  return output.toDataURL("image/png", 1);
}
