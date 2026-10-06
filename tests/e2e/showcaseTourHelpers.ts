import { expect, type Page } from "@playwright/test";
import { openInteriorsHome } from "./plannerStart";

export const THREE_BHK_ID = "template:apartment:3bhk:v1";

/** GPU-backed chromium on macOS (Metal); elsewhere the default (SwiftShader in CI). */
export const TOUR_LAUNCH = process.platform === "darwin"
  ? { channel: "chromium", launchOptions: { args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] } }
  : {};

export type TourProbe = {
  frames: Array<{ phase: string; dt: number }>;
  rooms: string[];
  saveLabels: string[];
};

/**
 * Before the app loads: record every animation-frame delta tagged with the
 * tour phase, each room the tour shows while touring, and every save-button
 * label (so a stray autosave or dirty flag shows up).
 */
export async function installTourProbe(page: Page) {
  await page.addInitScript(() => {
    const probe = { frames: [] as Array<{ phase: string; dt: number }>, rooms: [] as string[], saveLabels: [] as string[] };
    (window as unknown as { __tourProbe: typeof probe }).__tourProbe = probe;
    let last = performance.now();
    let lastIndex = "";
    const tick = (now: number) => {
      const tour = document.querySelector("[data-testid=showcase-tour]");
      const phase = tour?.getAttribute("data-tour-phase") ?? "none";
      probe.frames.push({ phase, dt: now - last });
      last = now;
      const index = tour?.getAttribute("data-tour-stop-index") ?? "";
      if (phase === "touring" && index !== lastIndex) {
        probe.rooms.push(document.querySelector("[data-testid=showcase-tour-status]")?.textContent?.split(" · ")[0] ?? "");
      }
      lastIndex = phase === "touring" ? index : "";
      const label = document.querySelector("[data-testid=interiors-save-state]");
      // "Saved · 2 minutes ago" ages on its own; keep the state, drop the age.
      const state = (label?.textContent ?? "").replace(/^Saved · .*/, "Saved");
      const text = `${state}${label?.classList.contains("is-dirty") ? " [dirty]" : ""}`;
      if (label && probe.saveLabels.at(-1) !== text) probe.saveLabels.push(text);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export async function readTourProbe(page: Page): Promise<TourProbe> {
  return page.evaluate(() => {
    const probe = (window as unknown as { __tourProbe: TourProbe }).__tourProbe;
    return { frames: probe.frames, rooms: probe.rooms, saveLabels: probe.saveLabels };
  });
}

export async function resetTourProbe(page: Page) {
  await page.evaluate(() => {
    const probe = (window as unknown as { __tourProbe: TourProbe }).__tourProbe;
    probe.frames.length = 0;
    probe.rooms.length = 0;
    probe.saveLabels.splice(0, probe.saveLabels.length - 1);
  });
}

/** Undo/redo stack depths published by useEditorHistory. */
export async function historyDepths(page: Page): Promise<string> {
  return page.evaluate(() => `${document.documentElement.dataset.undoDepth}/${document.documentElement.dataset.redoDepth}`);
}

/** Let the post-creation autosave finish so later label changes can only come from the tour. */
export async function waitForSaved(page: Page) {
  await expect(page.getByTestId("interiors-save-state")).toHaveText(/^Saved/, { timeout: 15_000 });
}

/** The save button never left its pre-tour state (no "Saving…", no dirty flip). */
export function saveStateUnchanged(labels: readonly string[]): boolean {
  return labels.length >= 1 && labels.every((label) => label === labels[0]) && labels[0]!.startsWith("Saved");
}

export async function webglRenderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return gl && ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "unknown";
  });
}

/** Project home → 3 BHK template → 3D view with the Tour button ready. */
export async function openThreeBhkIn3d(page: Page) {
  await openInteriorsHome(page, { localStorage: { "cabinet-designer:3d-guide:j1": "dismissed" } });
  await page.getByTestId(`apartment-template-${THREE_BHK_ID}`).click();
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await expect(page.getByTestId("lr-model-viewport")).toBeVisible();
  await expect(page.getByTestId("showcase-tour-toggle")).toBeVisible();
}

export function tour(page: Page) {
  return page.getByTestId("showcase-tour");
}

export function undoButton(page: Page) {
  return page.getByTestId("interiors-workspace-header").getByRole("button", { name: "Undo" });
}

/** Start the tour and wait until the warm-up pre-roll has handed over to the first glide. */
export async function startTour(page: Page) {
  await page.getByTestId("showcase-tour-toggle").click();
  await expect(tour(page)).toHaveAttribute("data-tour-phase", "touring", { timeout: 60_000 });
}

export async function expectTourStopped(page: Page, reason: string) {
  await expect(tour(page)).toHaveAttribute("data-tour-active", "0");
  await expect(tour(page)).toHaveAttribute("data-tour-stop-reason", reason);
}
