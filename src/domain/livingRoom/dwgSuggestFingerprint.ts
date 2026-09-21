import type { DwgPreview } from "./dwgGeometry";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { DwgSuggestPlanRegion } from "./dwgSuggestSelection";

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function previewIdentity(preview: DwgPreview | undefined) {
  if (!preview) return "";
  const bounds = preview.bounds;
  const full = preview.fullBounds;
  const strokes = preview.layers
    .map((layer) => `${layer.name}:${layer.paths.map((path) => `${path.d}:${path.matrix.join(",")}`).join("/")}`)
    .join(";");
  return [
    bounds.minX, bounds.minY, bounds.maxX, bounds.maxY,
    full ? `${full.minX},${full.minY},${full.maxX},${full.maxY}` : "",
    preview.rendered,
    preview.inserts.length,
    hashText(strokes),
  ].join(",");
}

function sourceIdentity(underlay: LivingRoomPlanUnderlay | null) {
  if (underlay?.dwg?.preview) return previewIdentity(underlay.dwg.preview);
  const url = underlay?.dataUrl ?? "";
  return `${url.length}:${hashText(url.slice(0, 256) + url.slice(-256))}`;
}

/** Pose, scale, source geometry, visibility, layers, and region that locate candidates. */
export function dwgSuggestGeometryFingerprint(
  underlay: LivingRoomPlanUnderlay | null,
  layers: readonly string[],
  region: DwgSuggestPlanRegion | null,
): string {
  const hidden = [...(underlay?.dwg?.hiddenLayers ?? [])].sort().join(",");
  const selected = [...layers].sort().join(",");
  const box = region
    ? `${region.minX},${region.minZ},${region.maxX},${region.maxZ}`
    : "";
  return [
    underlay?.fileName ?? "",
    sourceIdentity(underlay),
    underlay?.hidden ? 1 : 0,
    underlay?.widthMm ?? "",
    underlay?.heightMm ?? "",
    underlay?.xMm ?? 0,
    underlay?.zMm ?? 0,
    underlay?.rotationDeg ?? 0,
    underlay?.calibrated ? 1 : 0,
    hidden,
    selected,
    box,
  ].join("|");
}
