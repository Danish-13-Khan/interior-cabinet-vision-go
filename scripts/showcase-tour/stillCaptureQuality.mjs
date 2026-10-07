/**
 * Phase 0 still preset. Both capture scripts select this explicitly.
 * Model View stays in preview mode; the id is what the proof records.
 */
export const STILL_CAPTURE_QUALITY = "client-preview";
export const STILL_CAPTURE_DPR = 2;

/** @param {import("playwright").Page} page */
export async function applyStillCaptureLook(page, mood) {
  await page.waitForFunction(
    () => typeof window.__cardCapture?.setLook === "function",
    null,
    { timeout: 90_000 },
  );
  await page.evaluate(async ({ quality, mood: nextMood }) => {
    await window.__cardCapture.setLook({ quality, mood: nextMood });
  }, { quality: STILL_CAPTURE_QUALITY, mood });
}

const CANVAS = "[data-testid=lr-model-canvas-host] canvas";

/**
 * Stop 1's index flips while frameSettled is still 1 from the overview hold.
 * Arm before the tour starts: remember stop 0, then accept stop 1 only after
 * that pose is left and the hero settles. A late poll still accepts a hero
 * that already differs from stop 0.
 * @param {import("playwright").Page} page
 */
export async function armTourHeroWatch(page) {
  await page.evaluate((canvasSelector) => {
    const poseOf = () => {
      const canvas = document.querySelector(canvasSelector);
      return [canvas?.dataset.cameraX, canvas?.dataset.cameraY, canvas?.dataset.cameraZ].join(",");
    };
    const watch = { stop0: null, moved: false, armed: false };
    window.__stillPoseWatch = watch;
    const tick = () => {
      const canvas = document.querySelector(canvasSelector);
      const tour = document.querySelector("[data-testid=showcase-tour]");
      const phase = tour?.getAttribute("data-tour-phase");
      const index = tour?.getAttribute("data-tour-stop-index");
      const pose = poseOf();
      // Warm-up visits every index while phase is "preparing". The card is stop 1 of the tour itself.
      if (phase !== "touring") return;
      if (index === "0") watch.stop0 = pose;
      if (index === "1" && !watch.armed) {
        watch.armed = true;
        watch.moved = canvas?.dataset.frameSettled !== "1" || (watch.stop0 != null && pose !== watch.stop0);
        watch.pose = pose;
      }
      if (!watch.armed) return;
      if (canvas?.dataset.frameSettled !== "1" || pose !== watch.pose) watch.moved = true;
    };
    tick();
    window.__stillPoseTimer = window.setInterval(tick, 40);
  }, CANVAS);
}

/** @param {import("playwright").Page} page */
export async function waitForTourHero(page) {
  await page.waitForFunction((canvasSelector) => {
    const canvas = document.querySelector(canvasSelector);
    return window.__stillPoseWatch?.moved === true
      && canvas?.dataset.frameSettled === "1"
      && canvas?.dataset.materialMaps !== "0";
  }, CANVAS, { timeout: 60_000 });
  await page.evaluate(() => window.clearInterval(window.__stillPoseTimer));
}

/** Pose is settled and KTX2 maps are no longer in flight. An absent flag counts as ready. */
export async function waitForSettledFrame(page, timeout = 60_000) {
  await page.waitForFunction((canvasSelector) => {
    const canvas = document.querySelector(canvasSelector);
    return canvas?.dataset.frameSettled === "1" && canvas?.dataset.materialMaps !== "0";
  }, CANVAS, { timeout });
}

/** @param {import("playwright").Page} page */
export async function readStillSurfacesFromPage(page) {
  return page.evaluate(async () => {
    if (typeof window.__cardCapture?.readSurfaces !== "function") {
      throw new Error("Still surface probe is not mounted");
    }
    return window.__cardCapture.readSurfaces();
  });
}
