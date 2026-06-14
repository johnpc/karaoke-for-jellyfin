import { PlaybackCommand } from "@/types";

export function createPlayPauseCommand(
  isPlaying: boolean,
  userId: string
): PlaybackCommand {
  return {
    action: isPlaying ? "pause" : "play",
    userId,
    timestamp: new Date(),
  };
}

export function createVolumeCommand(
  volume: number,
  userId: string
): PlaybackCommand {
  return {
    action: "volume",
    value: Math.max(0, Math.min(100, volume)),
    userId,
    timestamp: new Date(),
  };
}

export function createMuteCommand(userId: string): PlaybackCommand {
  return { action: "mute", userId, timestamp: new Date() };
}

export function createSeekCommand(
  seconds: number,
  userId: string
): PlaybackCommand {
  return {
    action: "seek",
    value: Math.max(0, seconds),
    userId,
    timestamp: new Date(),
  };
}
