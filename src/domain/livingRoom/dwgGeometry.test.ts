import { describe, expect, it } from 'vitest';
import type { DwgDatabase } from '@mlightcad/libredwg-web';
import type { InteriorProject } from '../interiorProject';
import { buildDwgPreview, dwgPreviewDataUrl } from './dwgGeometry';
import { getLivingRoomPlanUnderlay, setLivingRoomPlanUnderlay } from './planUnderlay';

function drawing(entities: unknown[]): DwgDatabase {
  return { header: { INSUNITS: 4 }, entities } as DwgDatabase;
}
const line = { type: 'LINE', layer: 'Walls', startPoint: { x: 10, y: 20, z: 0 }, endPoint: { x: 610, y: 320, z: 0 } };
describe('DWG preview', () => {
  it('crops distant leftover geometry so the room fills the preview', () => {
    const preview = buildDwgPreview(drawing([
      line,
      { type: 'LINE', layer: 'Walls', startPoint: { x: 10, y: 20, z: 0 }, endPoint: { x: 10, y: 320, z: 0 } },
      { type: 'LINE', layer: 'Walls', startPoint: { x: 610, y: 20, z: 0 }, endPoint: { x: 610, y: 320, z: 0 } },
      { type: 'LINE', layer: '0', startPoint: { x: 1e7, y: 1e7, z: 0 }, endPoint: { x: 1e7 + 10, y: 1e7, z: 0 } },
    ]));
    expect(preview.bounds).toEqual({ minX: 10, minY: 20, maxX: 610, maxY: 320 });
    expect(preview.warnings.join(' ')).toMatch(/Distant leftover/);
  });
  it('uses geometry bounds and inverts CAD Y without changing dimensions', () => {
    const preview = buildDwgPreview(drawing([line]));
    expect(preview.bounds).toEqual({ minX: 10, minY: 20, maxX: 610, maxY: 320 });
    expect(preview.mmPerUnit).toBe(1);
    expect(decodeURIComponent(dwgPreviewDataUrl(preview))).toContain('viewBox="10 -320 600 300"');
    expect(preview.layers[0].paths[0].d).toBe('M10,20 L610,320');
  });
  it('reports blocks, unsupported curves, invalid and parser-omitted entities', () => {
    const preview = buildDwgPreview(drawing([line, { type: 'INSERT' }, { type: 'LWPOLYLINE', vertices: [{ bulge: 1 }] }, { ...line, endPoint: { x: NaN, y: 0 } }]), 2);
    expect(preview.rendered).toBe(1);
    expect(preview.omitted).toEqual({ 'Missing block: undefined': 1, 'LWPOLYLINE (invalid)': 1, 'LINE (invalid)': 1, 'Parser unsupported entities': 2 });
  });
  it('keeps stable bounds when hiding layers and never renders a layer name as markup', () => {
    const preview = buildDwgPreview(drawing([line, { ...line, layer: '<script>' }]));
    const svg = decodeURIComponent(dwgPreviewDataUrl(preview, ['Walls']));
    expect(svg.match(/<path/g)).toHaveLength(1);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('viewBox="10 -320 600 300"');
  });
  it('handles closed polylines and circle extents', () => {
    const preview = buildDwgPreview(drawing([{ type: 'LWPOLYLINE', layer: '0', flag: 512, vertices: [{ x: 0, y: 0 }, { x: 5, y: 5 }] }, { type: 'CIRCLE', center: { x: 0, y: 0 }, radius: 10 }]));
    expect(preview.bounds).toEqual({ minX: -10, minY: -10, maxX: 10, maxY: 10 });
    expect(preview.layers[0].paths[0].d).toContain(' Z');
  });
  it('draws SOLID quads so PDF walls fill the preview', () => {
    const preview = buildDwgPreview(drawing([{
      type: 'SOLID', layer: 'Walls',
      corner1: { x: 0, y: 0 }, corner2: { x: 10, y: 0 },
      corner3: { x: 0, y: 4 }, corner4: { x: 10, y: 4 },
    }]));
    expect(preview.rendered).toBe(1);
    expect(preview.omitted).toEqual({});
    expect(decodeURIComponent(dwgPreviewDataUrl(preview))).toContain('fill="#263238"');
  });
  it('rejects drawings with no supported area', () => {
    expect(() => buildDwgPreview(drawing([{ type: 'INSERT' }]))).toThrow(/Missing block/);
  });
  it('preserves exact DWG dimensions, transform and SVG after JSON save/reopen', () => {
    const underlay = { sourceType: 'dwg' as const, fileName: 'detail.dwg', dataUrl: dwgPreviewDataUrl(buildDwgPreview(drawing([line]))), widthMm: 40, heightMm: 20, opacity: 0.42, xMm: 123, zMm: -15, rotationDeg: 90, calibrated: true };
    const project = setLivingRoomPlanUnderlay({ extensions: {} } as InteriorProject, underlay);
    expect(getLivingRoomPlanUnderlay(JSON.parse(JSON.stringify(project)))).toMatchObject(underlay);
  });
});

