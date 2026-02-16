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
} from "../helpers";

test.describe.serial("Story Management", () => {
  let facilitatorPage: Page;
  let voterPage: Page;

  test("setup: register facilitator and voter, create room, voter joins", async ({
    browser,
  }) => {
    const ctx1 = await createUserContext(browser);
    facilitatorPage = await ctx1.newPage();
    const user1 = generateUser();
    await registerUser(facilitatorPage, user1);
    const code = await createRoom(facilitatorPage, "Story Test Room");

    const ctx2 = await createUserContext(browser);
    voterPage = await ctx2.newPage();
    const user2 = generateUser();
    await registerUser(voterPage, user2);
    await joinRoomByCode(voterPage, code);

    await waitForParticipantCount(facilitatorPage, 2);
    await waitForParticipantCount(voterPage, 2);
  });

  test("facilitator adds a story → visible to both users", async () => {
    await addStory(facilitatorPage, "Login page redesign");

    await waitForStoryVisible(facilitatorPage, "Login page redesign");
    await waitForStoryVisible(voterPage, "Login page redesign");
    await expect(facilitatorPage.getByText("Stories (1)")).toBeVisible();
  });

  test("facilitator adds second story → story count updates", async () => {
    await addStory(facilitatorPage, "API optimization");

    await waitForStoryVisible(facilitatorPage, "API optimization");
    await waitForStoryVisible(voterPage, "API optimization");
    await expect(facilitatorPage.getByText("Stories (2)")).toBeVisible();
  });

  test("vote, reveal, and set final estimate → badge appears", async () => {
    // Start voting on first story
    await facilitatorPage.getByText("Login page redesign").click();

    // Wait for card deck to appear
    await facilitatorPage.getByText("Round 1").waitFor({ timeout: 10_000 });
    await voterPage.getByText("Round 1").waitFor({ timeout: 10_000 });

    // Both vote
    await castVote(facilitatorPage, "5");
    await castVote(voterPage, "5");

    // Facilitator reveals
    await facilitatorPage.getByRole("button", { name: "Reveal Votes" }).click();
    await facilitatorPage.getByText("Average").waitFor({ timeout: 10_000 });

    // Set final estimate
    await facilitatorPage.getByPlaceholder("Final estimate").fill("5");
    await facilitatorPage.getByRole("button", { name: "Accept" }).click();

    // Estimate badge should appear in the story list for both users
    await expect(
      facilitatorPage.locator("text=Login page redesign").locator("..").locator("..").getByText("5")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("facilitator edits final estimate via pencil icon", async () => {
    // Click the pencil icon next to the story with estimate
    await facilitatorPage
      .locator("[class*='lucide-pencil'], svg.h-3.w-3")
      .first()
      .click();

    // Input should appear - clear and type new value
    const editInput = facilitatorPage.locator("input.h-6");
    await editInput.fill("8");
    await editInput.press("Enter");

    // Badge should update to 8
    await expect(
      facilitatorPage.getByText("8").first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
