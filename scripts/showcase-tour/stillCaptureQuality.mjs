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

/** @param {import("playwright").Page} page */
export async function readStillSurfacesFromPage(page) {
  return page.evaluate(async () => {
    if (typeof window.__cardCapture?.readSurfaces !== "function") {
      throw new Error("Still surface probe is not mounted");
    }
    return window.__cardCapture.readSurfaces();
  });
}
