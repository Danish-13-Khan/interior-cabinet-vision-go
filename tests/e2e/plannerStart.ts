import { expect, type Locator, type Page } from "@playwright/test";

/** Matches `src/marketing/lib/auth.ts` SESSION_KEY — required to enter `/app`. */
export const E2E_SESSION_JSON = JSON.stringify({
  email: "e2e@cabinet.studio",
  theme: "calm",
  at: "2026-01-01T00:00:00.000Z",
});

/**
 * Seed a fake login. Marketing `/` has no Interiors control; the designer is at `/app`.
 * Call before `goto("/app")` (and after any localStorage.clear in the same init script).
 */
export async function seedE2eSession(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem("cabinetStudioSession", session);
  }, E2E_SESSION_JSON);
}

/** Clear storage, seed auth, open the designer, enter Interiors workbench. */
export async function openInteriorsHome(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.clear();
    window.localStorage.setItem("cabinetStudioSession", session);
  }, E2E_SESSION_JSON);
  await page.goto("/app");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
}

async function loadInteriorsFixture(page: Page, key: "openReleaseDemo" | "openGoldenRun" | "openRenderStudio") {
  const projects = page.getByRole("dialog", { name: "Start a living room project" });
  await projects.waitFor();
  await page.evaluate((method) => {
    window.dispatchEvent(new CustomEvent("interiors-qa-fixture", { detail: method }));
  }, key);
  if (key !== "openRenderStudio") {
    await projects.waitFor({ state: "hidden" });
  }
}

export async function loadReleaseDemo(page: Page) {
  await loadInteriorsFixture(page, "openReleaseDemo");
}

export async function loadGoldenCabinetRun(page: Page) {
  await loadInteriorsFixture(page, "openGoldenRun");
}

export async function openQaRenderStudio(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("interiors-qa-fixture", { detail: "openRenderStudio" }));
  });
  await expect(page.getByTestId("lr-render-live")).toBeVisible();
}

/** Empty canvas — designer draws the first room. */
export async function createBlankPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: "New cabinet job", exact: true }).click();
}

/** Rectangular living-room shell with openings (wardrobe starter, empty of furniture). */
export async function createShellPlan(page: Page) {
  await openInteriorsHome(page);
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

export async function pointOnPaper(paper: Locator, x: number, y: number) {
  const box = await paper.boundingBox();
  if (!box) throw new Error("Plan paper is not rendered");
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

export async function drawRectangleRoom(page: Page, x0 = 0.28, y0 = 0.28, x1 = 0.72, y1 = 0.72) {
  await page.locator('[data-build-tool="draw-room"]').click();
  const paper = page.getByRole("application", { name: "Living room plan editor" });
  const start = await pointOnPaper(paper, x0, y0);
  const end = await pointOnPaper(paper, x1, y1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}
