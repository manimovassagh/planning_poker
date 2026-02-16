import { test, expect } from "@playwright/test";
import { generateUser, registerUser, loginUser } from "../helpers";

test.describe("Authentication", () => {
  test("register new user → redirected to dashboard", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("login with valid credentials → redirected to dashboard", async ({ page }) => {
    const user = generateUser();

    // Register first
    await registerUser(page, user);

    // Clear storage to simulate logout
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login");

    // Login
    await loginUser(page, user);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("login with wrong password → shows error", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);

    // Clear storage and try wrong password
    await page.evaluate(() => localStorage.clear());
    await page.goto("/login");

    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("WrongPassword99!");
    await page.getByRole("button", { name: "Sign In" }).click();

    // Should show error and stay on login page
    await expect(page.locator("[class*='destructive']")).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/login/);
  });

  test("register with existing email → shows error", async ({ page }) => {
    const user = generateUser();

    // Register first time
    await registerUser(page, user);

    // Clear storage, try registering again with same email
    await page.evaluate(() => localStorage.clear());
    await page.goto("/register");

    await page.getByLabel("Display Name").fill("Duplicate");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should show error and stay on register page
    await expect(page.locator("[class*='destructive']")).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/register/);
  });

  test("unauthenticated access to /dashboard → redirected to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login since no token
    await expect(page).toHaveURL(/login/);
  });

  test("logout → redirected to login", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Click logout (it's in the nav)
    await page.getByRole("button", { name: /logout|sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });
});
