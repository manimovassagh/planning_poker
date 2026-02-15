import { Router } from "express";
import { createStorySchema, updateStorySchema } from "@planning-poker/shared";
import { validate } from "../middleware/validate";
import { authenticate, type AuthRequest } from "../middleware/auth";
import * as storyService from "../services/storyService";

export const storyRouter = Router();

storyRouter.use(authenticate);

storyRouter.post(
  "/:roomId/stories",
  validate(createStorySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const story = await storyService.createStory(
        req.params.roomId as string,
        req.userId!,
        req.body
      );
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
      const story = await storyService.updateStory(
        req.params.roomId as string,
        req.params.storyId as string,
        req.userId!,
        req.body
      );
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
      await storyService.deleteStory(
        req.params.roomId as string,
        req.params.storyId as string,
        req.userId!
      );
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
