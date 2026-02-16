import { Router } from "express";
import { createStorySchema, updateStorySchema, SocketEvents } from "@planning-poker/shared";
import type { Story } from "@planning-poker/shared";
import { validate } from "../middleware/validate";
import { authenticate, type AuthRequest } from "../middleware/auth";
import * as storyService from "../services/storyService";
import { getIO } from "../socket";

function serializeStory(s: { createdAt: Date; updatedAt: Date; [k: string]: unknown }): Story {
  return { ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() } as Story;
}

export const storyRouter = Router();

storyRouter.use(authenticate);

storyRouter.post(
  "/:roomId/stories",
  validate(createStorySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const roomId = req.params.roomId as string;
      const raw = await storyService.createStory(roomId, req.userId!, req.body);
      const story = serializeStory(raw);

      getIO().to(roomId).emit(SocketEvents.STORY_ADDED, { story });

      res.status(201).json({ story });
    } catch (err) {
      next(err);
    }
  }
);

storyRouter.get("/:roomId/stories", async (req: AuthRequest, res, next) => {
  try {
    const stories = await storyService.listStories(
      req.params.roomId as string,
      req.userId!
    );
    res.json({ stories });
  } catch (err) {
    next(err);
  }
});

storyRouter.patch(
  "/:roomId/stories/:storyId",
  validate(updateStorySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const roomId = req.params.roomId as string;
      const raw = await storyService.updateStory(
        roomId,
        req.params.storyId as string,
        req.userId!,
        req.body
      );
      const story = serializeStory(raw);

      getIO().to(roomId).emit(SocketEvents.STORY_UPDATED, { story });

      res.json({ story });
    } catch (err) {
      next(err);
    }
  }
);

storyRouter.delete(
  "/:roomId/stories/:storyId",
  async (req: AuthRequest, res, next) => {
    try {
      const roomId = req.params.roomId as string;
      const storyId = req.params.storyId as string;
      await storyService.deleteStory(roomId, storyId, req.userId!);

      getIO().to(roomId).emit(SocketEvents.STORY_DELETED, { storyId });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
