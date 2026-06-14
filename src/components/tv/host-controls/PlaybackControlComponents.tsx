"use client";

import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/outline";

export interface PlaybackControlsProps {
  isPlaying: boolean;
  isDisabled: boolean;
  hasCurrentSong: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: () => void;
}

export function PlaybackControls({
  isPlaying,
  isDisabled,
  hasCurrentSong,
  currentTime,
  onPlayPause,
  onSeek,
  onSkip,
}: PlaybackControlsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Playback Controls
      </h3>
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={() => onSeek(currentTime - 10)}
          className="flex items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          disabled={!hasCurrentSong}
          title="Rewind 10s"
        >
          <BackwardIcon className="w-6 h-6 text-white" />
        </button>

        <button
          data-testid="tv-play-pause"
          onClick={onPlayPause}
          className="flex items-center justify-center w-16 h-16 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          disabled={isDisabled}
          title={isDisabled ? "No songs in queue" : ""}
        >
          {isPlaying ? (
            <PauseIcon className="w-8 h-8 text-white" />
          ) : (
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          )}
        </button>

        <button
          data-testid="tv-skip"
          onClick={onSkip}
          className="flex items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
          disabled={!hasCurrentSong}
          title="Skip Song"
        >
          <ForwardIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            isPlaying
              ? "bg-green-900 text-green-300"
              : "bg-yellow-900 text-yellow-300"
          }`}
        >
          {isPlaying ? "Playing" : "Paused"}
        </div>
      </div>
    </div>
  );
}

export interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onMute,
}: VolumeControlProps) {
  return (
    <div data-testid="tv-volume">
      <h3 className="text-lg font-semibold text-white mb-4">Volume Control</h3>
      <div className="flex items-center space-x-4">
        <button
          onClick={onMute}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="w-6 h-6 text-red-400" />
          ) : (
            <SpeakerWaveIcon className="w-6 h-6 text-gray-400" />
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={e => onVolumeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${volume}%, #374151 ${volume}%, #374151 100%)`,
            }}
          />
        </div>

        <div className="text-white font-medium w-12 text-center">{volume}%</div>
      </div>
    </div>
  );
}
