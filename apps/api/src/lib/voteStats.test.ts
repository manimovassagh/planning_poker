import { describe, it, expect } from "vitest";
import { calculateStats } from "./voteStats";

function makeVotes(values: string[]) {
  return values.map((value, i) => ({
    value,
    userId: `user-${i}`,
    user: { id: `user-${i}`, displayName: `User ${i}`, avatarUrl: null },
  }));
}

describe("calculateStats", () => {
  it("returns strong consensus when all votes are the same", () => {
    const stats = calculateStats(makeVotes(["5", "5", "5"]));
    expect(stats.consensusLevel).toBe("strong");
    expect(stats.average).toBe(5);
    expect(stats.median).toBe(5);
    expect(stats.mode).toBe("5");
    expect(stats.totalVotes).toBe(3);
  });

  it("computes correct average and median for mixed votes", () => {
    const stats = calculateStats(makeVotes(["1", "3", "5", "8"]));
    expect(stats.average).toBe(4.3);
    expect(stats.median).toBe(4);
    expect(stats.totalVotes).toBe(4);
  });

  it("handles non-numeric votes gracefully", () => {
    const stats = calculateStats(makeVotes(["?", "?", "?"]));
    expect(stats.average).toBeNull();
    expect(stats.median).toBeNull();
    expect(stats.mode).toBe("?");
    expect(stats.consensusLevel).toBe("strong");
  });

  it("computes distribution correctly", () => {
    const stats = calculateStats(makeVotes(["3", "5", "3", "8"]));
    expect(stats.distribution).toEqual({ "3": 2, "5": 1, "8": 1 });
    expect(stats.mode).toBe("3");
  });

  it("handles single vote", () => {
    const stats = calculateStats(makeVotes(["13"]));
    expect(stats.average).toBe(13);
    expect(stats.median).toBe(13);
    expect(stats.consensusLevel).toBe("strong");
    expect(stats.totalVotes).toBe(1);
  });

  it("computes median correctly for even number of voters", () => {
    const stats = calculateStats(makeVotes(["2", "4"]));
    expect(stats.median).toBe(3);
  });

  it("identifies low consensus for spread votes", () => {
    const stats = calculateStats(makeVotes(["1", "13", "1", "21"]));
    expect(stats.consensusLevel).toBe("low");
  });

  it("handles mix of numeric and non-numeric votes", () => {
    const stats = calculateStats(makeVotes(["5", "?", "8"]));
    expect(stats.average).toBe(6.5);
    expect(stats.median).toBe(6.5);
    expect(stats.totalVotes).toBe(3);
    expect(stats.distribution).toEqual({ "5": 1, "?": 1, "8": 1 });
  });
});
