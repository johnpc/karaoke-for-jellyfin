import { PlaybackState } from "@/types";

export interface AudioEventHandlers {
  onTimeUpdate: (currentTime: number) => void;
  onSongEnded: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function setupAudioEventListeners(
  audio: HTMLAudioElement,
  handlers: AudioEventHandlers,
  lastSeekTimeRef: React.MutableRefObject<number>
): () => void {
  const handleTimeUpdate = () => {
    const currentTime = audio.currentTime;
    if (Math.abs(currentTime - lastSeekTimeRef.current) > 0.5) {
      handlers.onTimeUpdate(currentTime);
    }
  };

  const handleEnded = () => {
    console.log("Song ended");
    handlers.onSongEnded();
  };

  const handlePlay = () => {
    console.log("Audio play event");
    handlers.setError(null);
  };

  const handlePause = () => {
    console.log("Audio pause event");
  };

  const handleError = (e: Event) => {
    console.error("Audio playback error:", e);
    handlers.setError("Playback error occurred");
  };

  let timeUpdateThrottle: NodeJS.Timeout;
  const throttledTimeUpdate = () => {
    clearTimeout(timeUpdateThrottle);
    timeUpdateThrottle = setTimeout(handleTimeUpdate, 250);
  };

  audio.addEventListener("timeupdate", throttledTimeUpdate);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("play", handlePlay);
  audio.addEventListener("pause", handlePause);
  audio.addEventListener("error", handleError);

  return () => {
    clearTimeout(timeUpdateThrottle);
    audio.removeEventListener("timeupdate", throttledTimeUpdate);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("play", handlePlay);
    audio.removeEventListener("pause", handlePause);
    audio.removeEventListener("error", handleError);
  };
}

export function syncPlaybackState(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  isLoading: boolean,
  lastSeekTimeRef: React.MutableRefObject<number>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): void {
  syncPlayPause(audio, playbackState, isLoading, setError);
  syncMuteAndVolume(audio, playbackState);
  syncSeekPosition(audio, playbackState, lastSeekTimeRef);
  syncPlaybackRate(audio, playbackState);
}

export function syncPlayPause(
  audio: HTMLAudioElement,
  playbackState: PlaybackState,
  isLoading: boolean,
  setError: React.Dispatch<React.SetStateAction<string | null>>
): void {
  if (playbackState.isPlaying && audio.paused && !isLoading) {
    if (audio.readyState >= 2) {
      audio.play().catch(err => {
        console.error("Play failed:", err);
        setError(`Play failed: ${err.message}`);
      });
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
