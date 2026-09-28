import { expect, test, type Page } from "@playwright/test";

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const width of [360, 375, 768, 1024, 1440]) {
  test(`landing has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with the room");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test("auth pages have no horizontal scroll on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/login", "/register"]) {
    await page.goto(path);
    await expect(page.locator(".cs-marketing .auth-card")).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  }
});

test("sticky header stays visible and the phone menu sheet navigates", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const header = page.locator(".site-header");
  await page.evaluate(() => window.scrollTo(0, 1600));
  await expect(header).toBeInViewport();
  await page.getByRole("button", { name: "Open menu" }).click();
  const sheet = page.getByRole("dialog", { name: "Menu" });
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await sheet.getByRole("link", { name: "Pricing" }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Plans that grow with the shop" })).toBeInViewport();
});

test("pricing never shows placeholder amounts", async ({ page }) => {
  await page.goto("/#pricing");
  const pricing = page.locator("#pricing");
  await expect(pricing.locator(".plan-price")).toHaveCount(3);
  await expect(pricing).not.toContainText(/Paid \/ mo|Custom/);
});

test("template cards open Register with that template preselected", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-template-id="template:core:l-kitchen:v1"]').click();
  await expect(page).toHaveURL(/\/register\?template=template%3Acore%3Al-kitchen%3Av1$/);
  await expect(page.getByLabel("Starting template")).toHaveValue("template:core:l-kitchen:v1");
});

test("reduced motion shows the finished still with a play button", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const showroom = page.getByRole("region", { name: "Interactive cabinet showroom" });
  await expect(showroom.locator(".cs-showroom-poster img")).toBeVisible();
  await expect(showroom.locator("canvas")).toHaveCount(0);
  await showroom.getByRole("button", { name: "Play the build" }).click();
  await expect(showroom.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await context.close();
});
