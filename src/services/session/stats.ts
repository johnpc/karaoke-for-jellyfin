// Session statistics and cleanup utilities
import { KaraokeSession } from "@/types";
import { SessionEventEmitter } from "./event-emitter";
import { SessionStats } from "./types";

export function getSessionStats(session: KaraokeSession): SessionStats {
  return {
    sessionId: session.id,
    sessionName: session.name,
    connectedUsers: session.connectedUsers.length,
    totalSongs: session.queue.length,
    pendingSongs: session.queue.filter(i => i.status === "pending").length,
    playingSongs: session.queue.filter(i => i.status === "playing").length,
    currentSong: session.currentSong,
    isPlaying: session.playbackState.isPlaying,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
  };
}

export function cleanupQueue(
  session: KaraokeSession,
  emitter: SessionEventEmitter
): void {
  const initialLength = session.queue.length;
  session.queue = session.queue.map((item, index) => ({
    ...item,
    position: index,
  }));
  if (session.queue.length !== initialLength) {
    emitter.emit("queue-updated", session.queue);
  }
}
