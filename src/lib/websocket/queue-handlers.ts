import { Server as SocketIOServer } from "socket.io";
import { PlaybackCommand } from "@/types";
import { KaraokeSessionManager } from "@/services/session";
import {
  KaraokeSocket,
  ConnectionContext,
  ServerToClientEvents,
  ClientToServerEvents,
} from "./types";
import { handlePlaybackCommand } from "./playback";

export function handleReorderQueue(
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

export function handlePlaybackControl(
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

export function handleSkipSong(
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

export async function handleLyricsSync(
  socket: KaraokeSocket,
  sessionManager: KaraokeSessionManager,
  ctx: ConnectionContext,
  data: { songId: string; currentTime: number },
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined
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
