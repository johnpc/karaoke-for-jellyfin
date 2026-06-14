import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { getSessionManager, KaraokeSessionManager } from "@/services/session";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  KaraokeSocket,
  ConnectionContext,
} from "./types";
import {
  handleJoinSession,
  handleAddSong,
  handleRemoveSong,
} from "./session-handlers";
import {
  handleReorderQueue,
  handlePlaybackControl,
  handleSkipSong,
  handleLyricsSync,
} from "./queue-handlers";
import { setupSessionEventListeners } from "./events";

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined;

function handleConnection(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager
): void {
  console.log("Client connected:", socket.id);

  const ctx: ConnectionContext = {
    currentUserId: null,
    currentSessionId: null,
  };

  socket.on("join-session", data =>
    handleJoinSession(socket, sessionManager, ctx, data)
  );

  socket.on("add-song", data =>
    handleAddSong(socket, sessionManager, ctx, data)
  );

  socket.on("remove-song", data =>
    handleRemoveSong(socket, sessionManager, ctx, data)
  );

  socket.on("reorder-queue", data =>
    handleReorderQueue(socket, sessionManager, ctx, data)
  );

  socket.on("playback-control", command =>
    handlePlaybackControl(socket, sessionManager, ctx, command)
  );

  socket.on("skip-song", () => handleSkipSong(socket, sessionManager, ctx));

  socket.on("lyrics-sync", data =>
    handleLyricsSync(socket, sessionManager, ctx, data, io)
  );

  socket.on("user-heartbeat", () => {
    if (ctx.currentUserId) {
      sessionManager.updateUserSocketId(ctx.currentUserId, socket.id);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    if (ctx.currentUserId) {
      try {
        sessionManager.removeUser(ctx.currentUserId);
      } catch (error) {
        console.error("Error removing user on disconnect:", error);
      }
    }
  });
}

export const initializeWebSocket = (server: HTTPServer) => {
  if (!io) {
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
      server,
      {
        cors: {
          origin:
            process.env.NODE_ENV === "development"
              ? ["http://localhost:3000", "http://localhost:3003"]
              : false,
          methods: ["GET", "POST"],
        },
      }
    );

    const sessionManager = getSessionManager();

    setupSessionEventListeners(sessionManager, io);

    io.on("connection", socket => handleConnection(socket, sessionManager));
  }

  return io;
};

export const getWebSocketServer = () => {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
};

export const broadcastToSession = (
  sessionId: string,
  event: string,
  data: unknown
) => {
  if (io) {
    io.to(sessionId).emit(event as keyof ServerToClientEvents, data as never);
  }
};

export const broadcastToAll = (event: string, data: unknown) => {
  if (io) {
    io.emit(event as keyof ServerToClientEvents, data as never);
  }
};
