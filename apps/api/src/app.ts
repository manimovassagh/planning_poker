import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth";
import { roomRouter } from "./routes/rooms";
import { storyRouter } from "./routes/stories";
import { analyticsRouter } from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", limiter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/rooms", storyRouter);
app.use("/api/analytics", analyticsRouter);

// Error handler
app.use(errorHandler);

export { app };
