import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "@/stores/roomStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight, Users, FileText } from "lucide-react";

export function DashboardPage() {
  const { rooms, fetchRooms, createRoom, joinRoom, isLoading } =
    useRoomStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    try {
      const room = await createRoom(roomName.trim(), "fibonacci");
      navigate(`/room/${room.id}`);
    } catch {
      setError("Failed to create room");
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const room = await joinRoom(joinCode.trim().toUpperCase());
      navigate(`/room/${room.id}`);
    } catch {
      setError("Room not found or invalid code");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          New Room
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Create Room */}
        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Room</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  placeholder="Room name (e.g. Sprint 42)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Create Room
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Join Room */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex gap-2">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="uppercase tracking-widest"
                required
              />
              <Button type="submit">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Room list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Rooms</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">No rooms yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a room to start your first planning session.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rooms.map((room: any) => (
              <Card
                key={room.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
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
                  </div>
                  <Badge variant={room.status === "active" ? "success" : "secondary"}>
                    {room.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
