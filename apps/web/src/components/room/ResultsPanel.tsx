import type { Vote, VoteStats } from "@planning-poker/shared";
import { cn } from "@/lib/utils";

interface ResultsPanelProps {
  votes: Vote[];
  stats: VoteStats;
}

export function ResultsPanel({ votes, stats }: ResultsPanelProps) {
  const counts = Object.values(stats.distribution);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold">Results</h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.average ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.median ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">Median</div>
        </div>
        <div className="text-center">
          <div
            className={cn(
              "text-sm font-semibold rounded-full px-3 py-1 inline-block",
              stats.consensusLevel === "strong" &&
                "bg-success/10 text-success",
              stats.consensusLevel === "moderate" &&
                "bg-warning/10 text-warning",
              stats.consensusLevel === "low" &&
                "bg-danger/10 text-danger"
            )}
          >
            {stats.consensusLevel}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Consensus</div>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          Distribution
        </h4>
        <div className="flex items-end justify-center gap-2" style={{ height: 100 }}>
          {Object.entries(stats.distribution).map(([value, count]) => (
            <div key={value} className="flex flex-col items-center gap-1">
              <div
                className="w-10 rounded-t bg-primary/80 transition-all duration-500"
                style={{
                  height: `${(count / maxCount) * 80}px`,
                }}
              />
              <span className="text-xs font-medium">{value}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vote table */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Votes</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {votes.map((vote) => (
            <div
              key={vote.id}
              className="flex items-center justify-between rounded-md bg-secondary px-3 py-2"
            >
              <span className="text-sm truncate">
                {vote.user.displayName}
              </span>
              <span className="ml-2 font-bold text-primary">{vote.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
