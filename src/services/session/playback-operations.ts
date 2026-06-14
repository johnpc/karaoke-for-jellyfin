import { PlaybackState, QueueItem, QueueOperationResult } from "@/types";
import { SessionCore } from "./session-core";
import {
  startNextSong as doStartNextSong,
  endCurrentSong as doEndCurrentSong,
  skipCurrentSong as doSkipCurrentSong,
  updatePlaybackState as doUpdatePlaybackState,
} from "./playback";

export function startNextSong(core: SessionCore): QueueItem | null {
  if (!core.session || core.songTransitionInProgress) return null;
  core.songTransitionInProgress = true;
  try {
    const result = doStartNextSong(core.session, core);
    if (result) core.updateSessionActivity();
    return result;
  } finally {
    core.songTransitionInProgress = false;
  }
}

export function endCurrentSong(core: SessionCore): void {
  if (!core.session?.currentSong || core.songTransitionInProgress) return;
  core.songTransitionInProgress = true;
  try {
    doEndCurrentSong(core.session, core, () => {
      if (!core.songTransitionInProgress) startNextSong(core);
    });
    core.updateSessionActivity();
  } finally {
    core.songTransitionInProgress = false;
  }
}

export function skipCurrentSong(
  core: SessionCore,
  userId: string
): QueueOperationResult {
  if (!core.session) return { success: false, message: "No active session" };
  if (!core.session.currentSong)
    return { success: false, message: "No song currently playing" };
  if (core.skipInProgress)
    return { success: false, message: "Skip already in progress" };
  if (core.songTransitionInProgress)
    return { success: false, message: "Song transition in progress" };
  core.skipInProgress = true;
  core.songTransitionInProgress = true;
  try {
    if (!core.session.currentSong)
      return { success: false, message: "No song currently playing" };
    const result = doSkipCurrentSong(core.session, userId, core, () => {
      if (!core.songTransitionInProgress) startNextSong(core);
    });
    if (result.success) core.updateSessionActivity();
    return result;
  } finally {
    core.skipInProgress = false;
    core.songTransitionInProgress = false;
  }
}

export function updatePlaybackState(
  core: SessionCore,
  updates: Partial<PlaybackState>
): void {
  if (!core.session) return;
  doUpdatePlaybackState(core.session, updates, core);
  core.updateSessionActivity();
}

export function getPlaybackState(core: SessionCore): PlaybackState | null {
  return core.session?.playbackState || null;
}
