import { expect, test } from '@playwright/test';
import { seedE2eSession } from './plannerStart';

test('plan import shows pending extraction and a visible service error', async ({ page }) => {
  await seedE2eSession(page);
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/extract*', async route => {
    await pending;
    await route.abort('failed');
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'New cabinet job', exact: true }).click();
  await page.locator('input[type="file"][accept*=".dxf"]').setInputFiles({
    name: 'plan.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=', 'base64'),
  });
  const status = page.getByTestId('lr-floorplan-extract-status');
  try {
    await expect(status).toBeVisible();
    await expect(status).toContainText('Generating 3D from your plan');
  } finally { release(); }
  await expect(status).toHaveAttribute('role', 'alert');
  await expect(status).toContainText('Could not reach the floor-plan service');
  await expect(status.getByRole('button', { name: 'Choose plan again' })).toBeVisible();
  await expect(page.getByTestId('lr-floorplan-extract-review')).toHaveCount(0);
});

test('successful extraction opens geometry review before Apply', async ({ page }) => {
  await seedE2eSession(page);
  const rect = (id: string, x: number, y: number, X: number, Y: number) => ({ id, outer: [[x,y],[X,y],[X,Y],[x,Y]] });
  await page.route('**/schema/v1', route => route.fulfill({ json: { required: ['schema_version','units','polygons'], properties: { schema_version: { const: '1.0' } } } }));
  await page.route('**/extract*', route => route.fulfill({ json: {
    schema_version: '1.0', units: 'meters', pixel_scale: .01,
    polygons: { rooms: [rect('r',.1,.1,3.9,3.9)], walls: [rect('top',0,-.1,4,.1),rect('right',3.9,0,4.1,4),rect('bottom',0,3.9,4,4.1),rect('left',-.1,0,.1,4)], doors: [], windows: [] },
  } }));
  await page.goto('/app');
  await page.getByRole('button', { name: 'New cabinet job', exact: true }).click();
  await page.locator('input[type="file"][accept*=".dxf"]').setInputFiles({ name: 'room.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"/>') });
  const review = page.getByTestId('lr-floorplan-extract-review');
  await expect(review).toBeVisible();
  await expect(page.getByTestId('lr-floorplan-extract-status')).toHaveCount(0);
  await expect(page.getByTestId('lr-floorplan-extract-apply')).toBeDisabled();
  await page.getByTestId('lr-floorplan-scale-confirmed').check();
  const ack = page.getByTestId('lr-floorplan-replace-ack');
  if (await ack.isVisible()) await ack.check();
  await expect(page.getByTestId('lr-floorplan-extract-apply')).toBeEnabled();
  await page.getByTestId('lr-floorplan-extract-apply').click();
  await expect(review).toHaveCount(0);
  await expect(page.getByTestId('lr-floorplan-reopen-import')).toBeVisible();
});
