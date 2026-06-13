"use client";

import { QueueItem, PlaybackState, KaraokeSession } from "@/types";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface NowPlayingInfoProps {
  currentSong: QueueItem;
}

function NowPlayingInfo({ currentSong }: NowPlayingInfoProps) {
  return (
    <div className="p-4 bg-purple-900 bg-opacity-30 rounded-lg border border-purple-700">
      <h3 className="text-lg font-semibold text-white mb-2">
        Currently Playing
      </h3>
      <div className="text-gray-300">
        <p className="font-medium">{currentSong.mediaItem.title}</p>
        <p>{currentSong.mediaItem.artist}</p>
        <div className="flex items-center mt-1 text-sm text-gray-400">
          <UserIcon className="w-3 h-3 mr-1" />
          Added by {currentSong.addedBy}
        </div>
      </div>
    </div>
  );
}

interface EmptyQueueWarningProps {
  session: KaraokeSession | null;
  pendingQueueLength: number;
}

function EmptyQueueWarning({
  session,
  pendingQueueLength,
}: EmptyQueueWarningProps) {
  return (
    <div className="p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700 mb-6">
      <h3 className="text-lg font-semibold text-yellow-300 mb-2">
        No Songs in Queue
      </h3>
      <p className="text-yellow-200 text-sm mb-3">
        Add songs to the queue using the mobile interface to start playback. Go
        to the main page, search for songs, and add them to the queue.
      </p>
      <div className="text-xs text-yellow-400">
        Debug: Session={session ? "Active" : "None"}, Queue=
        {session?.queue?.length || 0}, Pending={pendingQueueLength}
      </div>
    </div>
  );
}

interface PlaybackControlsProps {
  isPlaying: boolean;
  isDisabled: boolean;
  hasCurrentSong: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: () => void;
}

function PlaybackControls({
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

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

function SeekBar({ currentTime, duration, onSeek }: SeekBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <span data-testid="current-time">
          {Math.floor(currentTime / 60)}:
          {String(Math.floor(currentTime % 60)).padStart(2, "0")}
        </span>
        <span data-testid="total-duration">
          {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
        </span>
      </div>
      <input
        data-testid="progress-bar"
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={e => onSeek(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
}

function VolumeControl({
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

interface PlaybackTabProps {
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  pendingQueue: QueueItem[];
  session: KaraokeSession | null;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onSkip: () => void;
}

export function PlaybackTab({
  currentSong,
  playbackState,
  pendingQueue,
  session,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onSkip,
}: PlaybackTabProps) {
  const isPlaying = playbackState?.isPlaying ?? false;
  const currentTime = playbackState?.currentTime ?? 0;
  const volume = playbackState?.volume ?? 80;
  const isMuted = playbackState?.isMuted ?? false;
  const isDisabled = pendingQueue.length === 0 && !currentSong;

  return (
    <div className="space-y-6">
      {currentSong && <NowPlayingInfo currentSong={currentSong} />}

      {isDisabled && (
        <EmptyQueueWarning
          session={session}
          pendingQueueLength={pendingQueue.length}
        />
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        isDisabled={isDisabled}
        hasCurrentSong={!!currentSong}
        currentTime={currentTime}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onSkip={onSkip}
      />

      {currentSong && (
        <SeekBar
          currentTime={currentTime}
          duration={currentSong.mediaItem.duration}
          onSeek={onSeek}
        />
      )}

      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={onVolumeChange}
        onMute={onMute}
      />
    </div>
  );
}