describe('DWG blocks and curves', () => {
  it('preserves exact quarter-arc extents and SVG arc commands', () => {
    const preview = buildDwgPreview(drawing([{ type: 'ARC', center: { x: 0,y: 0 }, radius: 1000,startAngle: 0,endAngle: Math.PI/2 }]));
    expect(preview.bounds.minX).toBeCloseTo(0); expect(preview.bounds.minY).toBeCloseTo(0);
    expect(preview.bounds.maxX).toBe(1000); expect(preview.bounds.maxY).toBe(1000);
    expect(preview.layers[0].paths[0].d).toContain(' A1000,1000');
  });
  it('handles both bulge signs and the native closed flag', () => {
    for (const sign of [-1,1]) {
      const preview = buildDwgPreview(drawing([{ type: 'LWPOLYLINE', flag: 512, extrusionDirection: {x:0,y:0,z:0}, vertices: [{ x:0,y:0,bulge:sign },{ x:10,y:0,bulge:0 }] }]));
      expect(preview.bounds.maxX).toBeCloseTo(10);
      expect(preview.bounds.minX).toBeCloseTo(0);
      expect(sign > 0 ? preview.bounds.minY : preview.bounds.maxY).toBeCloseTo(sign > 0 ? -5 : 5);
      expect(preview.layers[0].paths[0].d).toContain(' Z');
    }
  });
  it('expands nested blocks using base point, scale, rotation and inherited layers', () => {
    const db = drawing([{ type:'INSERT',name:'outer',layer:'Walls',insertionPoint:{x:100,y:200},xScale:2,yScale:3,rotation:Math.PI/2 }]);
    db.tables = { BLOCK_RECORD: { entries: [
      { name:'outer',flags:0,basePoint:{x:10,y:20},entities:[{ type:'INSERT',name:'inner',layer:'0',insertionPoint:{x:10,y:20},xScale:1,yScale:1,rotation:0 }] },
      { name:'inner',flags:0,basePoint:{x:0,y:0},entities:[{type:'LINE',layer:'0',startPoint:{x:0,y:0},endPoint:{x:5,y:10}}] },
    ] } } as DwgDatabase['tables'];
    const preview = buildDwgPreview(db);
    expect(preview.inserts).toEqual([{ name: 'outer', layer: 'Walls', x: 100, y: 200, rotation: Math.PI / 2 }]);
    expect(preview.layers[0].name).toBe('Walls');
    expect(preview.bounds.minX).toBeCloseTo(70); expect(preview.bounds.maxX).toBeCloseTo(100);
    expect(preview.bounds.minY).toBeCloseTo(200); expect(preview.bounds.maxY).toBeCloseTo(210);
  });
  it('bounds a nonuniformly scaled rotated circle exactly', () => {
    const db = drawing([{type:'INSERT',name:'circle',insertionPoint:{x:0,y:0},xScale:2,yScale:1,rotation:Math.PI/4}]);
    db.tables = { BLOCK_RECORD:{entries:[{name:'circle',flags:0,basePoint:{x:0,y:0},entities:[{type:'CIRCLE',center:{x:0,y:0},radius:10}]}]} } as DwgDatabase['tables'];
    const p=buildDwgPreview(db); expect(p.bounds.maxX).toBeCloseTo(Math.sqrt(250)); expect(p.bounds.maxY).toBeCloseTo(Math.sqrt(250));
  });
  it('reports recursion and xrefs without looping or fetching files', () => {
    const db = drawing([line,{type:'INSERT',name:'self',insertionPoint:{x:0,y:0}},{type:'INSERT',name:'xref'}]);
    db.tables={BLOCK_RECORD:{entries:[{name:'self',flags:0,basePoint:{x:0,y:0},entities:[{type:'INSERT',name:'self',insertionPoint:{x:0,y:0}}]},{name:'xref',flags:4,entities:[]}]}} as DwgDatabase['tables'];
    expect(buildDwgPreview(db).omitted).toEqual({'Recursive/deep block: self':1,'External reference: xref':1});
  });
});
