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

test.describe.serial("Session Lifecycle (4 users)", () => {
  let facilitatorPage: Page;
  let voter1Page: Page;
  let voter2Page: Page;
  let voter3Page: Page;
  const roomName = "Lifecycle Test Room";

  test("setup: register 4 users, create room, all voters join", async ({
    browser,
  }) => {
    // Facilitator creates the room
    const ctx1 = await createUserContext(browser);
    facilitatorPage = await ctx1.newPage();
    await registerUser(facilitatorPage, generateUser());
    const code = await createRoom(facilitatorPage, roomName);

    // 3 voters register and join
    const ctx2 = await createUserContext(browser);
    voter1Page = await ctx2.newPage();
    await registerUser(voter1Page, generateUser());
    await joinRoomByCode(voter1Page, code);

    const ctx3 = await createUserContext(browser);
    voter2Page = await ctx3.newPage();
    await registerUser(voter2Page, generateUser());
    await joinRoomByCode(voter2Page, code);

    const ctx4 = await createUserContext(browser);
    voter3Page = await ctx4.newPage();
    await registerUser(voter3Page, generateUser());
    await joinRoomByCode(voter3Page, code);

    // All 4 participants see each other
    await waitForParticipantCount(facilitatorPage, 4);
    await waitForParticipantCount(voter1Page, 4);
    await waitForParticipantCount(voter2Page, 4);
    await waitForParticipantCount(voter3Page, 4);
  });

  test("add story → visible to all 4 users", async () => {
    await addStory(facilitatorPage, "Lifecycle story");

    await waitForStoryVisible(facilitatorPage, "Lifecycle story");
    await waitForStoryVisible(voter1Page, "Lifecycle story");
    await waitForStoryVisible(voter2Page, "Lifecycle story");
    await waitForStoryVisible(voter3Page, "Lifecycle story");
  });

  test("all 4 users vote, reveal, accept final estimate", async () => {
    // Select story to start voting round
    await facilitatorPage.getByText("Lifecycle story").click();
    await facilitatorPage.getByText("Round 1").waitFor({ timeout: 10_000 });
    await voter1Page.getByText("Round 1").waitFor({ timeout: 10_000 });
    await voter2Page.getByText("Round 1").waitFor({ timeout: 10_000 });
    await voter3Page.getByText("Round 1").waitFor({ timeout: 10_000 });

    // All 4 cast different votes to test average/spread
    await castVote(facilitatorPage, "5");
    await castVote(voter1Page, "8");
    await castVote(voter2Page, "8");
    await castVote(voter3Page, "13");

    // Facilitator reveals
    await facilitatorPage
      .getByRole("button", { name: "Reveal Votes" })
      .click();
    await facilitatorPage.getByText("Average").waitFor({ timeout: 10_000 });

    // Voters also see revealed results
    await voter1Page.getByText("Average").waitFor({ timeout: 10_000 });

    // Set final estimate
    await facilitatorPage.getByPlaceholder("Final estimate").fill("8");
    await facilitatorPage.getByRole("button", { name: "Accept" }).click();

    // Estimate badge visible on facilitator
    await expect(
      facilitatorPage
        .locator("text=Lifecycle story")
        .locator("..")
        .locator("..")
        .getByText("8")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("end session → all 4 users see Session Ended", async () => {
    await endSession(facilitatorPage);

    await expect(voter1Page.getByText("Session Ended")).toBeVisible({
      timeout: 10_000,
    });
    await expect(voter2Page.getByText("Session Ended")).toBeVisible({
      timeout: 10_000,
    });
    await expect(voter3Page.getByText("Session Ended")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("completed session appears on history page with counts", async () => {
    await navigateToHistory(facilitatorPage);

    await expect(facilitatorPage.getByText(roomName)).toBeVisible({
      timeout: 10_000,
    });

    // Shows story count
    await expect(facilitatorPage.getByText("1 stories")).toBeVisible();
  });

  test("history detail page shows analytics for all 4 participants", async () => {
    // Click the room card to navigate to detail
    await facilitatorPage.getByText(roomName).click();
    await facilitatorPage.waitForURL("**/history/**");

    // Stats cards visible
    await expect(facilitatorPage.getByText("Participants")).toBeVisible({
      timeout: 10_000,
    });
    await expect(facilitatorPage.getByText("Stories")).toBeVisible();
    await expect(facilitatorPage.getByText("Estimated")).toBeVisible();
    await expect(facilitatorPage.getByText("Rounds")).toBeVisible();

    // Participant count should show 4
    await expect(
      facilitatorPage.locator("text=Participants").locator("..").getByText("4")
    ).toBeVisible();

    // Story title and final estimate badge
    await expect(facilitatorPage.getByText("Lifecycle story")).toBeVisible();

    // Round details with vote values from all participants
    await expect(facilitatorPage.getByText("Round 1")).toBeVisible();
  });

  test("back button returns to history list", async () => {
    await facilitatorPage
      .getByRole("button")
      .filter({ has: facilitatorPage.locator("svg.lucide-arrow-left") })
      .click();

    await facilitatorPage.waitForURL("**/history");
    await expect(
      facilitatorPage.getByText("Session History")
    ).toBeVisible();
  });
});
