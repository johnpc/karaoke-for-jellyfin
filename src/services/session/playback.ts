// Playback state management
import {
  KaraokeSession,
  QueueItem,
  QueueOperationResult,
  QueueItemStatus,
  PlaybackState,
} from "@/types";
import {
  getNextSong,
  markSongAsPlaying,
  markSongAsCompleted,
} from "@/lib/utils";
import { SessionEventEmitter } from "./event-emitter";

function cleanCompletedFromQueue(session: KaraokeSession): void {
  session.queue = session.queue.filter(
    item => item.status !== "completed" && item.status !== "skipped"
  );
  session.queue = session.queue.map((item, index) => ({
    ...item,
    position: index,
  }));
}

function stopPlayback(session: KaraokeSession): void {
  session.currentSong = null;
  session.playbackState = {
    ...session.playbackState,
    isPlaying: false,
    currentTime: 0,
  };
}

export function startNextSong(
  session: KaraokeSession,
  emitter: SessionEventEmitter
): QueueItem | null {
  const nextSong = getNextSong(session.queue);
  if (!nextSong) return null;

  if (session.currentSong) {
    session.queue = markSongAsCompleted(session.queue, session.currentSong.id);
  }

  session.queue = markSongAsPlaying(session.queue, nextSong.id);
  const updatedSong = session.queue.find(item => item.id === nextSong.id)!;
  session.currentSong = updatedSong;

  session.playbackState = {
    ...session.playbackState,
    isPlaying: true,
    currentTime: 0,
  };

  emitter.emit("song-started", updatedSong);
  emitter.emit("queue-updated", session.queue);
  emitter.emit("playback-state-changed", session.playbackState);

  return updatedSong;
}

export function endCurrentSong(
  session: KaraokeSession,
  emitter: SessionEventEmitter,
  startNextSongFn: () => void
): void {
  if (!session.currentSong) return;

  const completedSong = session.currentSong;
  session.queue = markSongAsCompleted(session.queue, completedSong.id);
  cleanCompletedFromQueue(session);
  stopPlayback(session);

  emitter.emit("song-ended", completedSong);
  emitter.emit("queue-updated", session.queue);
  emitter.emit("playback-state-changed", session.playbackState);

  if (session.hostControls.autoAdvance) {
    setTimeout(() => startNextSongFn(), 1000);
  }
}

export function skipCurrentSong(
  session: KaraokeSession,
  userId: string,
  emitter: SessionEventEmitter,
  startNextSongFn: () => void
): QueueOperationResult {
  if (!session.currentSong) {
    return { success: false, message: "No song currently playing" };
  }

  const user = session.connectedUsers.find(u => u.id === userId);
  const isHost = user?.isHost || false;
  const isOwner = session.currentSong.addedBy === userId;

  if (!isHost && !isOwner && !session.hostControls.allowUserSkip) {
    return { success: false, message: "You are not allowed to skip songs" };
  }

  const currentSongId = session.currentSong.id;
  session.queue = session.queue.map(item => ({
    ...item,
    status:
      item.id === currentSongId ? ("skipped" as QueueItemStatus) : item.status,
  }));

  cleanCompletedFromQueue(session);

  const skippedSong = session.currentSong;
  stopPlayback(session);

  emitter.emit("song-ended", skippedSong);
  emitter.emit("queue-updated", session.queue);
  emitter.emit("playback-state-changed", session.playbackState);

  setTimeout(() => startNextSongFn(), 300);

  return { success: true, message: "Song skipped" };
}

export function updatePlaybackState(
  session: KaraokeSession,
  updates: Partial<PlaybackState>,
  emitter: SessionEventEmitter
): void {
  session.playbackState = {
    ...session.playbackState,
    ...updates,
  };
  emitter.emit("playback-state-changed", session.playbackState);
}
