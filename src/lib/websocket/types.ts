import { Socket } from "socket.io";
import { PlaybackCommand, MediaItem } from "@/types";

export interface ClientToServerEvents {
  "join-session": (data: { sessionId: string; userName: string }) => void;
  "add-song": (data: { mediaItem: MediaItem; position?: number }) => void;
  "remove-song": (data: { queueItemId: string }) => void;
  "reorder-queue": (data: { queueItemId: string; newPosition: number }) => void;
  "playback-control": (command: PlaybackCommand) => void;
  "skip-song": () => void;
  "user-heartbeat": () => void;
  "lyrics-sync": (data: { songId: string; currentTime: number }) => void;
}

export interface ServerToClientEvents {
  "session-updated": (session: unknown) => void;
  "queue-updated": (queue: unknown[]) => void;
  "song-started": (song: unknown) => void;
  "song-ended": (song: unknown) => void;
  "user-joined": (user: unknown) => void;
  "user-left": (data: { userId: string }) => void;
  "playback-state-changed": (state: unknown) => void;
  error: (error: { code: string; message: string }) => void;
  "lyrics-sync": (data: {
    currentLine: number;
    timestamp: number;
    songId?: string;
    syncState?: unknown;
  }) => void;
}

export type KaraokeSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export interface ConnectionContext {
  currentUserId: string | null;
  currentSessionId: string | null;
}
