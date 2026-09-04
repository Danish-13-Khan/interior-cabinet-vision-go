import { expect, test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { openInteriorsHome } from "./plannerStart";

test("Phase 6: reopen pack:sofa-1 alias in 3D loads Kenney loungeSofa.glb", async ({
  page,
}, testInfo) => {
  test.setTimeout(process.env.CI ? 180_000 : 90_000);

  const forbidden: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("fbx_with_texture")) forbidden.push(request.url());
  });

  await openInteriorsHome(page);
  await page.getByTestId("catalog-template-template:core:empty-room:v1").click();
  await expect(page.getByRole("dialog", { name: "Start a living room project" })).toBeHidden();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("interiors-save-state").click();
  const download = await downloadPromise;
  const fixturePath = testInfo.outputPath("phase-6-pack-sofa.json");
  await download.saveAs(fixturePath);

  const file = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    project: {
      activeRoomId: string;
      objects: Record<string, unknown>[];
      materials: { id: string }[];
    };
  };
  const roomId = file.project.activeRoomId;
  const materialIds = new Set(file.project.materials.map((material) => material.id));
  expect(materialIds.has("lr-material-natural-oak")).toBe(true);
  expect(materialIds.has("lr-material-walnut")).toBe(true);
  file.project.objects.push({
    id: "legacy-pack-sofa",
    roomId,
    kind: "furniture",
    category: "sofa",
    catalogItemId: "imported:pack:sofa-1",
    name: "Imported Sofa",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 2200, heightMm: 850, depthMm: 920 },
    materialSlots: {
      carcass: "lr-material-natural-oak",
      fronts: "lr-material-walnut",
    },
    parameters: {},
    extensions: { placement: "floor", assetImport: { id: "pack:sofa-1" } },
  });
  writeFileSync(fixturePath, JSON.stringify(file, null, 2));

  await page.getByTestId("interiors-project-crumb").evaluate((button: HTMLButtonElement) => {
    button.click();
  });
  const home = page.getByRole("dialog", { name: "Start a living room project" });
  await expect(home).toBeVisible();
  const chooserPromise = page.waitForEvent("filechooser");
  await home.getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooserPromise).setFiles(fixturePath);
  await expect(home).toBeHidden({ timeout: 15_000 });

  await expect(
    page.locator('.lr-plan-svg [data-catalog-item-id="imported:pack:sofa-1"]'),
  ).toHaveCount(1);

  const glbRequest = page.waitForRequest(
    (request) =>
      request.url().includes("loungeSofa.glb") && request.resourceType() !== "document",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await glbRequest;

  expect(forbidden).toEqual([]);
});
