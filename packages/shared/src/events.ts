export const SocketEvents = {
  // Room events
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_USER_JOINED: "room:user_joined",
  ROOM_USER_LEFT: "room:user_left",
  ROOM_UPDATED: "room:updated",
  ROOM_PARTICIPANTS: "room:participants",
  ROOM_END_SESSION: "room:end_session",
  ROOM_SESSION_ENDED: "room:session_ended",

  // Story events
  STORY_ADDED: "story:added",
  STORY_UPDATED: "story:updated",
  STORY_DELETED: "story:deleted",
  STORY_START_VOTING: "story:start_voting",
  STORY_VOTING_STARTED: "story:voting_started",
  STORY_START_REVOTE: "story:start_revote",
  STORY_REVOTING: "story:revoting",
  STORY_SET_FINAL: "story:set_final",
  STORY_FINALIZED: "story:finalized",

  // Vote events
  VOTE_SUBMIT: "vote:submit",
  VOTE_SUBMITTED: "vote:submitted",
  VOTE_ALL_IN: "vote:all_in",
  VOTE_REVEAL: "vote:reveal",
  VOTE_REVEALED: "vote:revealed",

  // Presence
  PRESENCE_UPDATE: "presence:update",
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];

// Client -> Server payloads
export interface ClientToServerEvents {
  [SocketEvents.ROOM_JOIN]: (data: { roomId: string }) => void;
  [SocketEvents.ROOM_LEAVE]: (data: { roomId: string }) => void;
  [SocketEvents.STORY_START_VOTING]: (data: { storyId: string }) => void;
  [SocketEvents.VOTE_SUBMIT]: (data: {
    storyId: string;
    roundId: string;
    value: string;
  }) => void;
  [SocketEvents.VOTE_REVEAL]: (data: {
    storyId: string;
    roundId: string;
  }) => void;
  [SocketEvents.STORY_START_REVOTE]: (data: { storyId: string }) => void;
  [SocketEvents.STORY_SET_FINAL]: (data: {
    storyId: string;
    finalEstimate: string;
  }) => void;
  [SocketEvents.ROOM_END_SESSION]: (data: { roomId: string }) => void;
}

// Server -> Client payloads
export interface ServerToClientEvents {
  [SocketEvents.ROOM_USER_JOINED]: (data: {
    user: { id: string; displayName: string; avatarUrl: string | null };
    role: string;
  }) => void;
  [SocketEvents.ROOM_USER_LEFT]: (data: { userId: string }) => void;
  [SocketEvents.ROOM_UPDATED]: (data: { room: import("./types").Room }) => void;
  [SocketEvents.ROOM_PARTICIPANTS]: (data: {
    participants: import("./types").RoomParticipant[];
  }) => void;
  [SocketEvents.STORY_ADDED]: (data: {
    story: import("./types").Story;
  }) => void;
  [SocketEvents.STORY_UPDATED]: (data: {
    story: import("./types").Story;
  }) => void;
  [SocketEvents.STORY_DELETED]: (data: { storyId: string }) => void;
  [SocketEvents.STORY_VOTING_STARTED]: (data: {
    storyId: string;
    roundId: string;
    roundNum: number;
  }) => void;
  [SocketEvents.VOTE_SUBMITTED]: (data: {
    userId: string;
    hasVoted: boolean;
  }) => void;
  [SocketEvents.VOTE_ALL_IN]: () => void;
  [SocketEvents.VOTE_REVEALED]: (data: {
    roundId: string;
    votes: import("./types").Vote[];
    stats: import("./types").VoteStats;
  }) => void;
  [SocketEvents.STORY_REVOTING]: (data: {
    storyId: string;
    roundId: string;
    roundNum: number;
  }) => void;
  [SocketEvents.STORY_FINALIZED]: (data: {
    storyId: string;
    finalEstimate: string;
  }) => void;
  [SocketEvents.ROOM_SESSION_ENDED]: (data: { roomId: string }) => void;
  [SocketEvents.PRESENCE_UPDATE]: (data: {
    onlineUsers: string[];
  }) => void;
}
