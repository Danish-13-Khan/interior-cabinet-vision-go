import { expect, test, type Page } from "@playwright/test";
import { loadReleaseDemo, openQaRenderStudio, openInteriorsHome } from "./plannerStart";

async function openRenderStudio(page: Page) {
  await openInteriorsHome(page);
  await loadReleaseDemo(page);
  await openQaRenderStudio(page);
}

test("K3 render honesty: Draft, Client Preview, and Still tiers stay distinct", async ({ page }) => {
  test.setTimeout(90_000);
  await openRenderStudio(page);

  const badge = page.locator(".lr-render-commandbar").getByTestId("lr-preset-honesty");
  const legend = page.getByLabel("Presentation tier honesty");

  await expect(legend).toContainText("Working Draft");
  await expect(legend).toContainText("Client Preview Hero");
  await expect(legend).toContainText("Hybrid Still");

  await page.getByRole("button", { name: "Draft Preview" }).click();
  await page.getByRole("button", { name: "Live Preview" }).click();
  await expect(badge).toContainText("Working Draft");
  await expect(badge).toHaveAttribute("data-tier", "draft-preview");

  await page.getByRole("button", { name: "Use recommended settings" }).click();
  await expect(badge).toContainText("Client Delivery");
  await expect(badge).toHaveAttribute("data-tier", "client-preview-hero");

  await page.getByRole("button", { name: "Still review" }).click();
  await expect(badge).toContainText("Hybrid Still");
  await expect(badge).toHaveAttribute("data-tier", "hybrid-still");
});
