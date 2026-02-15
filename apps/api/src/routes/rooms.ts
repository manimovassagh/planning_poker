import { Router } from "express";
import { createRoomSchema, updateRoomSchema } from "@planning-poker/shared";
import { validate } from "../middleware/validate";
import { authenticate, type AuthRequest } from "../middleware/auth";
import * as roomService from "../services/roomService";

export const roomRouter = Router();

roomRouter.use(authenticate);

roomRouter.post("/", validate(createRoomSchema), async (req: AuthRequest, res, next) => {
  try {
    const room = await roomService.createRoom(req.userId!, req.body);
    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
});

roomRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const rooms = await roomService.listUserRooms(req.userId!);
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
});

roomRouter.get("/join/:code", async (req: AuthRequest, res, next) => {
  try {
    const room = await roomService.getRoomByCode(req.params.code as string);
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

roomRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const room = await roomService.getRoomById(req.params.id as string, req.userId!);
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

roomRouter.post("/:id/join", async (req: AuthRequest, res, next) => {
  try {
    const participant = await roomService.joinRoom(req.params.id as string, req.userId!);
    res.json({ participant });
  } catch (err) {
    next(err);
  }
});

roomRouter.patch("/:id", validate(updateRoomSchema), async (req: AuthRequest, res, next) => {
  try {
    const room = await roomService.updateRoom(req.params.id as string, req.userId!, req.body);
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

roomRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id as string, req.userId!);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
