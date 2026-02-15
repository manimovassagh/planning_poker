import { useRoomStore } from "@/stores/roomStore";

export function VoteStatusBar() {
  const participants = useRoomStore((s) => s.participants);
  const votedUserIds = useRoomStore((s) => s.votedUserIds);

  const voters = participants.filter(
    (p) => p.role === "voter" || p.role === "facilitator"
  );
  const votedCount = voters.filter((v) => votedUserIds.has(v.userId)).length;
  const totalVoters = voters.length;
  const percentage = totalVoters > 0 ? (votedCount / totalVoters) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {votedCount} of {totalVoters} voted
        </span>
        {votedCount === totalVoters && totalVoters > 0 && (
          <span className="font-medium text-success">All votes in!</span>
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
