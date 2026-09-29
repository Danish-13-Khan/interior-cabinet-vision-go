type UnderlaySource = { sourceType?: "dwg"; fileName: string; dataUrl: string };

const RASTER_DATA_URL = /^data:image\/(png|jpe?g|webp);/i;

/**
 * The extractor only reads raster plans; DWG underlays are vector previews.
 * PDF plans pass because planUnderlayPdf rasterises the chosen page to a PNG data URL on import.
 */
export function canExtractFromUnderlay(underlay: UnderlaySource | null): underlay is UnderlaySource {
  return Boolean(underlay && underlay.sourceType !== "dwg" && RASTER_DATA_URL.test(underlay.dataUrl));
}

export function underlayUploadName(underlay: UnderlaySource): string {
  const ext = underlay.dataUrl.match(RASTER_DATA_URL)?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? "png";
  const base = underlay.fileName.replace(/\.[^.]+$/, "") || "floorplan";
  return `${base}.${ext}`;
}

export async function underlayToFile(underlay: UnderlaySource): Promise<File> {
  const blob = await (await fetch(underlay.dataUrl)).blob();
  return new File([blob], underlayUploadName(underlay), { type: blob.type });
}
