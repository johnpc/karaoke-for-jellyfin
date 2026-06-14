import { KaraokeSessionManager } from "@/services/session";
import { MediaItem } from "@/types";
import { KaraokeSocket, ConnectionContext } from "./types";

export function handleJoinSession(
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

export function handleAddSong(
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

export function handleRemoveSong(
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
