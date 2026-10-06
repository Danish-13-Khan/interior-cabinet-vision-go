import { readExistingCardMedia, writeCardMediaManifest } from "./manifest.mjs";
import { saveClip } from "./captureClipFrames.mjs";
import {
  setCaptureLook,
  waitForCaptureReady,
} from "./grabFrame.mjs";
import { APARTMENT_TARGETS, CATALOG_TARGETS } from "./targets.mjs";

const RENDER_MOOD = "evening";
const SESSION = JSON.stringify({ email: "cards@media.cabinet.studio", theme: "calm", at: "2026-01-01T00:00:00.000Z" });

async function openApartment(page, baseUrl, testId, mood = RENDER_MOOD) {
  await page.goto(`${baseUrl}/app?capture=1`);
  await page.getByTestId(`apartment-template-${testId}`).click({ timeout: 90_000 });
  await page.getByTestId("interiors-present").click();
  await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
  await waitForCaptureReady(page);
  await setCaptureLook(page, mood);
}

async function openCatalog(page, baseUrl, templateId) {
  await page.goto(`${baseUrl}/app?capture=1`);
  await page.getByTestId(`catalog-template-${templateId}`).click({ timeout: 90_000 });
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await page.getByTestId("lr-model-viewport").waitFor({ timeout: 60_000 });
  await page.getByTestId("interiors-present").click();
  await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
  await waitForCaptureReady(page);
  await setCaptureLook(page, RENDER_MOOD);
}

async function newCaptureContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  await context.addInitScript((session) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("card-capture-mode", "1");
    window.localStorage.setItem("cabinetStudioSession", session);
    window.localStorage.setItem("cabinet-designer:3d-guide:j1", "dismissed");
  }, SESSION);
  await context.addInitScript(() => {
    Object.defineProperty(window, "devicePixelRatio", { get: () => 2, configurable: true });
  });
  return context;
}

export async function runClipPass({
  browser,
  baseUrl,
  root,
  pick,
  catalogOnly,
  apartmentsOnly,
  failures,
  timeline,
}) {
  const manifest = {};
  let prior = await readExistingCardMedia(root);

  if (!catalogOnly) {
    const apartments = pick.length
      ? APARTMENT_TARGETS.filter((item) => pick.includes(item.slug))
      : APARTMENT_TARGETS;
    for (const apt of apartments) {
      const context = await newCaptureContext(browser);
      const page = await context.newPage();
      console.log(`Apartment clip ${apt.slug}`);
      await openApartment(page, baseUrl, apt.testId, apt.clipMood ?? RENDER_MOOD);
      const clip = await saveClip({
        root,
        relWebm: `catalog/templates/apartment-${apt.slug}-clip-v2.webm`,
        relMp4: `catalog/templates/apartment-${apt.slug}-clip-v2.mp4`,
        page,
        kind: "overview-to-hero",
        timeline,
        failures,
        exposureOverrides: { plan: apt.planExposure, hero: apt.clipHeroExposure },
      });
      if (clip && prior[apt.id]) {
        manifest[apt.id] = { ...prior[apt.id], clip };
        prior = { ...prior, [apt.id]: manifest[apt.id] };
      }
      await context.close();
    }
  }

  if (!apartmentsOnly) {
    const catalogs = pick.length
      ? CATALOG_TARGETS.filter((item) => pick.includes(item.slug))
      : CATALOG_TARGETS;
    for (const room of catalogs) {
      const context = await newCaptureContext(browser);
      const page = await context.newPage();
      console.log(`Catalog clip ${room.slug}`);
      await openCatalog(page, baseUrl, room.id);
      const clip = await saveClip({
        root,
        relWebm: `catalog/templates/${room.slug}-clip-v2.webm`,
        relMp4: `catalog/templates/${room.slug}-clip-v2.mp4`,
        page,
        kind: "room-arc",
        timeline,
        failures,
      });
      if (clip && prior[room.id]?.poster?.w800) {
        manifest[room.id] = { ...prior[room.id], clip };
        prior = { ...prior, [room.id]: manifest[room.id] };
      }
      await context.close();
    }
  }

  if (Object.keys(manifest).length) {
    const { jsonPath, tsPath } = await writeCardMediaManifest(root, manifest);
    console.log(`Wrote clip manifest ${jsonPath} and ${tsPath}`);
  }
}
