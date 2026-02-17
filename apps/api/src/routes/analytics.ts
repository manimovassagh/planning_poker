import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get("/rooms/:roomId", async (req: AuthRequest, res, next) => {
  try {
    const roomId = req.params.roomId as string;

    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId: req.userId! } },
    });
    if (!participant) throw new AppError(403, "Not a participant");

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: { select: { stories: true, participants: true } },
        stories: {
          include: {
            _count: { select: { rounds: true } },
          },
        },
      },
    });
    if (!room) throw new AppError(404, "Room not found");

    const storiesWithFinal = room.stories.filter((s) => s.finalEstimate);
    const totalRounds = room.stories.reduce(
      (sum, s) => sum + s._count.rounds,
      0
    );

    res.json({
      roomId,
      roomName: room.name,
      totalStories: room._count.stories,
      totalParticipants: room._count.participants,
      completedStories: storiesWithFinal.length,
      totalRounds,
      averageRoundsPerStory:
        room._count.stories > 0
          ? totalRounds / room._count.stories
          : 0,
    });
  } catch (err) {
    next(err);
  }
});

analyticsRouter.get(
  "/rooms/:roomId/stories",
  async (req: AuthRequest, res, next) => {
    try {
      const roomId = req.params.roomId as string;

      const participant = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId: req.userId! } },
      });
      if (!participant) throw new AppError(403, "Not a participant");

      const stories = await prisma.story.findMany({
        where: { roomId },
        include: {
          rounds: {
            include: {
              votes: {
                include: {
                  user: {
                    select: { id: true, displayName: true, avatarUrl: true },
                  },
                },
              },
            },
            orderBy: { roundNum: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      res.json({ stories });
    } catch (err) {
      next(err);
    }
  }
);

analyticsRouter.get("/user/history", async (req: AuthRequest, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        participants: { some: { userId: req.userId! } },
        status: "completed",
      },
      include: {
        _count: { select: { stories: true, participants: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    res.json({ rooms });
  } catch (err) {
    next(err);
  }
});
