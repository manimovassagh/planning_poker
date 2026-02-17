import { test, expect, type Page } from "@playwright/test";
import {
  generateUser,
  registerUser,
  createRoom,
  createUserContext,
  joinRoomByCode,
  waitForParticipantCount,
  addStory,
  waitForStoryVisible,
  castVote,
  endSession,
  navigateToHistory,
} from "../helpers";

/**
 * Production smoke test with 3 concurrent users.
 * Covers the full happy path and specifically tests:
 * - Vote results visible to ALL users after reveal (bug: votes not showing)
 * - History page loads correctly with data (bug: white screen)
 */
test.describe.serial("Production Smoke (3 users)", () => {
  let facilitatorPage: Page;
  let voter1Page: Page;
  let voter2Page: Page;
  let roomCode: string;
  const roomName = `Smoke ${Date.now()}`;

  test("register 3 users and create room", async ({ browser }) => {
    const ctx1 = await createUserContext(browser);
    facilitatorPage = await ctx1.newPage();
    await registerUser(facilitatorPage, generateUser());
    roomCode = await createRoom(facilitatorPage, roomName);

    const ctx2 = await createUserContext(browser);
    voter1Page = await ctx2.newPage();
    await registerUser(voter1Page, generateUser());
    await joinRoomByCode(voter1Page, roomCode);

    const ctx3 = await createUserContext(browser);
    voter2Page = await ctx3.newPage();
    await registerUser(voter2Page, generateUser());
    await joinRoomByCode(voter2Page, roomCode);

    await waitForParticipantCount(facilitatorPage, 3);
    await waitForParticipantCount(voter1Page, 3);
    await waitForParticipantCount(voter2Page, 3);
  });

  test("add story visible to all", async () => {
    await addStory(facilitatorPage, "Smoke Test Story");

    await waitForStoryVisible(facilitatorPage, "Smoke Test Story");
    await waitForStoryVisible(voter1Page, "Smoke Test Story");
    await waitForStoryVisible(voter2Page, "Smoke Test Story");
  });

  test("all 3 vote, reveal, results visible to everyone", async () => {
    // Select story to start voting
    await facilitatorPage.getByText("Smoke Test Story").click();
    await facilitatorPage.getByText("Round 1").waitFor({ timeout: 15_000 });
    await voter1Page.getByText("Round 1").waitFor({ timeout: 15_000 });
    await voter2Page.getByText("Round 1").waitFor({ timeout: 15_000 });

    // All 3 vote
    await castVote(facilitatorPage, "5");
    await castVote(voter1Page, "8");
    await castVote(voter2Page, "13");

    // Facilitator reveals
    await facilitatorPage
      .getByRole("button", { name: "Reveal Votes" })
      .click();

    // BUG CHECK: All 3 users must see the results panel after reveal
    await expect(
      facilitatorPage.getByText("Average")
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      voter1Page.getByText("Average")
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      voter2Page.getByText("Average")
    ).toBeVisible({ timeout: 15_000 });

    // Verify actual vote values are shown to all users
    for (const page of [facilitatorPage, voter1Page, voter2Page]) {
      await expect(page.getByText("5")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("8")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("13")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("facilitator accepts estimate, badge appears", async () => {
    await facilitatorPage.getByPlaceholder("Final estimate").fill("8");
    await facilitatorPage.getByRole("button", { name: "Accept" }).click();

    // Final estimate badge visible
    await expect(
      facilitatorPage.getByText("Final: 8")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("end session → all see Session Ended", async () => {
    await endSession(facilitatorPage);

    await expect(voter1Page.getByText("Session Ended")).toBeVisible({
      timeout: 15_000,
    });
    await expect(voter2Page.getByText("Session Ended")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("history page loads with completed session", async () => {
    await navigateToHistory(facilitatorPage);

    // BUG CHECK: History page must show data, not blank white screen
    await expect(
      facilitatorPage.getByText(roomName)
    ).toBeVisible({ timeout: 15_000 });

    // Story count shows
    await expect(
      facilitatorPage.getByText("1 stories")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("history detail page shows votes and analytics", async () => {
    await facilitatorPage.getByText(roomName).click();
    await facilitatorPage.waitForURL("**/history/**");

    // Stats cards
    await expect(
      facilitatorPage.getByText("Participants", { exact: true })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      facilitatorPage.getByRole("heading", { name: "Stories" })
    ).toBeVisible();

    // Story and round details
    await expect(
      facilitatorPage.getByText("Smoke Test Story")
    ).toBeVisible();
    await expect(
      facilitatorPage.getByText("Round 1")
    ).toBeVisible();
  });
});
