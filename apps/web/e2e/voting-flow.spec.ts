import { test, expect, type Browser, type Page } from "@playwright/test";
import {
  generateUser,
  registerUser,
  joinRoomByCode,
  addStory,
  waitForParticipantCount,
  waitForStoryVisible,
} from "./helpers";

/*
 * End-to-end voting flow with 4 users.
 *
 * This suite runs serially – each test depends on the state
 * created by the previous one.  All four users share the
 * same Chromium browser but each has an isolated BrowserContext
 * (separate localStorage / cookies / socket connections).
 */

let browser: Browser;
let facilitatorPage: Page;
let voter2Page: Page;
let voter3Page: Page;
let voter4Page: Page;

const facilitator = generateUser();
const user2 = generateUser();
const user3 = generateUser();
const user4 = generateUser();

let roomCode: string;

test.describe.serial("Multi-user voting flow", () => {
  // ──── Test 1: Register all four users ────────────────────
  test("four users can register", async ({ browser: b }) => {
    browser = b;

    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const ctx3 = await browser.newContext();
    const ctx4 = await browser.newContext();

    facilitatorPage = await ctx1.newPage();
    voter2Page = await ctx2.newPage();
    voter3Page = await ctx3.newPage();
    voter4Page = await ctx4.newPage();

    // Register all users in parallel
    await Promise.all([
      registerUser(facilitatorPage, facilitator),
      registerUser(voter2Page, user2),
      registerUser(voter3Page, user3),
      registerUser(voter4Page, user4),
    ]);

    // All should land on the dashboard
    await expect(facilitatorPage).toHaveURL(/dashboard/);
    await expect(voter2Page).toHaveURL(/dashboard/);
    await expect(voter3Page).toHaveURL(/dashboard/);
    await expect(voter4Page).toHaveURL(/dashboard/);
  });

  // ──── Test 2: Facilitator creates a room ─────────────────
  test("facilitator creates a room and gets a 6-char code", async () => {
    // Click "New Room" to show the create form
    await facilitatorPage.getByRole("button", { name: "New Room" }).click();
    await facilitatorPage
      .getByPlaceholder("Room name")
      .fill("Sprint 42 Planning");
    await facilitatorPage
      .getByRole("button", { name: "Create Room" })
      .click();

    // Should navigate to the room page
    await facilitatorPage.waitForURL("**/room/**");

    // Extract the room code from the tracking-widest span
    const codeEl = facilitatorPage.locator(".tracking-widest").first();
    roomCode = (await codeEl.textContent())!.trim();
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  // ──── Test 3: Other users join via code ──────────────────
  test("three users join via room code, 4 participants visible", async () => {
    await Promise.all([
      joinRoomByCode(voter2Page, roomCode),
      joinRoomByCode(voter3Page, roomCode),
      joinRoomByCode(voter4Page, roomCode),
    ]);

    // Each page should show 4 participants
    await waitForParticipantCount(facilitatorPage, 4);
    await waitForParticipantCount(voter2Page, 4);
    await waitForParticipantCount(voter3Page, 4);
    await waitForParticipantCount(voter4Page, 4);
  });

  // ──── Test 4: Facilitator adds two stories ───────────────
  test("facilitator adds two stories", async () => {
    await addStory(facilitatorPage, "User login page");
    await waitForStoryVisible(facilitatorPage, "User login page");

    await addStory(facilitatorPage, "Dashboard redesign");
    await waitForStoryVisible(facilitatorPage, "Dashboard redesign");

    // Should show "Stories (2)"
    await expect(
      facilitatorPage.getByText("Stories (2)")
    ).toBeVisible();
  });

  // ──── Test 5: ALL users see both stories (bug fix check) ─
  test("all users see stories via socket broadcast", async () => {
    await waitForStoryVisible(voter2Page, "User login page");
    await waitForStoryVisible(voter2Page, "Dashboard redesign");

    await waitForStoryVisible(voter3Page, "User login page");
    await waitForStoryVisible(voter3Page, "Dashboard redesign");

    await waitForStoryVisible(voter4Page, "User login page");
    await waitForStoryVisible(voter4Page, "Dashboard redesign");
  });

  // ──── Test 6: Facilitator starts voting on first story ───
  test("facilitator starts voting, cards appear for all", async () => {
    // Click the first story to start voting
    await facilitatorPage.getByText("User login page").click();

    // All users should see the voting UI (card deck appears)
    for (const page of [facilitatorPage, voter2Page, voter3Page, voter4Page]) {
      await expect(
        page.getByText("Round 1")
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  // ──── Test 7: All 4 users vote ───────────────────────────
  test("all four users submit votes (5, 8, 5, 3)", async () => {
    // Each user clicks a card value (fibonacci scale)
    await facilitatorPage.getByRole("button", { name: "5", exact: true }).click();
    await voter2Page.getByRole("button", { name: "8", exact: true }).click();
    await voter3Page.getByRole("button", { name: "5", exact: true }).click();
    await voter4Page.getByRole("button", { name: "3", exact: true }).click();

    // Vote status should show all voted
    await expect(
      facilitatorPage.getByText("4 of 4 voted")
    ).toBeVisible({ timeout: 10_000 });
  });

  // ──── Test 8: Facilitator reveals votes ──────────────────
  test("facilitator reveals votes, results appear for all", async () => {
    await facilitatorPage
      .getByRole("button", { name: "Reveal Votes" })
      .click();

    // All users should see the results panel
    for (const page of [facilitatorPage, voter2Page, voter3Page, voter4Page]) {
      await expect(
        page.getByText("Results")
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  // ──── Test 9: Verify stats are correct ───────────────────
  test("stats show correct average, median and consensus", async () => {
    // Votes: 5, 8, 5, 3 → avg = 5.25, median = 5
    // Average is rounded for display
    // Check average (5.25 or 5.3 depending on rounding)
    await expect(
      facilitatorPage.getByText("Average").locator("..")
    ).toContainText(/5\.25|5\.3/);

    // Check median
    await expect(
      facilitatorPage.getByText("Median").locator("..")
    ).toContainText("5");

    // Consensus should be "low" or "moderate" since votes are spread
    await expect(
      facilitatorPage.getByText(/low|moderate/)
    ).toBeVisible();
  });

  // ──── Test 10: Re-vote → consensus → accept ─────────────
  test("re-vote, all vote 5, strong consensus, accept final estimate", async () => {
    // Facilitator clicks re-vote
    await facilitatorPage
      .getByRole("button", { name: "Re-vote" })
      .click();

    // Wait for voting UI to reappear for all
    for (const page of [facilitatorPage, voter2Page, voter3Page, voter4Page]) {
      await expect(
        page.getByText("Round 2")
      ).toBeVisible({ timeout: 10_000 });
    }

    // Everyone votes 5 this time
    await facilitatorPage.getByRole("button", { name: "5", exact: true }).click();
    await voter2Page.getByRole("button", { name: "5", exact: true }).click();
    await voter3Page.getByRole("button", { name: "5", exact: true }).click();
    await voter4Page.getByRole("button", { name: "5", exact: true }).click();

    // Wait for all votes
    await expect(
      facilitatorPage.getByText("4 of 4 voted")
    ).toBeVisible({ timeout: 10_000 });

    // Reveal
    await facilitatorPage
      .getByRole("button", { name: "Reveal Votes" })
      .click();

    await expect(
      facilitatorPage.getByText("Results")
    ).toBeVisible({ timeout: 10_000 });

    // Should be "strong" consensus
    await expect(facilitatorPage.getByText("strong")).toBeVisible();

    // Accept with final estimate
    await facilitatorPage.getByPlaceholder("Final estimate").fill("5");
    await facilitatorPage
      .getByRole("button", { name: "Accept" })
      .click();

    // Story should show the final estimate badge
    await expect(
      facilitatorPage.locator("text=User login page").locator("..").getByText("5")
    ).toBeVisible({ timeout: 10_000 });
  });
});
