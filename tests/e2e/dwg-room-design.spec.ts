import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createBlankPlan, drawRectangleRoom, clickInteriorsTool } from './plannerStart';
const drawing=readFileSync(new URL('../fixtures/dwg/example_2018.dwg',import.meta.url));
async function choose(page:Page, buffer=drawing) {
 await clickInteriorsTool(page,'import');
 await page.locator('input[type=file][accept*=".dwg"]').setInputFiles({name:'room.dwg',mimeType:'application/octet-stream',buffer});
}
async function point(page:Page,x:number,z:number){
 return page.getByTestId('lr-plan-svg').evaluate((svg,p)=>{
  const screen=new DOMPoint(p.x,p.z).matrixTransform((svg as SVGSVGElement).getScreenCTM()!); return {x:screen.x,y:screen.y};
 },{x,z});
}
test('DWG import, calibration, tracing, layer persistence and 3D',async({page})=>{
 test.setTimeout(120000);
 await createBlankPlan(page);
 await choose(page);
 const dialog=page.getByTestId('lr-underlay-dwg-dialog');
 await expect(dialog.getByRole('button',{name:'Import tracing background'})).toBeEnabled({timeout:45000});
 await expect(dialog.getByLabel('Millimeters per drawing unit')).toHaveValue('1');
 // Mixed-entity upstream sample spans kilometers; exercise explicit scale correction.
 await dialog.getByLabel('Millimeters per drawing unit').fill('0.001');
 await dialog.getByRole('button',{name:'Import tracing background'}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.getByTestId('lr-plan-underlay-image')).toBeVisible();
 await expect(page.locator('.lr-plan-svg.is-calibrate')).toBeVisible();
 const a=await point(page,-500,0), b=await point(page,500,0);
 await page.mouse.click(a.x,a.y); await page.mouse.click(b.x,b.y);
 await page.getByTestId('calibrate-known-length-input').fill('1000');
 await page.getByTestId('calibrate-known-length-confirm').click();
 await drawRectangleRoom(page,0.32,0.32,0.68,0.68);
 await expect(page.locator('[data-wall-id]')).toHaveCount(4);
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(page.locator('[data-wall-id]')).toHaveCount(0);
 await page.getByRole('button',{name:'Redo',exact:true}).click();
 await expect(page.locator('[data-wall-id]')).toHaveCount(4);
 await clickInteriorsTool(page,'import');
 await expect(page.getByTestId('lr-underlay-calibrated-chip')).toHaveText('Calibrated');
 await page.getByLabel('Underlay pan X').fill('125');
 await page.getByLabel('Underlay rotation').fill('15');
 const before=await page.getByTestId('lr-plan-underlay-image').getAttribute('transform');
 await page.getByText('DWG layers',{exact:true}).click();
 const layer=page.getByTestId('lr-underlay-controls').locator('details').filter({has:page.getByText('DWG layers',{exact:true})}).getByRole('checkbox').first();
 await layer.uncheck();
 const download=page.waitForEvent('download');
 await page.getByTestId('interiors-save-state').click();
 const file=await download;
 const saved=JSON.parse(readFileSync((await file.path())!,'utf8'));
 expect(JSON.stringify(saved)).toContain('hiddenLayers');
 await page.getByRole('button',{name:'3D',exact:true}).click();
 await expect(page.getByTestId('lr-model-viewport')).toBeVisible();
 await page.getByRole('button',{name:'2D plan',exact:true}).click();
 await expect(page.getByTestId('lr-plan-underlay-image')).toHaveAttribute('transform',before!);
 // Reopen the actual exported project through the existing file-open path.
 await page.getByTestId('interiors-project-crumb').evaluate((button: HTMLButtonElement) => button.click());
 const chooser=page.waitForEvent('filechooser');
 await page.getByRole('dialog',{name:'Start a living room project'}).getByRole('button',{name:'Open project',exact:true}).click();
 await (await chooser).setFiles({name:'dwg-room.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
 await expect(page.getByTestId('lr-plan-underlay-image')).toHaveAttribute('transform',before!);
 await clickInteriorsTool(page,'import');
 await page.getByText('DWG layers',{exact:true}).click();
 await expect(page.getByTestId('lr-underlay-controls').locator('details').filter({has:page.getByText('DWG layers',{exact:true})}).getByRole('checkbox').first()).not.toBeChecked();
 await expect(page.locator('[data-wall-id]')).toHaveCount(4);
});
test('malformed DWG and cancellation leave the existing project intact',async({page})=>{
 await createBlankPlan(page);
 await choose(page,Buffer.from('not a dwg'));
 await expect(page.getByTestId('lr-underlay-dwg-dialog').getByRole('alert')).toBeVisible({timeout:45000});
 await page.getByTestId('lr-underlay-dwg-dialog').getByRole('button',{name:'Cancel'}).click();
 await expect(page.getByTestId('lr-plan-underlay-image')).toHaveCount(0);
 await choose(page); await page.getByTestId('lr-underlay-dwg-dialog').getByRole('button',{name:'Cancel'}).click();
 await expect(page.getByTestId('lr-underlay-dwg-dialog')).toHaveCount(0);
 await expect(page.getByTestId('lr-plan-underlay-image')).toHaveCount(0);
});
