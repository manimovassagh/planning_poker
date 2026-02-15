import { Router } from "express";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "@planning-poker/shared";
import { validate } from "../middleware/validate";
import { authenticate, type AuthRequest } from "../middleware/auth";
import * as authService from "../services/authService";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.getMe(req.userId!);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
