import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SocketEvents, type CardScale } from "@planning-poker/shared";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "@/stores/roomStore";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ParticipantsList } from "@/components/room/ParticipantsList";
import { CardDeck } from "@/components/room/CardDeck";
import { VoteStatusBar } from "@/components/room/VoteStatusBar";
import { ResultsPanel } from "@/components/room/ResultsPanel";
import { Copy, Check, Plus, LogOut } from "lucide-react";

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    currentRoom,
    stories,
    currentStory,
    currentRound,
    myVote,
    votes,
    voteStats,
    fetchRoom,
    setParticipants,
    addParticipant,
    removeParticipant,
    addStory,
    updateStory,
    removeStory,
    setCurrentStory,
    setCurrentRound,
    setVotedUser,
    setMyVote,
    setVoteResults,
    resetVoting,
    reset,
    isLoading,
  } = useRoomStore();

  const [copied, setCopied] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [finalEstimate, setFinalEstimate] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  const isFacilitator = currentRoom?.ownerId === user?.id;
  const isVoting = currentStory?.status === "voting";
  const isRevealed = currentStory?.status === "revealed";

  useEffect(() => {
    if (!roomId) return;
    fetchRoom(roomId);

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = connectSocket(token);
    socket.emit(SocketEvents.ROOM_JOIN, { roomId });

    // Room events
    socket.on(SocketEvents.ROOM_PARTICIPANTS, ({ participants }) => {
      setParticipants(participants);
    });
    socket.on(SocketEvents.ROOM_USER_JOINED, ({ user: joinedUser, role }) => {
      addParticipant({
        id: "",
        roomId: roomId!,
        userId: joinedUser.id,
        role,
        joinedAt: new Date().toISOString(),
        user: joinedUser,
      });
    });
    socket.on(SocketEvents.ROOM_USER_LEFT, ({ userId }) => {
      removeParticipant(userId);
    });

    // Story events
    socket.on(SocketEvents.STORY_ADDED, ({ story }) => addStory(story));
    socket.on(SocketEvents.STORY_UPDATED, ({ story }) => updateStory(story));
    socket.on(SocketEvents.STORY_DELETED, ({ storyId }) =>
      removeStory(storyId)
    );

    // Voting events
    socket.on(
      SocketEvents.STORY_VOTING_STARTED,
      ({ storyId, roundId, roundNum }) => {
        const story = useRoomStore
          .getState()
          .stories.find((s) => s.id === storyId);
        if (story) {
          setCurrentStory({ ...story, status: "voting" });
        }
        setCurrentRound({
          id: roundId,
          storyId,
          roundNum,
          startedAt: new Date().toISOString(),
          revealedAt: null,
        });
        resetVoting();
      }
    );

    socket.on(SocketEvents.VOTE_SUBMITTED, ({ userId }) => {
      setVotedUser(userId);
    });

    socket.on(SocketEvents.VOTE_REVEALED, ({ votes, stats }) => {
      setVoteResults(votes, stats);
      const story = useRoomStore.getState().currentStory;
      if (story) {
        setCurrentStory({ ...story, status: "revealed" });
      }
    });

    socket.on(
      SocketEvents.STORY_REVOTING,
      ({ storyId, roundId, roundNum }) => {
        const story = useRoomStore
          .getState()
          .stories.find((s) => s.id === storyId);
        if (story) {
          setCurrentStory({ ...story, status: "voting" });
        }
        setCurrentRound({
          id: roundId,
          storyId,
          roundNum,
          startedAt: new Date().toISOString(),
          revealedAt: null,
        });
        resetVoting();
      }
    );

    socket.on(SocketEvents.STORY_FINALIZED, ({ storyId, finalEstimate }) => {
      const story = useRoomStore
        .getState()
        .stories.find((s) => s.id === storyId);
      if (story) {
        updateStory({ ...story, status: "final", finalEstimate });
      }
      setCurrentStory(null);
      setCurrentRound(null);
      resetVoting();
    });

    socket.on(SocketEvents.ROOM_SESSION_ENDED, () => {
      setSessionEnded(true);
    });

    return () => {
      socket.emit(SocketEvents.ROOM_LEAVE, { roomId });
      socket.off(SocketEvents.ROOM_PARTICIPANTS);
      socket.off(SocketEvents.ROOM_USER_JOINED);
      socket.off(SocketEvents.ROOM_USER_LEFT);
      socket.off(SocketEvents.STORY_ADDED);
      socket.off(SocketEvents.STORY_UPDATED);
      socket.off(SocketEvents.STORY_DELETED);
      socket.off(SocketEvents.STORY_VOTING_STARTED);
      socket.off(SocketEvents.VOTE_SUBMITTED);
      socket.off(SocketEvents.VOTE_REVEALED);
      socket.off(SocketEvents.STORY_REVOTING);
      socket.off(SocketEvents.STORY_FINALIZED);
      socket.off(SocketEvents.ROOM_SESSION_ENDED);
      disconnectSocket();
      reset();
    };
  }, [roomId]);

  const handleCopyCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddStory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !roomId) return;
    try {
      await api.post(`/rooms/${roomId}/stories`, {
        title: newStoryTitle.trim(),
      });
      setNewStoryTitle("");
    } catch {
      // handled by error boundary
    }
  };

  const handleSelectCard = (value: string) => {
    const socket = getSocket();
    if (!socket || !currentStory || !currentRound) return;
    setMyVote(value);
    socket.emit(SocketEvents.VOTE_SUBMIT, {
      storyId: currentStory.id,
      roundId: currentRound.id,
      value,
    });
  };

  const handleStartVoting = (storyId: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(SocketEvents.STORY_START_VOTING, { storyId });
  };

  const handleReveal = () => {
    const socket = getSocket();
    if (!socket || !currentStory || !currentRound) return;
    socket.emit(SocketEvents.VOTE_REVEAL, {
      storyId: currentStory.id,
      roundId: currentRound.id,
    });
  };

  const handleRevote = () => {
    const socket = getSocket();
    if (!socket || !currentStory) return;
    socket.emit(SocketEvents.STORY_START_REVOTE, {
      storyId: currentStory.id,
    });
  };

  const handleSetFinal = () => {
    const socket = getSocket();
    if (!socket || !currentStory || !finalEstimate) return;
    socket.emit(SocketEvents.STORY_SET_FINAL, {
      storyId: currentStory.id,
      finalEstimate,
    });
    setFinalEstimate("");
  };

  const handleEndSession = () => {
    const socket = getSocket();
    if (!socket || !roomId) return;
    socket.emit(SocketEvents.ROOM_END_SESSION, { roomId });
  };

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Session Ended</h2>
        <p className="text-muted-foreground">
          This planning session has been completed.
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading || !currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      {/* Room Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
          <button
            onClick={handleCopyCode}
            className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="font-mono tracking-widest">
              {currentRoom.code}
            </span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {isFacilitator && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
          >
            <LogOut className="mr-2 h-4 w-4" />
            End Session
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-6">
          <ParticipantsList />

          {/* Story list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Stories ({stories.length})
            </h3>

            {isFacilitator && (
              <form onSubmit={handleAddStory} className="flex gap-2">
                <Input
                  placeholder="Add story..."
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="text-sm"
                />
                <Button type="submit" size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            )}

            <div className="space-y-1">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-secondary/50 ${
                    currentStory?.id === story.id
                      ? "bg-primary/10 border border-primary/20"
                      : ""
                  }`}
                  onClick={() => {
                    if (
                      isFacilitator &&
                      story.status === "pending"
                    ) {
                      handleStartVoting(story.id);
                    }
                  }}
                >
                  <span className="truncate">{story.title}</span>
                  {story.finalEstimate && (
                    <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {story.finalEstimate}
                    </span>
                  )}
                  {story.status === "voting" && (
                    <span className="ml-2 rounded bg-warning/10 px-2 py-0.5 text-xs text-warning">
                      voting
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main voting area */}
        <div className="space-y-6">
          {currentStory ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">
                    {currentStory.title}
                  </h2>
                  {currentStory.description && (
                    <p className="mt-2 text-muted-foreground">
                      {currentStory.description}
                    </p>
                  )}
                  {currentRound && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Round {currentRound.roundNum}
                    </p>
                  )}
                </CardContent>
              </Card>

              {isVoting && (
                <>
                  <VoteStatusBar />
                  <CardDeck
                    cardScale={
                      (currentRoom.cardScale as CardScale) || "fibonacci"
                    }
                    selectedValue={myVote}
                    disabled={false}
                    onSelect={handleSelectCard}
                  />
                  {isFacilitator && (
                    <div className="flex justify-center">
                      <Button onClick={handleReveal} size="lg">
                        Reveal Votes
                      </Button>
                    </div>
                  )}
                </>
              )}

              {isRevealed && votes.length > 0 && voteStats && (
                <>
                  <ResultsPanel votes={votes} stats={voteStats} />
                  {isFacilitator && (
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" onClick={handleRevote}>
                        Re-vote
                      </Button>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Final estimate"
                          value={finalEstimate}
                          onChange={(e) => setFinalEstimate(e.target.value)}
                          className="w-32"
                        />
                        <Button
                          onClick={handleSetFinal}
                          disabled={!finalEstimate}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-16">
              <div className="text-center">
                <h3 className="text-lg font-medium text-muted-foreground">
                  {stories.length === 0
                    ? "Add stories to begin"
                    : "Select a story to start voting"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isFacilitator
                    ? "Click on a story to start voting"
                    : "Waiting for the facilitator to start voting"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
