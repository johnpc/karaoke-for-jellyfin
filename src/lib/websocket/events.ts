import { Server as SocketIOServer } from "socket.io";
import { KaraokeSessionManager } from "@/services/session";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

export function setupSessionEventListeners(
  sessionManager: KaraokeSessionManager,
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
): void {
  sessionManager.on("session-created", (session: unknown) => {
    io.emit("session-updated", session);
  });

  sessionManager.on("user-joined", (user: unknown) => {
    io.emit("user-joined", user);
  });

  sessionManager.on("user-left", (data: unknown) => {
    io.emit("user-left", data as { userId: string });
  });

  sessionManager.on("queue-updated", (queue: unknown) => {
    io.emit("queue-updated", queue as unknown[]);
  });

  sessionManager.on("song-started", (song: unknown) => {
    io.emit("song-started", song);
  });

  sessionManager.on("song-ended", (song: unknown) => {
    io.emit("song-ended", song);
  });

  sessionManager.on("playback-state-changed", (state: unknown) => {
    io.emit("playback-state-changed", state);
  });
}
