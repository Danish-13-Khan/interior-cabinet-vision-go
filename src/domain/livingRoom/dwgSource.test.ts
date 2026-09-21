import { describe, expect, it } from 'vitest';
import type { DwgDatabase } from '@mlightcad/libredwg-web';
import type { InteriorProject } from '../interiorProject';
import { buildDwgPreview, dwgPreviewDataUrl } from './dwgGeometry';
import { readDwgSource, toggleDwgLayer } from './dwgSource';
import { setLivingRoomPlanUnderlay, getLivingRoomPlanUnderlay } from './planUnderlay';
import { underlayPlanBounds } from './planUnderlayBounds';
const preview=buildDwgPreview({header:{INSUNITS:4},entities:[{type:'LINE',layer:'Walls',startPoint:{x:0,y:0},endPoint:{x:4000,y:3000}}]} as DwgDatabase);
const underlay={ sourceType:'dwg' as const, fileName:'room.dwg',dataUrl:dwgPreviewDataUrl(preview),widthMm:4000,heightMm:3000,opacity:0.5,xMm:100,zMm:200,rotationDeg:90,calibrated:true,dwg:{preview,hiddenLayers:[]} };
describe('saved DWG background',()=>{
 it('omits the generated SVG from saved JSON and rebuilds it on open',()=>{
  const project=setLivingRoomPlanUnderlay({extensions:{}} as InteriorProject,underlay);
  const raw=JSON.parse(JSON.stringify(project)).extensions.planUnderlay;
  expect(raw.dataUrl).toBe('');
  expect(JSON.stringify(raw)).not.toContain('<svg');
  expect(getLivingRoomPlanUnderlay(project)?.dataUrl).toBe(underlay.dataUrl);
 });
 it('toggles layers after JSON reopening without changing scale or placement',()=>{
  const project=setLivingRoomPlanUnderlay({extensions:{}} as InteriorProject,underlay);
  const reopened=getLivingRoomPlanUnderlay(JSON.parse(JSON.stringify(project)))!;
  const hidden=toggleDwgLayer(reopened,'Walls');
  expect(hidden).toMatchObject({widthMm:4000,heightMm:3000,xMm:100,zMm:200,rotationDeg:90,calibrated:true});
  expect(decodeURIComponent(hidden.dataUrl)).not.toContain('<path');
  expect(toggleDwgLayer(hidden,'Walls').dataUrl).toBe(underlay.dataUrl);
 });
 it('rejects SVG injection and malformed matrices in saved source',()=>{
  for(const change of ['M0 0"/><script>bad</script>', 'M0 0']){
   const bad=JSON.parse(JSON.stringify(underlay.dwg)); bad.preview.layers[0].paths[0]={d:change,matrix:[1,0,0,1,0,'bad']};
   expect(readDwgSource(bad)).toBeUndefined();
  }
 });
 it('fits rotated positioned background and excludes hidden background',()=>{
  const b=underlayPlanBounds(underlay)!;
  expect(b.minX).toBeCloseTo(-1400); expect(b.minZ).toBeCloseTo(-1800); expect(b.maxX).toBeCloseTo(1600); expect(b.maxZ).toBeCloseTo(2200);
  expect(underlayPlanBounds({...underlay,hidden:true})).toBeNull();
 });
});
