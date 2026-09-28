import { expect, test } from "@playwright/test";
import { CALM_LIGHT_PAGES, calmLightContextPage } from "./calmLightPages";

// Baselines live next to this spec; refresh after an approved UI change with
//   npx playwright test tests/e2e/calm-light-visual.spec.ts --update-snapshots
// WebGL canvases are masked: GPU/driver output differs between machines.
for (const entry of CALM_LIGHT_PAGES) {
  test(`visual baseline: ${entry.name}`, async ({ browser }) => {
    test.setTimeout(90_000);
    const { context, page } = await calmLightContextPage(browser, entry);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${entry.name}.png`, {
      animations: "disabled",
      caret: "hide",
      mask: [page.locator("canvas")],
      maxDiffPixelRatio: 0.01,
    });
    await context.close();
  });
}
