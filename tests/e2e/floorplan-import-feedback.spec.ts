import { expect, test } from "@playwright/test";
import {
  applyGoldenKitchenImport,
  expectImportedWallsInModel,
  goldenKitchenDxfUpload,
  placeBaseCabinetOnImportedWall,
} from "./floorplan-import-golden.helpers";
import { clickInteriorsTool, seedE2eSession } from "./plannerStart";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

test("import walls shows pending extraction and a visible service error", async ({ page }) => {
  await seedE2eSession(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/extract*", async (route) => {
    await pending;
    await route.abort("failed");
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "New cabinet job", exact: true }).click();
  await page.getByTestId("lr-import-walls-file").setInputFiles(goldenKitchenDxfUpload());
  const status = page.getByTestId("lr-floorplan-extract-status");
  try {
    await expect(status).toBeVisible();
    await expect(status).toContainText("Reading drawing into a review draft");
  } finally { release(); }
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toContainText("Could not reach the floor-plan service");
  await expect(status.getByRole("button", { name: "Choose drawing again" })).toBeVisible();
  await expect(page.getByTestId("lr-floorplan-extract-review")).toHaveCount(0);
});

test("png underlay does not call extract", async ({ page }) => {
  await seedE2eSession(page);
  let extractHits = 0;
  await page.route("**/extract*", async (route) => {
    extractHits += 1;
    await route.abort("failed");
  });
  await page.goto("/app");
  await page.getByRole("button", { name: "New cabinet job", exact: true }).click();
  await clickInteriorsTool(page, "import");
  await expect(page.getByTestId("lr-underlay-empty").or(page.getByTestId("lr-underlay-controls"))).toBeVisible();
  await page.getByTestId("lr-underlay-file").setInputFiles({
    name: "site-plan.png", mimeType: "image/png", buffer: TINY_PNG,
  });
  await expect(page.getByTestId("lr-plan-underlay-image")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("lr-floorplan-extract-status")).toHaveCount(0);
  await expect(page.getByTestId("lr-floorplan-extract-review")).toHaveCount(0);
  expect(extractHits).toBe(0);
});

test("golden kitchen DXF: review, calibrate, Apply, 3D, cabinet snap", async ({ page }) => {
  test.setTimeout(90_000);
  await seedE2eSession(page);
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "dismissed");
  }, GUIDE_KEY);
  await page.goto("/app");
  await page.getByRole("button", { name: "New cabinet job", exact: true }).click();
  await applyGoldenKitchenImport(page);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expectImportedWallsInModel(page);
  await page.getByRole("button", { name: "2D plan", exact: true }).click();
  await expect(page.getByTestId("lr-plan-svg")).toBeVisible();
  await placeBaseCabinetOnImportedWall(page);
});
