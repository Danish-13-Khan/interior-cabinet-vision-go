import type { DwgDatabase, DwgEntity, DwgLineEntity, DwgLWPolylineEntity, DwgCircleEntity, DwgArcEntity, DwgEllipseEntity, DwgInsertEntity, DwgPolyline2dEntity, DwgPolyline3dEntity } from '@mlightcad/libredwg-web';
import { dwgMillimetersPerUnit, type DwgPlanBounds } from './dwgUnits';
import { IDENTITY, TAU, mod, multiply, transform, pose, ellipseArc, bulgeArc, type Matrix, type Point } from './dwgGeometryMath';

export type DwgStroke = { d: string; matrix: Matrix };
export type DwgInsertHint = { name: string; layer: string; x: number; y: number; rotation: number };
export type DwgPreview = {
  bounds: DwgPlanBounds;
  layers: { name: string; paths: DwgStroke[]; visible: boolean }[];
  mmPerUnit: number | null;
  rendered: number;
  omitted: Record<string, number>;
  warnings: string[];
  inserts: DwgInsertHint[];
};
export const DWG_GEOMETRY_DESCRIPTION = 'Lines, arcs, circles, ellipses, straight/curved polylines and nested blocks. Text, hatches, splines, proxy objects and external files may be omitted; inspect the report.';
const MAX_ENTITIES = 200000;
const MAX_COORDINATES = 2000000;

