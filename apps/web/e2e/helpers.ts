import { type Page, type BrowserContext, type Browser } from "@playwright/test";

let userCounter = 0;

export function generateUser() {
  userCounter++;
  const ts = Date.now();
  return {
    displayName: `User${userCounter}`,
    email: `user${userCounter}_${ts}@test.com`,
    password: "TestPass123!",
  };
}

export async function registerUser(
  page: Page,
  user: { displayName: string; email: string; password: string }
) {
  await page.goto("/register");
  await page.getByLabel("Display Name").fill(user.displayName);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("**/dashboard");
}

export async function loginUser(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard");
}

export async function createRoom(page: Page, roomName: string): Promise<string> {
  await page.getByRole("button", { name: "New Room" }).click();
  await page.getByPlaceholder("Room name").fill(roomName);
  await page.getByRole("button", { name: "Create Room" }).click();
  await page.waitForURL("**/room/**");

  // Extract the room code from the page
  const codeElement = page.locator("code, [class*='tracking-widest'], [class*='monospace']").first();
  const code = await codeElement.textContent();
  if (!code) throw new Error("Could not find room code");
  return code.trim();
}

export async function joinRoomByCode(page: Page, code: string) {
  await page.goto("/dashboard");
  await page.getByPlaceholder("Enter room code").fill(code);
  // Submit by pressing Enter since the join button is an icon
  await page.getByPlaceholder("Enter room code").press("Enter");
  await page.waitForURL("**/room/**");
}

export async function createUserContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext();
}

export async function waitForParticipantCount(page: Page, count: number) {
  await page.getByText(`Participants (${count})`).waitFor({ timeout: 10_000 });
}

export async function addStory(page: Page, title: string) {
  await page.getByPlaceholder("Add story...").fill(title);
  await page.getByPlaceholder("Add story...").press("Enter");
}

export async function selectStory(page: Page, title: string) {
  await page.getByText(title, { exact: false }).click();
}

export async function castVote(page: Page, value: string) {
  // Cards are buttons with the vote value
  await page.getByRole("button", { name: value, exact: true }).click();
}

export async function waitForStoryVisible(page: Page, title: string) {
  await page.getByText(title).waitFor({ timeout: 10_000 });
}
