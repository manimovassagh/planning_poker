import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Room } from "@planning-poker/shared";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Users, FileText } from "lucide-react";

type HistoryRoom = Room & { _count?: { participants: number; stories: number } };

export function HistoryPage() {
  const [rooms, setRooms] = useState<HistoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/analytics/user/history")
      .then(({ data }) => setRooms(data.rooms))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Session History</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="text-muted-foreground">
          No completed sessions yet.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/history/${room.id}`)}
            >
              <CardContent className="p-4">
                <h3 className="font-medium">{room.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room._count?.participants ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {room._count?.stories ?? 0} stories
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
