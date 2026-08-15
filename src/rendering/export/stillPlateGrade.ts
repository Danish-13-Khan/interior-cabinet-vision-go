type StillPlateGradeOptions = {
  contrast?: number;
  saturate?: number;
};

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read still plate image."));
    image.src = dataUrl;
  });
}

/** Deterministic faithful grade (exposure_grade). Not AI and not a new scene. */
export async function gradeHeroPlate(
  dataUrl: string,
  options: StillPlateGradeOptions = {},
): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not grade the still plate.");
  context.filter = `contrast(${options.contrast ?? 1.08}) saturate(${options.saturate ?? 1.06})`;
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png", 1);
}
