import type { DwgDatabase, DwgLineEntity, DwgLWPolylineEntity, DwgCircleEntity } from '@mlightcad/libredwg-web';
import { dwgMillimetersPerUnit, type DwgPlanBounds } from './dwgUnits';

export type DwgPreview = {
  bounds: DwgPlanBounds;
  layers: { name: string; paths: string[] }[];
  mmPerUnit: number | null;
  rendered: number;
  omitted: Record<string, number>;
};

/** Deliberately restricted to planar geometry that can be represented faithfully. */
export function buildDwgPreview(db: DwgDatabase, unknownEntityCount = 0): DwgPreview {
  const layers = new Map<string, string[]>();
  const omitted: Record<string, number> = Object.create(null);
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  let rendered = 0;
  const omit = (type: string) => { omitted[type] = (omitted[type] ?? 0) + 1; };
  if (unknownEntityCount) omitted['Parser unsupported entities'] = unknownEntityCount;
  if (db.entities.length > 200000) throw new Error('This drawing exceeds the 200,000 entity preview limit. Export a smaller room drawing.');
  for (const entity of db.entities) {
    if (entity.isInPaperSpace) { omit('Paper space'); continue; }
    const extrusion = (entity as DwgLineEntity).extrusionDirection;
    if (extrusion && (extrusion.x !== 0 || extrusion.y !== 0 || extrusion.z !== 1)) {
      omit(`${entity.type} (non-planar)`); continue;
    }
    let path = '';
    let points: { x: number; y: number; z?: number }[] = [];
    if (entity.type === 'LINE') {
      const line = entity as DwgLineEntity;
      points = [line.startPoint, line.endPoint];
      if (points.some(p => p.z !== undefined && p.z !== 0)) { omit('LINE (3D)'); continue; }
      path = `M${line.startPoint.x},${-line.startPoint.y} L${line.endPoint.x},${-line.endPoint.y}`;
    } else if (entity.type === 'LWPOLYLINE') {
      const poly = entity as DwgLWPolylineEntity;
      if (poly.elevation || poly.vertices.some(v => v.bulge)) { omit('LWPOLYLINE (curved/elevated)'); continue; }
      points = poly.vertices;
      path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${-p.y}`).join(' ') + ((poly.flag & 1) ? ' Z' : '');
    } else if (entity.type === 'CIRCLE') {
      const circle = entity as DwgCircleEntity;
      const { x, y, z } = circle.center;
      const r = circle.radius;
      if (!Number.isFinite(r) || r <= 0 || z) { omit('CIRCLE (invalid/3D)'); continue; }
      points = [{ x: x - r, y: y - r }, { x: x + r, y: y + r }];
      path = `M${x-r},${-y} a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-2*r},0`;
    } else { omit(entity.type); continue; }
    if (points.length < 2 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
      omit(`${entity.type} (invalid)`); continue;
    }
    for (const point of points) {
      bounds.minX = Math.min(bounds.minX, point.x); bounds.maxX = Math.max(bounds.maxX, point.x);
      bounds.minY = Math.min(bounds.minY, point.y); bounds.maxY = Math.max(bounds.maxY, point.y);
    }
    const name = entity.layer || '0';
    const paths = layers.get(name) ?? [];
    paths.push(path); layers.set(name, paths); rendered++;
  }
  if (!rendered || bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) {
    throw new Error(`No usable planar area found. Omitted: ${Object.entries(omitted).map(([k,v]) => `${k}: ${v}`).join(', ') || 'empty drawing'}.`);
  }
  return { bounds, layers: [...layers].map(([name, paths]) => ({ name, paths })),
    mmPerUnit: dwgMillimetersPerUnit(db.header.INSUNITS), rendered, omitted };
}

export function dwgPreviewDataUrl(preview: DwgPreview, hidden: string[] = []): string {
  const b = preview.bounds;
  const width = b.maxX-b.minX, height = b.maxY-b.minY;
  const paths = preview.layers.filter(layer => !hidden.includes(layer.name))
    .flatMap(layer => layer.paths).map(d => `<path d="${d}"/>`).join('');
  // Paths contain numeric coordinates only. Never interpolate source text into SVG markup.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${-b.maxY} ${width} ${height}" width="${width}" height="${height}"><g fill="none" stroke="#263238" stroke-width="${Math.max(width,height)/2000}">${paths}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
