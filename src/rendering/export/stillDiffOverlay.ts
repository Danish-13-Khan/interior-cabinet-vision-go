function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read still images for diff."));
    image.src = dataUrl;
  });
}

/** Simple |plate − still| overlay so review can show a mask, not just two photos. */
export async function stillDiffOverlayDataUrl(plateDataUrl: string, stillDataUrl: string) {
  const [plate, still] = await Promise.all([loadImage(plateDataUrl), loadImage(stillDataUrl)]);
  const width = Math.min(plate.width, still.width);
  const height = Math.min(plate.height, still.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not build the still diff overlay.");

  context.drawImage(plate, 0, 0, width, height);
  const platePixels = context.getImageData(0, 0, width, height);
  context.drawImage(still, 0, 0, width, height);
  const stillPixels = context.getImageData(0, 0, width, height);

  const out = context.createImageData(width, height);
  for (let i = 0; i < platePixels.data.length; i += 4) {
    const delta =
      Math.abs(platePixels.data[i] - stillPixels.data[i])
      + Math.abs(platePixels.data[i + 1] - stillPixels.data[i + 1])
      + Math.abs(platePixels.data[i + 2] - stillPixels.data[i + 2]);
    const boosted = Math.min(255, delta * 3);
    out.data[i] = boosted;
    out.data[i + 1] = Math.round(boosted * 0.2);
    out.data[i + 2] = Math.round(boosted * 0.2);
    out.data[i + 3] = 255;
  }
  context.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png", 1);
}
