// WebSocket server setup for real-time communication
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { getSessionManager } from "@/services/session";
import { KaraokeSessionManager } from "@/services/session";
import {
  WebSocketMessage,
  PlaybackCommand,
  MediaItem,
  WebSocketMessageType,
} from "@/types";

let io: SocketIOServer | undefined;

interface ClientToServerEvents {
  "join-session": (data: { sessionId: string; userName: string }) => void;
  "add-song": (data: { mediaItem: MediaItem; position?: number }) => void;
  "remove-song": (data: { queueItemId: string }) => void;
  "reorder-queue": (data: { queueItemId: string; newPosition: number }) => void;
  "playback-control": (command: PlaybackCommand) => void;
  "skip-song": () => void;
  "user-heartbeat": () => void;
  "lyrics-sync": (data: { songId: string; currentTime: number }) => void;
}

interface ServerToClientEvents {
  "session-updated": (session: any) => void;
  "queue-updated": (queue: any[]) => void;
  "song-started": (song: any) => void;
  "song-ended": (song: any) => void;
  "user-joined": (user: any) => void;
  "user-left": (data: { userId: string }) => void;
  "playback-state-changed": (state: any) => void;
  error: (error: { code: string; message: string }) => void;
  "lyrics-sync": (data: { currentLine: number; timestamp: number }) => void;
}

type KaraokeSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface ConnectionContext {
  currentUserId: string | null;
  currentSessionId: string | null;
}

function handlePlaybackCommand(
  command: PlaybackCommand,
  sessionManager: KaraokeSessionManager
): void {
  console.log("Processing playback command:", command);
  console.log("Action type:", typeof command.action);
  console.log("Action value:", JSON.stringify(command.action));
  console.log(
    "Action === 'lyrics-offset':",
    command.action === "lyrics-offset"
  );

  switch (command.action) {
    case "lyrics-offset":
      console.log("Processing lyrics-offset command:", command);
      if (command.value !== undefined) {
        const clampedOffset = Math.max(-10, Math.min(10, command.value));
        console.log("Setting lyrics offset to:", clampedOffset);
        sessionManager.updatePlaybackState({ lyricsOffset: clampedOffset });
        console.log(
          "Updated playback state:",
          sessionManager.getPlaybackState()
        );
      }
      break;
    case "play": {
      const currentSong = sessionManager.getCurrentSong();
      console.log("Current song:", currentSong);
      if (!currentSong) {
        console.log("No current song, starting next song...");
        const nextSong = sessionManager.startNextSong();
        console.log("Started next song:", nextSong);
      } else {
        console.log("Resuming current song");
        sessionManager.updatePlaybackState({ isPlaying: true });
      }
      break;
    }
    case "pause":
      sessionManager.updatePlaybackState({ isPlaying: false });
      break;
    case "volume":
      if (command.value !== undefined) {
        sessionManager.updatePlaybackState({ volume: command.value });
      }
      break;
    case "seek":
      if (command.value !== undefined) {
        sessionManager.updatePlaybackState({ currentTime: command.value });
      }
      break;
    case "mute": {
      const currentState = sessionManager.getPlaybackState();
      sessionManager.updatePlaybackState({
        isMuted: !currentState?.isMuted,
      });
      break;
    }
    default:
      console.log("Unknown playback action:", command.action);
      break;
  }
}

function handleJoinSession(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { sessionId: string; userName: string }
): void {
  const { sessionId, userName } = data;
  try {
    console.log(
      `Client ${socket.id} attempting to join session with name: ${userName}`
    );

    let session = sessionManager.getSession();
    if (!session) {
      session = sessionManager.createSession("Karaoke Session", userName);
      ctx.currentUserId = session.connectedUsers[0].id;
    } else {
      const user = sessionManager.addUser(userName, socket.id);
      ctx.currentUserId = user.id;
    }

    ctx.currentSessionId = session.id;
    socket.join(sessionId);

    if (ctx.currentUserId) {
      sessionManager.updateUserSocketId(ctx.currentUserId, socket.id);
    }

    socket.emit("session-updated", {
      session: sessionManager.getSession(),
      queue: sessionManager.getQueue(),
      currentSong: sessionManager.getCurrentSong(),
      playbackState: sessionManager.getPlaybackState(),
    });

    console.log(
      `Client ${socket.id} joined session ${sessionId} as user ${userName}`
    );
  } catch (error) {
    console.error("Error joining session:", error);
    socket.emit("error", {
      code: "JOIN_SESSION_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to join session",
    });
  }
}

