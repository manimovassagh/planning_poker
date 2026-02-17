import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRoomStore } from "./roomStore";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

describe("roomStore", () => {
  beforeEach(() => {
    useRoomStore.getState().reset();
  });

  it("addParticipant deduplicates by userId", () => {
    const p = {
      id: "p1",
      roomId: "r1",
      userId: "u1",
      role: "voter" as const,
      joinedAt: "",
      user: { id: "u1", displayName: "A", avatarUrl: null },
    };

    useRoomStore.getState().addParticipant(p as any);
    useRoomStore.getState().addParticipant(p as any);

    expect(useRoomStore.getState().participants).toHaveLength(1);
  });

  it("removeParticipant filters by userId", () => {
    useRoomStore.setState({
      participants: [
        { userId: "u1", user: { displayName: "A" } },
        { userId: "u2", user: { displayName: "B" } },
      ] as any,
    });

    useRoomStore.getState().removeParticipant("u1");

    expect(useRoomStore.getState().participants).toHaveLength(1);
    expect(useRoomStore.getState().participants[0].userId).toBe("u2");
  });

  it("updateStory also updates currentStory when matching", () => {
    const story = { id: "s1", roomId: "r1", title: "Original", status: "pending" } as any;
    useRoomStore.setState({ stories: [story], currentStory: story });

    useRoomStore.getState().updateStory({ ...story, title: "Updated" });

    expect(useRoomStore.getState().stories[0].title).toBe("Updated");
    expect(useRoomStore.getState().currentStory?.title).toBe("Updated");
  });

  it("updateStory does not touch currentStory when IDs differ", () => {
    const s1 = { id: "s1", title: "One" } as any;
    const s2 = { id: "s2", title: "Two" } as any;
    useRoomStore.setState({ stories: [s1, s2], currentStory: s1 });

    useRoomStore.getState().updateStory({ ...s2, title: "Two Updated" });

    expect(useRoomStore.getState().currentStory?.title).toBe("One");
  });

  it("removeStory clears currentStory when it matches", () => {
    const story = { id: "s1", title: "A" } as any;
    useRoomStore.setState({ stories: [story], currentStory: story });

    useRoomStore.getState().removeStory("s1");

    expect(useRoomStore.getState().stories).toHaveLength(0);
    expect(useRoomStore.getState().currentStory).toBeNull();
  });

  it("removeStory keeps currentStory when IDs differ", () => {
    const s1 = { id: "s1", title: "A" } as any;
    const s2 = { id: "s2", title: "B" } as any;
    useRoomStore.setState({ stories: [s1, s2], currentStory: s1 });

    useRoomStore.getState().removeStory("s2");

    expect(useRoomStore.getState().stories).toHaveLength(1);
    expect(useRoomStore.getState().currentStory?.id).toBe("s1");
  });

  it("resetVoting clears all vote state", () => {
    useRoomStore.setState({
      votes: [{ id: "v1" }] as any,
      voteStats: { average: 5 } as any,
      votedUserIds: new Set(["u1"]),
      myVote: "5",
    });

    useRoomStore.getState().resetVoting();

    expect(useRoomStore.getState().votes).toHaveLength(0);
    expect(useRoomStore.getState().voteStats).toBeNull();
    expect(useRoomStore.getState().votedUserIds.size).toBe(0);
    expect(useRoomStore.getState().myVote).toBeNull();
  });

  it("setVotedUser adds userId to the Set", () => {
    useRoomStore.getState().setVotedUser("u1");
    useRoomStore.getState().setVotedUser("u2");
    useRoomStore.getState().setVotedUser("u1"); // duplicate

    expect(useRoomStore.getState().votedUserIds.size).toBe(2);
    expect(useRoomStore.getState().votedUserIds.has("u1")).toBe(true);
    expect(useRoomStore.getState().votedUserIds.has("u2")).toBe(true);
  });

  it("setVoteResults sets both votes and stats atomically", () => {
    const votes = [{ id: "v1", value: "5" }] as any;
    const stats = { average: 5, median: 5 } as any;

    useRoomStore.getState().setVoteResults(votes, stats);

    expect(useRoomStore.getState().votes).toEqual(votes);
    expect(useRoomStore.getState().voteStats).toEqual(stats);
  });
});