/** Convert model-space geometry without allowing source strings into SVG markup. */
export function buildDwgPreview(db: DwgDatabase, unknownEntityCount = 0): DwgPreview {
  const layers = new Map<string, DwgPreview['layers'][number]>();
  const layerEntries = new Map((db.tables?.LAYER?.entries ?? []).map(layer => [layer.name, layer]));
  const blocks = new Map((db.tables?.BLOCK_RECORD?.entries ?? []).map(block => [block.name, block]));
  const omitted: Record<string, number> = Object.create(null);
  const warnings = new Set<string>();
  const inserts: DwgInsertHint[] = [];
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  let rendered = 0, visited = 0, coordinates = 0;
  const omit = (type: string) => { omitted[type] = (omitted[type] ?? 0) + 1; };
  if (unknownEntityCount) omitted['Parser unsupported entities'] = unknownEntityCount;
  function visit(entity: DwgEntity, parent: Matrix, inheritedLayer = '0', stack: string[] = []) {
    if (++visited > MAX_ENTITIES) throw new Error('Drawing exceeds the 200,000 expanded entity limit. Export a smaller room drawing.');
    if (entity.isInPaperSpace) { omit('Paper space'); return; }
    if (entity.isVisible === false) { omit('Invisible entities'); return; }
    const name = !entity.layer || entity.layer === '0' ? inheritedLayer : entity.layer;
    const typed = entity as DwgLineEntity;
    let extrusion = typed.extrusionDirection;
    // LibreDWG exposes native LWPOLYLINE flags: 1 = explicit extrusion, 512 = closed.
    // Without bit 1 its zero extrusion storage means the default +Z normal.
    if (entity.type === 'LWPOLYLINE' && !((entity as DwgLWPolylineEntity).flag & 1)) extrusion = { x: 0, y: 0, z: 1 };
    if (extrusion && (Math.abs(extrusion.x)>1e-9 || Math.abs(extrusion.y)>1e-9 || Math.abs(Math.abs(extrusion.z)-1)>1e-9)) {
      omit(`${entity.type} (tilted/invalid plane)`); return;
    }
    const ocs = multiply(parent, extrusion?.z === -1 ? [-1,0,0,1,0,0] : IDENTITY);
    let matrix = ocs;
    try {
      if (entity.type === 'INSERT' || entity.type === 'DIMENSION') {
        const insert = entity as DwgInsertEntity;
        if (entity.type === 'INSERT' && stack.length === 0 && insert.name && insert.insertionPoint) {
          inserts.push({
            name: insert.name, layer: name, x: insert.insertionPoint.x, y: insert.insertionPoint.y,
            rotation: insert.rotation ?? 0,
          });
        }
        const block = blocks.get(insert.name);
        if (!block) { omit(`Missing block: ${insert.name}`); return; }
        if (block.flags & 12) { omit(`External reference: ${insert.name}`); return; }
        if (stack.includes(insert.name) || stack.length >= 32) { omit(`Recursive/deep block: ${insert.name}`); return; }
        const isDimension = entity.type === 'DIMENSION';
        const p = isDimension ? { x: 0, y: 0 } : insert.insertionPoint;
        const rotation = isDimension ? 0 : (insert.rotation ?? 0);
        const sx = isDimension ? 1 : (insert.xScale ?? 1), sy = isDimension ? 1 : (insert.yScale ?? 1);
        const rows = isDimension ? 1 : Math.max(1, insert.rowCount || 1), cols = isDimension ? 1 : Math.max(1, insert.columnCount || 1);
        if (![p.x,p.y,rotation,sx,sy,rows,cols].every(Number.isFinite) || !sx || !sy || !Number.isInteger(rows) || !Number.isInteger(cols)) throw new Error('Invalid insert');
        if (rows*cols > 10000) throw new Error('Too many block instances');
        for (let row=0;row<rows;row++) for (let col=0;col<cols;col++) {
          const offset = pose(col*(insert.columnSpacing || 0),row*(insert.rowSpacing || 0));
          const base = block.basePoint ?? { x: 0, y: 0 };
          const local = multiply(pose(p.x,p.y,rotation),multiply(offset,multiply(pose(0,0,0,sx,sy),pose(-base.x,-base.y))));
          const next = multiply(ocs,local);
          for (const child of block.entities) visit(child,next,name,[...stack,insert.name]);
        }
        if (insert.attribs?.length) warnings.add('Block attribute text is omitted.');
        return;
      }
      let d = ''; let points: Point[] = [];
      if (entity.type === 'LINE') {
        matrix = parent; // LINE coordinates are WCS, not OCS.
        const line = entity as DwgLineEntity;
        points = [line.startPoint,line.endPoint];
        d = `M${line.startPoint.x},${line.startPoint.y} L${line.endPoint.x},${line.endPoint.y}`;
        if (line.startPoint.z || line.endPoint.z) warnings.add('Elevated geometry is projected onto the XY plan.');
      } else if (['CIRCLE','ARC','ELLIPSE'].includes(entity.type)) {
        const circle = entity as DwgCircleEntity;
        let rx = circle.radius, ry = circle.radius, angle = 0, start = 0, sweep = TAU;
        if (entity.type === 'ARC') {
          const arc = entity as DwgArcEntity;
          start = arc.startAngle; sweep = mod(arc.endAngle-start);
        } else if (entity.type === 'ELLIPSE') {
          const ellipse = entity as DwgEllipseEntity;
          matrix = parent; // Ellipse center and major axis are WCS.
          rx = Math.hypot(ellipse.majorAxisEndPoint.x,ellipse.majorAxisEndPoint.y); ry = rx*ellipse.axisRatio;
          angle = Math.atan2(ellipse.majorAxisEndPoint.y,ellipse.majorAxisEndPoint.x);
          start = ellipse.startAngle; sweep = Math.abs(ellipse.endAngle-start)>=TAU-1e-9 ? TAU : mod(ellipse.endAngle-start);
          if (extrusion?.z === -1) { start = -start; sweep = -sweep; }
        }
        ({ d, points } = ellipseArc(circle.center,rx,ry,angle,start,sweep,matrix));
        if (circle.center.z) warnings.add('Elevated geometry is projected onto the XY plan.');
      } else if (['LWPOLYLINE','POLYLINE2D','POLYLINE3D'].includes(entity.type)) {
        const poly = entity as DwgLWPolylineEntity | DwgPolyline2dEntity | DwgPolyline3dEntity;
        const closed = Boolean(poly.flag & (entity.type === 'LWPOLYLINE' ? 512 : 1));
        if (entity.type !== 'LWPOLYLINE' && (poly.flag & (2|4|16|64))) { omit(`${entity.type} (fitted/mesh)`); return; }
        if (entity.type === 'POLYLINE3D') matrix = parent;
        const vertices = poly.vertices;
        if (vertices.length < 2) throw new Error('Empty polyline');
        coordinates += vertices.length;
        if (coordinates > MAX_COORDINATES) throw new Error('Coordinate limit');
        d = `M${vertices[0].x},${vertices[0].y}`; points = [...vertices];
        for (let i=0;i<vertices.length-(closed ? 0 : 1);i++) {
          const a = vertices[i], b = vertices[(i+1)%vertices.length];
          const bulge = 'bulge' in a ? a.bulge : 0;
          if (bulge) { const arc = bulgeArc(a,b,bulge,matrix); d += arc.d.slice(arc.d.indexOf(' A')); points.push(...arc.points); }
          else d += ` L${b.x},${b.y}`;
        }
        if (closed) d += ' Z';
        if ('elevation' in poly && poly.elevation) warnings.add('Elevated geometry is projected onto the XY plan.');
        if (vertices.some(v => ('startWidth' in v && v.startWidth) || ('endWidth' in v && v.endWidth)) || ('constantWidth' in poly && poly.constantWidth)) warnings.add('Polyline widths are shown as centerlines.');
      } else { omit(entity.type); return; }
      const world = points.map(p => transform(p,matrix));
      if (world.length < 2 || !matrix.every(Number.isFinite) || world.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y)) || !/^[MLAZ0-9eE+.,\s-]+$/.test(d)) throw new Error('Invalid geometry');
      for (const p of world) { bounds.minX=Math.min(bounds.minX,p.x); bounds.maxX=Math.max(bounds.maxX,p.x); bounds.minY=Math.min(bounds.minY,p.y); bounds.maxY=Math.max(bounds.maxY,p.y); }
      const layer = layers.get(name) ?? { name, paths: [], visible: !layerEntries.get(name)?.off && !layerEntries.get(name)?.frozen };
      layer.paths.push({ d, matrix }); layers.set(name,layer); rendered++;
    } catch (error) {
      if (visited > MAX_ENTITIES || coordinates > MAX_COORDINATES) throw error;
      omit(`${entity.type} (invalid)`);
    }
  }
  for (const entity of db.entities) visit(entity,IDENTITY);
  if (!rendered || !Object.values(bounds).every(Number.isFinite) || bounds.maxX<=bounds.minX || bounds.maxY<=bounds.minY) throw new Error(`No usable planar area found. Omitted: ${Object.entries(omitted).map(([k,v]) => `${k}: ${v}`).join(', ') || 'empty drawing'}.`);
  return { bounds, layers: [...layers.values()], mmPerUnit: dwgMillimetersPerUnit(db.header.INSUNITS), rendered, omitted, warnings: [...warnings], inserts };
}

export function dwgPreviewDataUrl(preview: DwgPreview, hidden: string[] = []): string {
  const b = preview.bounds, width = b.maxX-b.minX, height = b.maxY-b.minY;
  const paths = preview.layers.filter(layer => !hidden.includes(layer.name)).flatMap(layer => layer.paths)
    .map(({d,matrix}) => `<path d="${d}" transform="matrix(${matrix.join(' ')})" vector-effect="non-scaling-stroke"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${-b.maxY} ${width} ${height}" width="${width}" height="${height}"><g transform="scale(1 -1)" fill="none" stroke="#263238" stroke-width="1">${paths}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
