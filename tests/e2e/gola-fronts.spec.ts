import { expect, test, type Page } from "@playwright/test";
import { GOLDEN_RUN_OBJECT_IDS } from "../../src/domain/livingRoom/goldenRun";
import { openGoldenCabinetRun, selectGoldenCabinet } from "./golden-cabinet-run.helpers";

async function openConstruction(page: Page, id: string) {
  await selectGoldenCabinet(page, id);
  const advanced = page.getByTestId("inspector-cabinet-advanced");
  if (await advanced.getAttribute("open") === null) await advanced.locator("summary").click();
  await expect(page.getByTestId("cabinet-front-system")).toBeVisible();
}

test.describe("Gola handleless fronts (Phase 5)", () => {
  test("a base cabinet gets L and C profiles with sizes clamped to the standard range", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await openConstruction(page, GOLDEN_RUN_OBJECT_IDS.baseA);
    const fronts = page.getByTestId("cabinet-front-system");
    await expect(fronts).toHaveValue("handled");
    await expect(page.getByTestId("cabinet-gola-L")).toHaveCount(0);

    await fronts.selectOption("gola");
    await expect(page.getByTestId("cabinet-gola-L")).toBeVisible();
    await expect(page.getByTestId("cabinet-gola-C")).toBeVisible();
    await expect(page.getByTestId("cabinet-gola-wall")).toHaveCount(0);
    const height = page.getByTestId("cabinet-gola-L-height");
    await expect(height).toHaveValue("60");
    await height.fill("99");
    await height.press("Enter");
    await expect(height).toHaveValue("68");

    await fronts.selectOption("handled");
    await expect(page.getByTestId("cabinet-gola-L")).toHaveCount(0);
  });

  test("a wall cabinet offers only the slim wall-unit profile", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await openConstruction(page, GOLDEN_RUN_OBJECT_IDS.wallA);
    await page.getByTestId("cabinet-front-system").selectOption("gola");
    await expect(page.getByTestId("cabinet-gola-wall")).toBeVisible();
    await expect(page.getByTestId("cabinet-gola-L")).toHaveCount(0);
    await expect(page.getByTestId("cabinet-gola-wall-depth")).toHaveValue("23");
  });

  test("a gola cabinet beside handled ones warns until the run is matched", async ({ page }) => {
    await openGoldenCabinetRun(page);
    await openConstruction(page, GOLDEN_RUN_OBJECT_IDS.baseA);
    await page.getByTestId("cabinet-front-system").selectOption("gola");
    await expect(page.getByTestId("cabinet-gola-run-warning")).toBeVisible();
    await page.getByTestId("cabinet-gola-match-run").click();
    await expect(page.getByTestId("cabinet-gola-run-warning")).toHaveCount(0);

    await openConstruction(page, GOLDEN_RUN_OBJECT_IDS.baseB);
    await expect(page.getByTestId("cabinet-front-system")).toHaveValue("gola");
  });
});
