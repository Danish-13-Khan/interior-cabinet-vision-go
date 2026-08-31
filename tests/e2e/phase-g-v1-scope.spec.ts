import { expect, test } from "@playwright/test";

async function openStarterRoom(page: import("@playwright/test").Page) {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/");
  await page.getByRole("button", { name: "Interiors", exact: true }).click();
  await page.getByRole("button", { name: /Wardrobe wall/ }).click();
}

test("Phase G keeps millwork Design and hides Advanced Studio parity chrome", async ({ page }) => {
  await openStarterRoom(page);

  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.getByRole("button", { name: /Millwork/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Millwork/ })).toHaveAttribute(
    "title",
    "Millwork design",
  );
  await expect(page.getByText("Millwork Design", { exact: true })).toBeVisible();
  await expect(page.getByText(/Parametric cabinet surface/)).toBeVisible();

  await expect(page.getByRole("button", { name: /^Advanced$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Advanced Studio/i })).toHaveCount(0);
  await expect(page.getByText("Styleboard", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Autostyler", { exact: false })).toHaveCount(0);
});

test("Phase G keeps Build → Design → Render agenda without Advanced panel", async ({ page }) => {
  await openStarterRoom(page);
  await expect(page.getByRole("button", { name: "2 · Build in 2D", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "3 · Design + dimensions", exact: true }).click();
  await expect(page.getByRole("button", { name: /Millwork/ })).toBeVisible();
  await page.getByRole("button", { name: "4 · Review + export", exact: true }).click();
  await expect(page.locator(".lr-plan-titlebar strong")).toHaveText("Render studio");
  await expect(page.getByRole("button", { name: "Advanced", exact: true })).toHaveCount(0);
});
