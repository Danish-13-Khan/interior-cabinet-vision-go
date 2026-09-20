import { dwgPreviewDataUrl, type DwgPreview } from './dwgGeometry';
import type { LivingRoomPlanUnderlay } from './planUnderlay';

export type DwgSource = { preview: DwgPreview; hiddenLayers: string[] };
const validated = new WeakMap<object, DwgSource | null>();
/** Project files are untrusted. Validate saved numeric SVG commands before regeneration. */
export function readDwgSource(value: unknown): DwgSource | undefined {
  if (!value || typeof value !== 'object') return undefined;
  if (validated.has(value)) return validated.get(value) ?? undefined;
  validated.set(value,null);
  const source = value as DwgSource;
  const p = source.preview;
  if (!p || !p.bounds || !Array.isArray(p.layers) || p.layers.length > 10000 || !Array.isArray(source.hiddenLayers)
    || !source.hiddenLayers.every(name => typeof name === 'string') || !Array.isArray(p.warnings) || !p.warnings.every(w => typeof w === 'string')) return undefined;
  const b = p.bounds;
  if (![b.minX,b.minY,b.maxX,b.maxY].every(Number.isFinite) || b.maxX<=b.minX || b.maxY<=b.minY) return undefined;
  let paths = 0, length = 0;
  for (const layer of p.layers) {
    if (!layer || typeof layer.name !== 'string' || !Array.isArray(layer.paths)) return undefined;
    for (const stroke of layer.paths) {
      if (++paths > 200000 || !stroke || typeof stroke.d !== 'string' || (length+=stroke.d.length)>50000000
        || !/^[MLAZ0-9eE+.,\s-]+$/.test(stroke.d) || !Array.isArray(stroke.matrix) || stroke.matrix.length !== 6 || !stroke.matrix.every(Number.isFinite)) return undefined;
    }
  }
  validated.set(value,source);
  return source;
}
export function toggleDwgLayer(underlay: LivingRoomPlanUnderlay, name: string): LivingRoomPlanUnderlay {
  const source = readDwgSource(underlay.dwg);
  if (!source || underlay.locked) return underlay;
  const hiddenLayers = source.hiddenLayers.includes(name) ? source.hiddenLayers.filter(n => n!==name) : [...source.hiddenLayers,name];
  return { ...underlay, dwg: { ...source, hiddenLayers }, dataUrl: dwgPreviewDataUrl(source.preview,hiddenLayers) };
}
