import type { Browser, Page } from "@playwright/test";
import { E2E_SESSION_JSON, loadGoldenCabinetRun, openInteriorsHome, selectInteriorsWorkflowArea } from "./plannerStart";

const GUIDE_KEY = "cabinet-designer:3d-guide:j1";
const ENGINEERING_SESSION_KEY = "cabinet-designer-engineering-session";

export type CalmLightPage = {
  name: string;
  viewport?: { width: number; height: number };
  open: (page: Page) => Promise<void>;
};

async function goldenStep(page: Page, area: "room" | "cabinets" | "materials" | "review" | "present") {
  await openInteriorsHome(page, { localStorage: { [GUIDE_KEY]: "dismissed" } });
  await loadGoldenCabinetRun(page);
  if (area !== "room") await selectInteriorsWorkflowArea(page, area);
  await page.waitForTimeout(800);
}

/** Roadmap Phase 8 page set: website, projects home, each workflow step, Engineering Review. */
export const CALM_LIGHT_PAGES: CalmLightPage[] = [
  { name: "website-desktop", open: async (page) => { await page.goto("/"); } },
  { name: "website-phone", viewport: { width: 375, height: 812 }, open: async (page) => { await page.goto("/"); } },
  { name: "projects-home", open: (page) => openInteriorsHome(page) },
  { name: "step-room", open: (page) => goldenStep(page, "room") },
  { name: "step-cabinets", open: (page) => goldenStep(page, "cabinets") },
  { name: "step-materials", open: (page) => goldenStep(page, "materials") },
  { name: "step-review", open: (page) => goldenStep(page, "review") },
  { name: "step-present", open: (page) => goldenStep(page, "present") },
  {
    name: "engineering-review",
    open: async (page) => {
      await page.addInitScript(([session, key]) => {
        window.localStorage.setItem("cabinetStudioSession", session);
        window.sessionStorage.setItem(key, "active");
      }, [E2E_SESSION_JSON, ENGINEERING_SESSION_KEY] as const);
      await page.goto("/app");
      await page.getByRole("region", { name: "Engineering Review" }).waitFor();
    },
  },
];

/** Reduced motion so the website shows its finished poster and no reveal animation is mid-fade. */
export async function calmLightContextPage(browser: Browser, entry: CalmLightPage) {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: entry.viewport ?? { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await entry.open(page);
  return { context, page };
}
