// Wires the TV display's <audio> element events back into the player hook.

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