function handleAddSong(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { mediaItem: MediaItem; position?: number }
): void {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    const result = sessionManager.addSongToQueue(
      data.mediaItem,
      ctx.currentUserId,
      data.position
    );
    if (!result.success) {
      socket.emit("error", {
        code: "ADD_SONG_FAILED",
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error adding song:", error);
    socket.emit("error", {
      code: "ADD_SONG_FAILED",
      message: error instanceof Error ? error.message : "Failed to add song",
    });
  }
}

function handleRemoveSong(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { queueItemId: string }
): void {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    const result = sessionManager.removeSongFromQueue(
      data.queueItemId,
      ctx.currentUserId
    );
    if (!result.success) {
      socket.emit("error", {
        code: "REMOVE_SONG_FAILED",
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error removing song:", error);
    socket.emit("error", {
      code: "REMOVE_SONG_FAILED",
      message: error instanceof Error ? error.message : "Failed to remove song",
    });
  }
}

function handleReorderQueue(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { queueItemId: string; newPosition: number }
): void {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    const result = sessionManager.reorderQueue(
      data.queueItemId,
      data.newPosition,
      ctx.currentUserId
    );
    if (!result.success) {
      socket.emit("error", {
        code: "REORDER_FAILED",
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error reordering queue:", error);
    socket.emit("error", {
      code: "REORDER_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to reorder queue",
    });
  }
}

function handlePlaybackControl(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  command: PlaybackCommand
): void {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    handlePlaybackCommand(command, sessionManager);
  } catch (error) {
    console.error("Error handling playback control:", error);
    socket.emit("error", {
      code: "PLAYBACK_CONTROL_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to control playback",
    });
  }
}

function handleSkipSong(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext
): void {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    const result = sessionManager.skipCurrentSong(ctx.currentUserId);
    if (!result.success) {
      socket.emit("error", {
        code: "SKIP_FAILED",
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error skipping song:", error);
    socket.emit("error", {
      code: "SKIP_FAILED",
      message: error instanceof Error ? error.message : "Failed to skip song",
    });
  }
}

async function handleLyricsSync(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { songId: string; currentTime: number }
): Promise<void> {
  if (!ctx.currentUserId) {
    socket.emit("error", {
      code: "NOT_IN_SESSION",
      message: "You must join a session first",
    });
    return;
  }

  try {
    const { getLyricsService } = await import("@/services/lyrics");
    const lyricsService = getLyricsService();

    const syncState = lyricsService.updateSyncState(
      data.songId,
      data.currentTime
    );

    if (syncState && ctx.currentSessionId) {
      io?.to(ctx.currentSessionId).emit("lyrics-sync", {
        currentLine: syncState.currentLine,
        timestamp: syncState.currentTimestamp,
        songId: data.songId,
        syncState,
      });
    }
  } catch (error) {
    console.error("Error syncing lyrics:", error);
    socket.emit("error", {
      code: "LYRICS_SYNC_FAILED",
      message: error instanceof Error ? error.message : "Failed to sync lyrics",
    });
  }
}

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
    handleLyricsSync(socket, sessionManager, ctx, data)
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

    setupSessionEventListeners(sessionManager);

    io.on("connection", socket => handleConnection(socket, sessionManager));
  }

  return io;
};

function setupSessionEventListeners(sessionManager: any) {
  sessionManager.on("session-created", (session: any) => {
    if (io) {
      io.emit("session-updated", session);
    }
  });

  sessionManager.on("user-joined", (user: any) => {
    if (io) {
      io.emit("user-joined", user);
    }
  });

  sessionManager.on("user-left", (data: any) => {
    if (io) {
      io.emit("user-left", data);
    }
  });

  sessionManager.on("queue-updated", (queue: any) => {
    if (io) {
      io.emit("queue-updated", queue);
    }
  });

  sessionManager.on("song-started", (song: any) => {
    if (io) {
      io.emit("song-started", song);
    }
  });

  sessionManager.on("song-ended", (song: any) => {
    if (io) {
      io.emit("song-ended", song);
    }
  });

  sessionManager.on("playback-state-changed", (state: any) => {
    if (io) {
      io.emit("playback-state-changed", state);
    }
  });
}

export const getWebSocketServer = () => {
  if (!io) {
    throw new Error("WebSocket server not initialized");
  }
  return io;
};

export const broadcastToSession = (
  sessionId: string,
  event: string,
  data: any
) => {
  if (io) {
    io.to(sessionId).emit(event, data);
  }
};

export const broadcastToAll = (event: string, data: unknown) => {
  if (io) {
    io.emit(event, data);
  }
};
