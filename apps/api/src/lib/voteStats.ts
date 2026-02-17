import type { VoteStats } from "@planning-poker/shared";

export function calculateStats(
  votes: { value: string; userId: string; user: { id: string; displayName: string; avatarUrl: string | null } }[]
): VoteStats {
  const numericVotes = votes
    .map((v) => parseFloat(v.value))
    .filter((v) => !isNaN(v));

  const distribution: Record<string, number> = {};
  for (const vote of votes) {
    distribution[vote.value] = (distribution[vote.value] || 0) + 1;
  }

  let average: number | null = null;
  let median: number | null = null;
  let mode = "?";

  if (numericVotes.length > 0) {
    average =
      Math.round(
        (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length) * 10
      ) / 10;

    const sorted = [...numericVotes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    median =
      sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }

  // Mode: most common value
  let maxCount = 0;
  for (const [value, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  // Consensus
  let consensusLevel: "strong" | "moderate" | "low" = "low";
  const uniqueValues = new Set(votes.map((v) => v.value));
  if (uniqueValues.size === 1) {
    consensusLevel = "strong";
  } else if (numericVotes.length > 0) {
    const mean = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    const variance =
      numericVotes.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      numericVotes.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? stdDev / mean : Infinity;
    consensusLevel = cv < 0.3 ? "moderate" : "low";
  }

  return {
    average,
    median,
    mode,
    distribution,
    consensusLevel,
    totalVoters: votes.length,
    totalVotes: votes.length,
  };
}
