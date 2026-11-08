import { PlaybackState } from "@/types";
import { handlePlayFailure, PlayFailureHandlers } from "./audioPlaybackPolicy";

export interface PlaybackSyncOptions {
  isLoading: boolean;
  /** True once the browser has rejected play() for lack of a user gesture. */
  autoplayBlocked: boolean;
  lastSeekTimeRef: React.MutableRefObject<number>;
  playFailure: PlayFailureHandlers;
}

export function syncPlaybackState(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  options: PlaybackSyncOptions
): void {
  syncPlayPause(audio, playbackState, options);
  syncMuteAndVolume(audio, playbackState);
  syncSeekPosition(audio, playbackState, options.lastSeekTimeRef);
  syncPlaybackRate(audio, playbackState);
}

export function syncPlayPause(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  { isLoading, autoplayBlocked, playFailure }: PlaybackSyncOptions
): void {
  if (playbackState.isPlaying && audio.paused && !isLoading) {
    // Once the browser has refused to autoplay, retrying on every state
    // update just produces more rejections; wait for the user's tap instead.
    if (autoplayBlocked) return;
    if (audio.readyState >= 2) {
      audio
        .play()
        .catch(err => handlePlayFailure(err, "Play failed", playFailure));
    }
  } else if (!playbackState.isPlaying && !audio.paused) {
    audio.pause();
  }
}

export function syncMuteAndVolume(
  audio: HTMLAudioElement,
  playbackState: PlaybackState
): void {
  if (playbackState.isMuted !== undefined) {
    audio.muted = playbackState.isMuted;
  }

  if (playbackState.volume !== undefined && !playbackState.isMuted) {
    const volume = Math.max(0, Math.min(1, playbackState.volume / 100));
    if (audio.volume !== volume) {
      audio.volume = volume;
    }
  }
}

export function syncSeekPosition(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  lastSeekTimeRef: React.MutableRefObject<number>
): void {
  if (
    playbackState.currentTime !== undefined &&
    isFinite(playbackState.currentTime) &&
    playbackState.currentTime >= 0
  ) {
    const timeDiff = Math.abs(audio.currentTime - playbackState.currentTime);
    const lastSeekDiff = Math.abs(
      lastSeekTimeRef.current - playbackState.currentTime
    );
    if (timeDiff > 2 && lastSeekDiff > 0.1) {
      console.log("Seeking to:", playbackState.currentTime);
      lastSeekTimeRef.current = playbackState.currentTime;
      audio.currentTime = playbackState.currentTime;
    }
  }
}

export function syncPlaybackRate(
  audio: HTMLAudioElement,
  playbackState: PlaybackState
): void {
  if (
    playbackState.playbackRate !== undefined &&
    isFinite(playbackState.playbackRate) &&
    playbackState.playbackRate > 0 &&
    playbackState.playbackRate <= 4
  ) {
    audio.playbackRate = playbackState.playbackRate;
  }
}
