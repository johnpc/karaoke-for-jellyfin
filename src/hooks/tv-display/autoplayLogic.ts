import { QueueItem } from "@/types";
import { AutoplayConditions, FallbackAutoplayConditions } from "./types";

export function shouldTriggerAutoplay(conditions: AutoplayConditions): boolean {
  const {
    currentSong,
    isConnected,
    playbackState,
    hasTriggeredAutoPlay,
    displayState,
  } = conditions;
  return !!(
    currentSong &&
    isConnected &&
    playbackState &&
    !playbackState.isPlaying &&
    !hasTriggeredAutoPlay &&
    displayState === "playing"
  );
}

export function shouldTriggerFallbackAutoplay(
  conditions: FallbackAutoplayConditions
): QueueItem | null {
  const {
    currentSong,
    queue,
    isConnected,
    session,
    autoplayCountdown,
    autoplayTriggered,
  } = conditions;
  if (
    !currentSong &&
    queue.length > 0 &&
    isConnected &&
    session &&
    autoplayCountdown === null &&
    !autoplayTriggered
  ) {
    return queue.find(song => song.status === "pending") || null;
  }
  return null;
}
