import { PlaybackCommand } from "@/types";
import { KaraokeSessionManager } from "@/services/session";

export function handlePlaybackCommand(
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
