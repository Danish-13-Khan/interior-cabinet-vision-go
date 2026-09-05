import { expect, test, type Page } from "@playwright/test";
import { E2E_SESSION_JSON } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";

type ModelViewRuntimeProfile = {
  renderMode: string;
  quality: string;
  textureDetail: string;
  shadowMapSize: number;
  envMapIntensityScale: number;
  projectLightScale: number;
  windowKeyScale: number;
  anisotropy: number;
  proceduralMapWidth: number;
  modelViewPreview: boolean;
};

async function openModelView(page: Page) {
  await page.addInitScript(([key, session]) => {
    window.localStorage.clear();
    window.localStorage.setItem("cabinetStudioSession", session);
    window.localStorage.setItem(key, "dismissed");
  }, [GUIDE_KEY, E2E_SESSION_JSON] as const);
  await page.goto("/app");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
}

async function readModelViewProfile(page: Page, quality?: string) {
  await expect
    .poll(async () => {
      const raw = await page.getByTestId("lr-model-viewport").getAttribute("data-model-view-profile");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ModelViewRuntimeProfile;
      return !quality || parsed.quality === quality ? parsed : null;
    })
    .not.toBeNull();
  const raw = await page.getByTestId("lr-model-viewport").getAttribute("data-model-view-profile");
  expect(raw).toBeTruthy();
  return JSON.parse(raw!) as ModelViewRuntimeProfile;
}

async function sampleWebglCanvas(page: Page) {
  await page.waitForTimeout(1800);
  return page.evaluate(async () => {
    const root = document.querySelector('[data-testid="lr-model-viewport"]');
    const canvas = root?.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { ok: false, reason: "canvas-missing", coverage: 0 };
    }
    const width = Math.min(canvas.width || 0, 128);
    const height = Math.min(canvas.height || 0, 128);
    if (width < 8 || height < 8) {
      return { ok: false, reason: "canvas-too-small", coverage: 0 };
    }
    const probe = document.createElement("canvas");
    probe.width = width;
    probe.height = height;
    const probeCtx = probe.getContext("2d");
    if (!probeCtx) return { ok: false, reason: "probe-context-missing", coverage: 0 };
    probeCtx.drawImage(canvas, 0, 0, width, height);
    const { data } = probeCtx.getImageData(0, 0, width, height);
    let nonblank = 0;
    const pixelCount = width * height;
    for (let i = 0; i < pixelCount; i += 1) {
      const o = i * 4;
      const y = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
      if (data[o + 3] >= 8 && y > 8) nonblank += 1;
    }
    return { ok: nonblank / pixelCount >= 0.001, coverage: nonblank / pixelCount };
  });
}

test("J3 defaults model view to designed preview lighting and materials", async ({ page }) => {
  test.setTimeout(60_000);
  await openModelView(page);

  const honesty = page.getByTestId("lr-preset-honesty");
  await expect(honesty).toContainText("Designed Preview");
  await expect(honesty).toContainText("DRAFT · PREVIEW");
  await expect(honesty).not.toContainText("HERO");

  const quality = page.getByLabel("Viewport quality");
  await expect(quality).toHaveValue("draft");

  const draftProfile = await readModelViewProfile(page, "draft");
  expect(draftProfile.renderMode).toBe("preview");
  expect(draftProfile.textureDetail).toBe("low");
  expect(draftProfile.modelViewPreview).toBe(true);
  expect(draftProfile.proceduralMapWidth).toBe(128);
  expect(draftProfile.anisotropy).toBe(6);

  const draftSample = await sampleWebglCanvas(page);
  expect(draftSample.ok, `model canvas blank: ${JSON.stringify(draftSample)}`).toBe(true);

  await quality.selectOption("standard");
  await expect(honesty).toContainText("Rich Preview");
  await expect(honesty).not.toContainText("HERO");

  const standardProfile = await readModelViewProfile(page, "standard");
  expect(standardProfile.textureDetail).toBe("high");
  expect(standardProfile.shadowMapSize).toBeGreaterThan(draftProfile.shadowMapSize);
  expect(standardProfile.proceduralMapWidth).toBe(256);
  expect(standardProfile.anisotropy).toBe(10);
  expect(standardProfile.proceduralMapWidth).toBeGreaterThan(draftProfile.proceduralMapWidth);
  expect(standardProfile.anisotropy).toBeGreaterThan(draftProfile.anisotropy);

  const richSample = await sampleWebglCanvas(page);
  expect(richSample.ok, `rich preview canvas blank: ${JSON.stringify(richSample)}`).toBe(true);
});
