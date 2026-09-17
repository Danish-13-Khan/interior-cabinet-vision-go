import { expect, test } from "@playwright/test";

test("public showroom leads through local registration into the app", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with the room");
  const showroom = page.getByRole("region", { name: "Interactive cabinet showroom" });
  await expect(showroom).toBeVisible();
  await expect(showroom.getByRole("button", { name: "Replay assembly" })).toBeEnabled({ timeout: 20_000 });
  await expect(showroom.locator("canvas")).toBeVisible();
  await showroom.getByRole("button", { name: "Open drawer", exact: true }).click();
  await expect(showroom.getByRole("button", { name: "Close drawer", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Register", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator(".cs-marketing .auth-page")).toBeVisible();
  await expect(page.locator(".planner-auth")).toHaveCount(0);
  await page.getByLabel("First name", { exact: true }).fill("Local");
  await page.getByLabel("Work email", { exact: true }).fill("local-entry@example.test");
  await page.getByLabel("Password", { exact: true }).fill("local-demo-pass");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId("interiors-projects-home")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cabinetStudioSession") ?? "null")?.email)).toBe("local-entry@example.test");

  await page.reload();
  await expect(page.getByTestId("interiors-projects-home")).toBeVisible({ timeout: 30_000 });
  await page.goto("/");
  await expect(showroom).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test("app requires a session and auth can return to the public homepage", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Cabinet Planner", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("region", { name: "Interactive cabinet showroom" })).toBeVisible();
});

test("login uses the original website design and opens the local app", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator(".cs-marketing .auth-brand")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.locator(".planner-auth")).toHaveCount(0);
  await page.getByLabel("Email", { exact: true }).fill("login-entry@example.test");
  await page.getByLabel("Password", { exact: true }).fill("local-demo-pass");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByTestId("interiors-projects-home")).toBeVisible({ timeout: 30_000 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to planner" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/restored-login.png", fullPage: true, animations: "disabled" });
});
