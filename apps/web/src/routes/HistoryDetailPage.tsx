import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, FileText, BarChart3, Hash } from "lucide-react";

interface RoomAnalytics {
  roomId: string;
  roomName: string;
  totalStories: number;
  totalParticipants: number;
  completedStories: number;
  totalRounds: number;
  averageRoundsPerStory: number;
}

interface StoryVote {
  id: string;
  value: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
}

interface StoryRound {
  id: string;
  roundNum: number;
  startedAt: string;
  revealedAt: string | null;
  votes: StoryVote[];
}

interface StoryDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  finalEstimate: string | null;
  sortOrder: number;
  rounds: StoryRound[];
}

export function HistoryDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<RoomAnalytics | null>(null);
  const [stories, setStories] = useState<StoryDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    Promise.all([
      api.get(`/analytics/rooms/${roomId}`),
      api.get(`/analytics/rooms/${roomId}/stories`),
    ])
      .then(([analyticsRes, storiesRes]) => {
        setAnalytics(analyticsRes.data);
        setStories(storiesRes.data.stories);
      })
      .catch(() => setError("Failed to load session details"))
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="mx-auto max-w-4xl p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to History
        </Button>
        <p className="text-muted-foreground">{error ?? "Session not found"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{analytics.roomName}</h1>
        <Badge variant="secondary">Completed</Badge>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{analytics.totalParticipants}</div>
            <div className="text-xs text-muted-foreground">Participants</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{analytics.totalStories}</div>
            <div className="text-xs text-muted-foreground">Stories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{analytics.completedStories}</div>
            <div className="text-xs text-muted-foreground">Estimated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Hash className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{analytics.totalRounds}</div>
            <div className="text-xs text-muted-foreground">Rounds</div>
          </CardContent>
        </Card>
      </div>

      {/* Stories */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Stories</h2>
        {stories.length === 0 ? (
          <p className="text-muted-foreground">No stories in this session.</p>
        ) : (
          stories.map((story) => (
            <Card key={story.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{story.title}</h3>
                  {story.finalEstimate ? (
                    <Badge>{story.finalEstimate}</Badge>
                  ) : (
                    <Badge variant="outline">No estimate</Badge>
                  )}
                </div>

                {story.rounds.map((round) => (
                  <div key={round.id} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Round {round.roundNum}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {round.votes.map((vote) => (
                        <div
                          key={vote.id}
                          className="flex items-center justify-between rounded-md bg-secondary px-3 py-2"
                        >
                          <span className="text-sm truncate">
                            {vote.user.displayName}
                          </span>
                          <span className="ml-2 font-bold text-primary">
                            {vote.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
