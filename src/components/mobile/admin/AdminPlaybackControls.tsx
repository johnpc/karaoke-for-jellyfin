"use client";

import { QueueItem, PlaybackState, PlaybackCommand } from "@/types";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";

interface AdminPlaybackControlsProps {
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  pendingQueueLength: number;
  onSkip: () => void;
  onPlaybackControl: (command: PlaybackCommand) => void;
}

export function AdminPlaybackControls({
  currentSong,
  playbackState,
  pendingQueueLength,
  onSkip,
  onPlaybackControl,
}: AdminPlaybackControlsProps) {
  const handlePlayPause = () => {
    if (playbackState) {
      onPlaybackControl({
        action: playbackState.isPlaying ? "pause" : "play",
        userId: "mobile-admin",
        timestamp: new Date(),
      });
    }
  };

  const handleVolumeChange = (volume: number) => {
    onPlaybackControl({
      action: "volume",
      value: Math.max(0, Math.min(100, volume)),
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const handleMute = () => {
    onPlaybackControl({
      action: "mute",
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const handleSeek = (seconds: number) => {
    onPlaybackControl({
      action: "seek",
      value: Math.max(0, seconds),
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  return (
    <div
      data-testid="playback-controls"
      className="bg-white rounded-lg p-4 shadow-sm border"
    >
      <h3 className="text-sm font-medium text-gray-500 mb-4">Controls</h3>

      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={() => handleSeek((playbackState?.currentTime || 0) - 10)}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          disabled={!currentSong}
        >
          <BackwardIcon className="w-5 h-5 text-gray-700" />
        </button>
        <button
          data-testid="play-pause-button"
          onClick={handlePlayPause}
          className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:bg-gray-300"
          disabled={!currentSong && pendingQueueLength === 0}
        >
          {playbackState?.isPlaying ? (
            <PauseIcon className="w-6 h-6 text-white" />
          ) : (
            <PlayIcon className="w-6 h-6 text-white ml-0.5" />
          )}
        </button>
        <button
          data-testid="skip-button"
          onClick={onSkip}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          disabled={!currentSong}
        >
          <ForwardIcon className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div data-testid="playback-status" className="text-center mb-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            playbackState?.isPlaying
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {playbackState?.isPlaying ? "Playing" : "Paused"}
        </span>
      </div>

      {currentSong && (
        <div data-testid="seek-control" className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {Math.floor((playbackState?.currentTime || 0) / 60)}:
              {String(
                Math.floor((playbackState?.currentTime || 0) % 60)
              ).padStart(2, "0")}
            </span>
            <span>
              {Math.floor(currentSong.mediaItem.duration / 60)}:
              {String(currentSong.mediaItem.duration % 60).padStart(2, "0")}
            </span>
          </div>
          <input
            data-testid="seek-slider"
            type="range"
            min="0"
            max={currentSong.mediaItem.duration}
            value={playbackState?.currentTime || 0}
            onChange={e => handleSeek(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button data-testid="mute-button" onClick={handleMute} className="p-1">
          {playbackState?.isMuted ? (
            <SpeakerXMarkIcon className="w-5 h-5 text-red-500" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <div className="flex-1">
          <input
            data-testid="volume-slider"
            type="range"
            min="0"
            max="100"
            value={playbackState?.volume || 80}
            onChange={e => handleVolumeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <span className="text-sm text-gray-600 w-10 text-right">
          {playbackState?.volume || 80}%
        </span>
      </div>
    </div>
  );
}
