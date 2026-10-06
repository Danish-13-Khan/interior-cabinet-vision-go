import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { exposureProblems, formatExposure, readExposure } from "../showcase-tour/still-exposure.mjs";
import { collectSurfaceProblems, loadSurfaceBands, surfaceLabel } from "../showcase-tour/still-surface-bands.mjs";
import { encodePosterVariants, OUT_W1600 } from "./encodeVariants.mjs";
import { captureStillPng, setCaptureLook, waitForCaptureReady } from "./grabFrame.mjs";
import { apartmentEntry, posterEntry, readExistingCardMedia, writeCardMediaManifest } from "./manifest.mjs";
import { patchCatalogTemplateThumbnails } from "./patchCatalogThumbnails.mjs";
import { APARTMENT_TARGETS, CATALOG_TARGETS } from "./targets.mjs";

const LIMITS = { w800: 90, w1600: 220 };
const RENDER_MOOD = "evening";
const SESSION = JSON.stringify({ email: "cards@media.cabinet.studio", theme: "calm", at: "2026-01-01T00:00:00.000Z" });

function exposureMoodForCapturePath(path) {
  if (path === "overview") return "plan-evening";
  if (path === "hero") return "evening-apartment-hero";
  return "evening";
}

async function newContext(browser) {
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

export async function runStillsPass({
  browser,
  baseUrl,
  root,
  pick,
  catalogOnly,
  apartmentsOnly,
  failures,
  dumpSkipped,
  recordBands = false,
}) {
  const surfaceBands = recordBands ? null : await loadSurfaceBands(root);
  const manifest = {};

  async function saveVariants(rel800, rel1600, pngPromise, exposureMood = "evening", exposureOverrides = {}, page, gateSurfaces = true) {
    const problems = [];
    let png;
    try {
      png = await pngPromise;
    } catch (error) {
      problems.push(`${rel800}: ${error instanceof Error ? error.message : String(error)}`);
      failures.push(...problems);
      console.error(`  SKIP ${rel800}: ${problems.join("; ")}`);
      return null;
    }
    let encoded;
    try {
      encoded = await encodePosterVariants(png);
    } catch (error) {
      problems.push(`${rel800}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (encoded) {
      const exposure = readExposure(encoded.exposure, {
        subjectOnly: exposureMood !== "evening-apartment-hero",
        width: OUT_W1600,
      });
      console.log(`  ${rel800} — ${formatExposure(exposure)}`);
      if (encoded.w800.length / 1024 > LIMITS.w800) {
        problems.push(`${rel800}: ${Math.round(encoded.w800.length / 1024)} KB > ${LIMITS.w800}`);
      }
      if (encoded.w1600.length / 1024 > LIMITS.w1600) {
        problems.push(`${rel1600}: ${Math.round(encoded.w1600.length / 1024)} KB > ${LIMITS.w1600}`);
      }
      problems.push(...exposureProblems(exposure, exposureMood, exposureOverrides));
      if (page && gateSurfaces) {
        problems.push(...await collectSurfaceProblems(page, surfaceLabel(rel800), surfaceBands, recordBands));
      }
    }
    if (problems.length) {
      failures.push(...problems);
      console.error(`  SKIP ${rel800}: ${problems.join("; ")}`);
      if (dumpSkipped && png) {
        const target = join(dumpSkipped, rel800.split("/").at(-1).replace(/\.webp$/, ".png"));
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, png);
        console.error(`  kept ${target}`);
      }
      return null;
    }
    const p800 = join(root, "public", rel800);
    const p1600 = join(root, "public", rel1600);
    await mkdir(dirname(p800), { recursive: true });
    await writeFile(p800, encoded.w800);
    await writeFile(p1600, encoded.w1600);
    console.log(`  wrote ${rel800} (${Math.round(encoded.w800.length / 1024)} KB), `
      + `${rel1600} (${Math.round(encoded.w1600.length / 1024)} KB)`);
    return { w800: rel800, w1600: rel1600 };
  }

  async function openApartment(page, testId) {
    await page.goto(`${baseUrl}/app?capture=1`);
    await page.getByTestId(`apartment-template-${testId}`).click({ timeout: 90_000 });
    await page.getByTestId("interiors-present").click();
    await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
    await waitForCaptureReady(page);
    await setCaptureLook(page, RENDER_MOOD);
  }

  async function openCatalog(page, templateId) {
    await page.goto(`${baseUrl}/app?capture=1`);
    await page.getByTestId(`catalog-template-${templateId}`).click({ timeout: 90_000 });
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await page.getByTestId("lr-model-viewport").waitFor({ timeout: 60_000 });
    await page.getByTestId("interiors-present").click();
    await page.locator(".lr-model-viewport.is-client-presentation").waitFor({ timeout: 60_000 });
    await waitForCaptureReady(page);
    await setCaptureLook(page, RENDER_MOOD);
  }

  if (!catalogOnly) {
    const apartments = pick.length
      ? APARTMENT_TARGETS.filter((item) => pick.includes(item.slug))
      : APARTMENT_TARGETS;
    let priorCardMedia = await readExistingCardMedia(root);
    for (const apt of apartments) {
      const context = await newContext(browser);
      const page = await context.newPage();
      console.log(`Apartment ${apt.slug}`);
      await openApartment(page, apt.testId);
      const hero = await saveVariants(
        `catalog/templates/apartment-${apt.slug}-v2.webp`,
        `catalog/templates/apartment-${apt.slug}-v2-1600.webp`,
        captureStillPng(page, "hero", 1),
        exposureMoodForCapturePath("hero"),
        {},
        page,
      );
      const plan = await saveVariants(
        `catalog/templates/apartment-${apt.slug}-plan-v2.webp`,
        `catalog/templates/apartment-${apt.slug}-plan-v2-1600.webp`,
        (async () => {
          if (apt.planMood && apt.planMood !== RENDER_MOOD) await setCaptureLook(page, apt.planMood);
          return captureStillPng(page, "overview", 0);
        })(),
        exposureMoodForCapturePath("overview"),
        apt.planExposure,
        page,
      );
      if (hero || plan) {
        const prior = priorCardMedia[apt.id];
        const poster = hero ? { w800: hero.w800, w1600: hero.w1600 } : prior?.poster;
        const planPaths = plan ? { w800: plan.w800, w1600: plan.w1600 } : prior?.plan;
        if (poster && planPaths) {
          manifest[apt.id] = apartmentEntry(poster.w800, poster.w1600, planPaths.w800, planPaths.w1600);
          priorCardMedia = { ...priorCardMedia, [apt.id]: manifest[apt.id] };
        }
      }
      await context.close();
    }
  }

  if (!apartmentsOnly) {
    const catalogs = pick.length
      ? CATALOG_TARGETS.filter((item) => pick.includes(item.slug))
      : CATALOG_TARGETS;
    for (const room of catalogs) {
      const context = await newContext(browser);
      const page = await context.newPage();
      console.log(`Catalog ${room.slug}`);
      await openCatalog(page, room.id);
      const poster = await saveVariants(
        `catalog/templates/${room.slug}-v2.webp`,
        `catalog/templates/${room.slug}-v2-1600.webp`,
        captureStillPng(page, "room-arc", 0.5),
        exposureMoodForCapturePath("room-arc"),
        {},
        page,
        false,
      );
      if (poster) manifest[room.id] = posterEntry(poster.w800, poster.w1600);
      await context.close();
    }
  }

  if (Object.keys(manifest).length) {
    const { jsonPath, tsPath } = await writeCardMediaManifest(root, manifest);
    await patchCatalogTemplateThumbnails();
    console.log(`Wrote ${jsonPath} and ${tsPath}`);
  }
}
