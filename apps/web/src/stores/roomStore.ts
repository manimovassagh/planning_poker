import { create } from "zustand";
import type {
  Room,
  RoomParticipant,
  Story,
  VotingRound,
  Vote,
  VoteStats,
} from "@planning-poker/shared";
import { api } from "@/lib/api";

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  participants: RoomParticipant[];
  stories: Story[];
  currentStory: Story | null;
  currentRound: VotingRound | null;
  votes: Vote[];
  voteStats: VoteStats | null;
  votedUserIds: Set<string>;
  myVote: string | null;
  isLoading: boolean;

  fetchRooms: () => Promise<void>;
  fetchRoom: (roomId: string) => Promise<void>;
  createRoom: (name: string, cardScale: string) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room>;

  setParticipants: (participants: RoomParticipant[]) => void;
  addParticipant: (participant: RoomParticipant) => void;
  removeParticipant: (userId: string) => void;

  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  updateStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  setCurrentStory: (story: Story | null) => void;

  setCurrentRound: (round: VotingRound | null) => void;
  setVotedUser: (userId: string) => void;
  setMyVote: (value: string | null) => void;
  setVoteResults: (votes: Vote[], stats: VoteStats) => void;
  resetVoting: () => void;

  reset: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  participants: [],
  stories: [],
  currentStory: null,
  currentRound: null,
  votes: [],
  voteStats: null,
  votedUserIds: new Set(),
  myVote: null,
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    const { data } = await api.get("/rooms");
    set({ rooms: data.rooms, isLoading: false });
  },

  fetchRoom: async (roomId) => {
    set({ isLoading: true });
    const { data } = await api.get(`/rooms/${roomId}`);
    set({
      currentRoom: data.room,
      participants: data.room.participants,
      stories: data.room.stories,
      isLoading: false,
    });
  },

  createRoom: async (name, cardScale) => {
    const { data } = await api.post("/rooms", { name, cardScale });
    set((state) => ({ rooms: [data.room, ...state.rooms] }));
    return data.room;
  },

  joinRoom: async (code) => {
    const { data: lookup } = await api.get(`/rooms/join/${code}`);
    await api.post(`/rooms/${lookup.room.id}/join`);
    return lookup.room;
  },

  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => {
      const exists = state.participants.some((p) => p.userId === participant.userId);
      if (exists) return state;
      return { participants: [...state.participants, participant] };
    }),
  removeParticipant: (userId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.userId !== userId),
    })),

  setStories: (stories) => set({ stories }),
  addStory: (story) =>
    set((state) => ({ stories: [...state.stories, story] })),
  updateStory: (story) =>
    set((state) => ({
      stories: state.stories.map((s) => (s.id === story.id ? story : s)),
      currentStory:
        state.currentStory?.id === story.id ? story : state.currentStory,
    })),
  removeStory: (storyId) =>
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== storyId),
      currentStory:
        state.currentStory?.id === storyId ? null : state.currentStory,
    })),
  setCurrentStory: (story) => set({ currentStory: story }),

  setCurrentRound: (round) => set({ currentRound: round }),
  setVotedUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.votedUserIds);
      newSet.add(userId);
      return { votedUserIds: newSet };
    }),
  setMyVote: (value) => set({ myVote: value }),
  setVoteResults: (votes, stats) => set({ votes, voteStats: stats }),
  resetVoting: () =>
    set({
      votes: [],
      voteStats: null,
      votedUserIds: new Set(),
      myVote: null,
    }),

  reset: () =>
    set({
      currentRoom: null,
      participants: [],
      stories: [],
      currentStory: null,
      currentRound: null,
      votes: [],
      voteStats: null,
      votedUserIds: new Set(),
      myVote: null,
    }),
}));
