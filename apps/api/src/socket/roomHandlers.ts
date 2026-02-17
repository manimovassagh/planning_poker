import type { Server } from "socket.io";
import { SocketEvents } from "@planning-poker/shared";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@planning-poker/shared";
import type { AppSocket } from "./index";
import { prisma } from "../lib/prisma";

export function setupRoomHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AppSocket
) {
  socket.on(SocketEvents.ROOM_JOIN, async ({ roomId }) => {
    try {
      const participant = await prisma.roomParticipant.findUnique({
        where: { roomId_userId: { roomId, userId: socket.userId! } },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      if (!participant) return;

      socket.join(roomId);

      // Notify others
      socket.to(roomId).emit(SocketEvents.ROOM_USER_JOINED, {
        user: participant.user,
        role: participant.role,
      });

      // Send full participant list to the joining user
      const participants = await prisma.roomParticipant.findMany({
        where: { roomId },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      });

      socket.emit(SocketEvents.ROOM_PARTICIPANTS, {
        participants: participants.map(
          (p: (typeof participants)[number]) => ({
            ...p,
            joinedAt: p.joinedAt.toISOString(),
          })
        ) as unknown as import("@planning-poker/shared").RoomParticipant[],
      });
    } catch {
      /* silently handled */
    }
  });

  socket.on(SocketEvents.ROOM_LEAVE, ({ roomId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit(SocketEvents.ROOM_USER_LEFT, {
      userId: socket.userId!,
    });
  });

  socket.on(SocketEvents.ROOM_END_SESSION, async ({ roomId }) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room || room.ownerId !== socket.userId) return;
      if (room.status !== "active") return;

      await prisma.room.update({
        where: { id: roomId },
        data: { status: "completed" },
      });

      io.to(roomId).emit(SocketEvents.ROOM_SESSION_ENDED, { roomId });
    } catch {
      /* silently handled */
    }
  });
}
