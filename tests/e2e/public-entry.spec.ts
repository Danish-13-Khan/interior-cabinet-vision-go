import { expect, test } from "@playwright/test";

test("public showroom stays public and registration shows coming soon", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Start with the room");
  const showroom = page.getByRole("region", { name: "Interactive cabinet showroom" });
  await expect(showroom).toBeVisible();
  await expect(showroom.getByRole("button", { name: "Replay assembly" })).toBeEnabled({ timeout: 20_000 });
  await expect(showroom.locator("canvas")).toBeVisible();
  await expect(showroom.getByRole("button", { name: "Oak", exact: true })).toHaveAttribute("aria-pressed", "true");
  await showroom.getByRole("button", { name: "Walnut", exact: true }).click();
  await expect(showroom.getByRole("button", { name: "Walnut", exact: true })).toHaveAttribute("aria-pressed", "true");
  await showroom.getByRole("button", { name: "Replay assembly" }).click();

  await page.getByRole("link", { name: "Start free", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator(".cs-marketing .auth-page")).toBeVisible();
  await page.getByLabel("First name", { exact: true }).fill("Local");
  await page.getByLabel("Work email", { exact: true }).fill("local-entry@example.test");
  await page.getByLabel("Password", { exact: true }).fill("local-demo-pass");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Coming soon" })).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cabinetStudioSession"))).toBeNull();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Local");
  expect(errors).toEqual([]);
});

test("app requires a session and auth can return to the public homepage", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Cabinet Studio", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("region", { name: "Interactive cabinet showroom" })).toBeVisible();
});

test("local login opens a session and lands in the app", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email", { exact: true }).fill("login-entry@example.test");
  await page.getByLabel("Password", { exact: true }).fill("local-demo-pass");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole("dialog", { name: "Login failed" })).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("cabinetStudioSession") ?? "null")?.email))
    .toBe("login-entry@example.test");
});

test("invalid login shows a popup and does not open a local session", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator(".cs-marketing .auth-brand")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill("login-entry@example.test");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Login failed" })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cabinetStudioSession"))).toBeNull();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Login failed" })).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("login-entry@example.test");
});
