import { test, expect } from "@playwright/test";
import {
  generateUser,
  registerUser,
  createRoom,
  createUserContext,
  joinRoomByCode,
  waitForParticipantCount,
} from "../helpers";

test.describe("Room Management", () => {
  test("create room from dashboard → navigates to room page with code", async ({
    page,
  }) => {
    const user = generateUser();
    await registerUser(page, user);

    const code = await createRoom(page, "Sprint 42");

    expect(page.url()).toContain("/room/");
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    await expect(page.getByText("Sprint 42")).toBeVisible();
  });

  test("created room appears on dashboard", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);

    await createRoom(page, "My Planning Room");

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await expect(page.getByText("My Planning Room")).toBeVisible();
    await expect(page.getByText("active")).toBeVisible();
  });

  test("join room by valid code → both users see each other", async ({
    browser,
  }) => {
    // Facilitator creates room
    const ctx1 = await createUserContext(browser);
    const facilitator = ctx1.pages()[0] || (await ctx1.newPage());
    const user1 = generateUser();
    await registerUser(facilitator, user1);
    const code = await createRoom(facilitator, "Join Test Room");

    // Voter joins by code
    const ctx2 = await createUserContext(browser);
    const voter = await ctx2.newPage();
    const user2 = generateUser();
    await registerUser(voter, user2);
    await joinRoomByCode(voter, code);

    // Both see 2 participants
    await waitForParticipantCount(facilitator, 2);
    await waitForParticipantCount(voter, 2);

    await ctx1.close();
    await ctx2.close();
  });

  test("join room with invalid code → shows error", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);

    await page.getByPlaceholder("Enter room code").fill("ZZZZZZ");
    await page.getByPlaceholder("Enter room code").press("Enter");

    await expect(
      page.getByText("Room not found or invalid code")
    ).toBeVisible();
    expect(page.url()).toContain("/dashboard");
  });

  test("dashboard shows multiple rooms", async ({ page }) => {
    const user = generateUser();
    await registerUser(page, user);

    await createRoom(page, "Sprint 1");
    await page.goto("/dashboard");
    await createRoom(page, "Sprint 2");
    await page.goto("/dashboard");

    await expect(page.getByText("Sprint 1")).toBeVisible();
    await expect(page.getByText("Sprint 2")).toBeVisible();
  });
});
