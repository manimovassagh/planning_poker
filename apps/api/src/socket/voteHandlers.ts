import type { Server } from "socket.io";
import { SocketEvents } from "@planning-poker/shared";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  VoteStats,
} from "@planning-poker/shared";
import type { AppSocket } from "./index";
import { prisma } from "../lib/prisma";

function calculateStats(
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

export function setupVoteHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AppSocket
) {
  socket.on(SocketEvents.STORY_START_VOTING, async ({ storyId }) => {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: { room: true },
      });
      if (!story || story.room.ownerId !== socket.userId) return;

      // Count existing rounds
      const roundCount = await prisma.votingRound.count({
        where: { storyId },
      });

      const round = await prisma.votingRound.create({
        data: { storyId, roundNum: roundCount + 1 },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: { status: "voting" },
      });

      io.to(story.roomId).emit(SocketEvents.STORY_VOTING_STARTED, {
        storyId,
        roundId: round.id,
        roundNum: round.roundNum,
      });
    } catch {
      /* silently handled */
    }
  });

  socket.on(SocketEvents.VOTE_SUBMIT, async ({ storyId, roundId, value }) => {
    try {
      const round = await prisma.votingRound.findUnique({
        where: { id: roundId },
        include: { story: true },
      });
      if (!round || round.revealedAt) return;

      // Upsert vote
      await prisma.vote.upsert({
        where: { roundId_userId: { roundId, userId: socket.userId! } },
        create: {
          roundId,
          storyId,
          userId: socket.userId!,
          value,
        },
        update: { value },
      });

      // Broadcast that user voted (not the value)
      io.to(round.story.roomId).emit(SocketEvents.VOTE_SUBMITTED, {
        userId: socket.userId!,
        hasVoted: true,
      });

      // Check if all voters have voted
      const voters = await prisma.roomParticipant.count({
        where: { roomId: round.story.roomId, role: "voter" },
      });
      const facilitator = await prisma.roomParticipant.findFirst({
        where: { roomId: round.story.roomId, role: "facilitator" },
      });
      const totalEligible = voters + (facilitator ? 1 : 0);
      const voteCount = await prisma.vote.count({ where: { roundId } });

      if (voteCount >= totalEligible) {
        io.to(round.story.roomId).emit(SocketEvents.VOTE_ALL_IN);
      }
    } catch {
      /* silently handled */
    }
  });

  socket.on(SocketEvents.VOTE_REVEAL, async ({ storyId, roundId }) => {
    try {
      // Verify facilitator
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: { room: true },
      });
      if (!story || story.room.ownerId !== socket.userId) return;

      await prisma.votingRound.update({
        where: { id: roundId },
        data: { revealedAt: new Date() },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: { status: "revealed" },
      });

      const votes = await prisma.vote.findMany({
        where: { roundId },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      const stats = calculateStats(votes);

      io.to(story.roomId).emit(SocketEvents.VOTE_REVEALED, {
        roundId,
        votes: votes.map((v: (typeof votes)[number]) => ({
          id: v.id,
          roundId: v.roundId,
          storyId: v.storyId,
          userId: v.userId,
          value: v.value,
          createdAt: v.createdAt.toISOString(),
          user: v.user,
        })) as unknown as import("@planning-poker/shared").Vote[],
        stats,
      });
    } catch {
      /* silently handled */
    }
  });

  socket.on(SocketEvents.STORY_START_REVOTE, async ({ storyId }) => {
    try {
      const story = await prisma.story.findUnique({
        where: { id: storyId },
        include: { room: true },
      });
      if (!story || story.room.ownerId !== socket.userId) return;

      const roundCount = await prisma.votingRound.count({
        where: { storyId },
      });

      const round = await prisma.votingRound.create({
        data: { storyId, roundNum: roundCount + 1 },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: { status: "voting" },
      });

      io.to(story.roomId).emit(SocketEvents.STORY_REVOTING, {
        storyId,
        roundId: round.id,
        roundNum: round.roundNum,
      });
    } catch {
      /* silently handled */
    }
  });

  socket.on(
    SocketEvents.STORY_SET_FINAL,
    async ({ storyId, finalEstimate }) => {
      try {
        const story = await prisma.story.findUnique({
          where: { id: storyId },
          include: { room: true },
        });
        if (!story || story.room.ownerId !== socket.userId) return;

        await prisma.story.update({
          where: { id: storyId },
          data: { status: "final", finalEstimate },
        });

        io.to(story.roomId).emit(SocketEvents.STORY_FINALIZED, {
          storyId,
          finalEstimate,
        });
      } catch {
        /* silently handled */
      }
    }
  );
}
