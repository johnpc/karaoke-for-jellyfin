import { PlaybackCommand } from "@/types";

const HOST_USER_ID = "tv-host";

export function createHostPlayPauseCommand(
  isPlaying: boolean
): PlaybackCommand {
  return {
    action: isPlaying ? "pause" : "play",
    userId: HOST_USER_ID,
    timestamp: new Date(),
  };
}

export function createHostVolumeCommand(volume: number): PlaybackCommand {
  return {
    action: "volume",
    value: Math.max(0, Math.min(100, volume)),
    userId: HOST_USER_ID,
    timestamp: new Date(),
  };
}

export function createHostMuteCommand(): PlaybackCommand {
  return { action: "mute", userId: HOST_USER_ID, timestamp: new Date() };
}

export function createHostSeekCommand(seconds: number): PlaybackCommand {
  return {
    action: "seek",
    value: Math.max(0, seconds),
    userId: HOST_USER_ID,
    timestamp: new Date(),
  };
}

export function createHostStopCommand(): PlaybackCommand {
  return { action: "stop", userId: HOST_USER_ID, timestamp: new Date() };
}
