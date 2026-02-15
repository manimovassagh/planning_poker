import { useRoomStore } from "@/stores/roomStore";
import { cn } from "@/lib/utils";
import { Crown, Eye } from "lucide-react";

export function ParticipantsList() {
  const participants = useRoomStore((s) => s.participants);
  const votedUserIds = useRoomStore((s) => s.votedUserIds);
  const currentStory = useRoomStore((s) => s.currentStory);
  const isVoting = currentStory?.status === "voting";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Participants ({participants.length})
      </h3>
      <div className="space-y-1">
        {participants.map((p) => {
          const hasVoted = votedUserIds.has(p.userId);
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-secondary/50"
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  "bg-primary/10 text-primary"
                )}
              >
                {p.user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">
                    {p.user.displayName}
                  </span>
                  {p.role === "facilitator" && (
                    <Crown className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                  )}
                  {p.role === "observer" && (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </div>
              {isVoting && p.role !== "observer" && (
                <div
                  className={cn(
                    "h-3 w-3 rounded-full flex-shrink-0",
                    hasVoted ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
