import { prisma } from "../lib/prisma";
import { generateRoomCode } from "../lib/roomCode";
import { AppError } from "../middleware/errorHandler";
import type { CreateRoomInput, UpdateRoomInput } from "@planning-poker/shared";

export async function createRoom(userId: string, input: CreateRoomInput) {
  const code = await generateRoomCode();
  const room = await prisma.room.create({
    data: {
      name: input.name,
      code,
      ownerId: userId,
      cardScale: input.cardScale,
    },
  });

  // Owner joins as facilitator
  await prisma.roomParticipant.create({
    data: { roomId: room.id, userId, role: "facilitator" },
  });

  return room;
}

export async function listUserRooms(userId: string) {
  return prisma.room.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: {
      _count: { select: { participants: true, stories: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRoomById(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      stories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!room) throw new AppError(404, "Room not found");

  const isParticipant = room.participants.some(
    (p: (typeof room.participants)[number]) => p.userId === userId
  );
  if (!isParticipant) throw new AppError(403, "Not a participant of this room");

  return room;
}

export async function getRoomByCode(code: string) {
  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      _count: { select: { participants: true } },
    },
  });
  if (!room) throw new AppError(404, "Room not found");
  return room;
}

export async function joinRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(404, "Room not found");
  if (room.status !== "active") throw new AppError(400, "Room is no longer active");

  const existing = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (existing) return existing;

  return prisma.roomParticipant.create({
    data: { roomId, userId, role: "voter" },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function updateRoom(
  roomId: string,
  userId: string,
  input: UpdateRoomInput
) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(404, "Room not found");
  if (room.ownerId !== userId) throw new AppError(403, "Only the facilitator can update the room");

  return prisma.room.update({
    where: { id: roomId },
    data: input,
  });
}

export async function deleteRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError(404, "Room not found");
  if (room.ownerId !== userId) throw new AppError(403, "Only the facilitator can delete the room");

  await prisma.room.delete({ where: { id: roomId } });
}
