import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@planning-poker/shared";
import { setupRoomHandlers } from "./roomHandlers";
import { setupVoteHandlers } from "./voteHandlers";

export type AppSocket = import("socket.io").Socket<
  ClientToServerEvents,
  ServerToClientEvents
> & { userId?: string };

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function getIO() {
  return io;
}

export function setupSocket(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      (socket as AppSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const appSocket = socket as AppSocket;

    setupRoomHandlers(io, appSocket);
    setupVoteHandlers(io, appSocket);
  });

  return io;
}
