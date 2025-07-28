"use client";

import { useState } from "react";
import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { CacheStatus } from "@/components/CacheStatus";

interface MobileAdminInterfaceProps {
  session: KaraokeSession | null;
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  queue: QueueItem[];
  userName: string;
  isConnected: boolean;
  error: string | null;
  onSkip: () => void;
  onPlaybackControl: (command: PlaybackCommand) => void;
  onRemoveSong?: (queueItemId: string) => void;
  onReorderQueue?: (queueItemId: string, newPosition: number) => void;
}

export function MobileAdminInterface({
  session,
  currentSong,
  playbackState,
  queue,
  userName,
  isConnected,
  error,
  onSkip,
  onPlaybackControl,
  onRemoveSong,
  onReorderQueue,
}: MobileAdminInterfaceProps) {
  const [activeTab, setActiveTab] = useState<
    "playback" | "queue" | "emergency"
  >("playback");

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

  const handleLyricsOffsetChange = (offset: number) => {
    const clampedOffset = Math.max(-10, Math.min(10, offset));
    console.log("Sending lyrics offset change:", clampedOffset);
    onPlaybackControl({
      action: "lyrics-offset",
      value: clampedOffset,
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const handleEmergencyStop = () => {
    onPlaybackControl({
      action: "stop",
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const pendingQueue = queue.filter(item => item.status === "pending") || [];
  const currentOffset = playbackState?.lyricsOffset || 0;

  // Debug logging
  console.log("MobileAdminInterface - playbackState:", playbackState);
  console.log("MobileAdminInterface - currentOffset:", currentOffset);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <Cog6ToothIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">
              Admin Controls
            </h1>
          </div>
          <div className="flex items-center mt-1">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? `Connected as ${userName}` : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab("playback")}
            className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "playback"
                ? "border-purple-500 text-purple-600 bg-purple-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MusicalNoteIcon className="w-4 h-4 mr-1" />
            Playback
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "queue"
                ? "border-purple-500 text-purple-600 bg-purple-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <QueueListIcon className="w-4 h-4 mr-1" />
            Queue ({pendingQueue.length})
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "emergency"
                ? "border-red-500 text-red-600 bg-red-50"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Emergency
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 pb-20">
        {activeTab === "playback" && (
          <div className="space-y-6">
            {/* Current Song */}
            {currentSong && (
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Now Playing
                </h3>
                <p className="font-semibold text-gray-900">
                  {currentSong.mediaItem.title}
                </p>
                <p className="text-gray-600">{currentSong.mediaItem.artist}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added by {currentSong.addedBy}
                </p>
              </div>
            )}

            {/* Playback Controls */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Controls
              </h3>

              {/* Main Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <button
                  onClick={() =>
                    handleSeek((playbackState?.currentTime || 0) - 10)
                  }
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  disabled={!currentSong}
                >
                  <BackwardIcon className="w-5 h-5 text-gray-700" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:bg-gray-300"
                  disabled={!currentSong && pendingQueue.length === 0}
                >
                  {playbackState?.isPlaying ? (
                    <PauseIcon className="w-6 h-6 text-white" />
                  ) : (
                    <PlayIcon className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onSkip}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  disabled={!currentSong}
                >
                  <ForwardIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Status */}
              <div className="text-center mb-4">
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

              {/* Seek Bar */}
              {currentSong && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>
                      {Math.floor((playbackState?.currentTime || 0) / 60)}:
                      {String(
                        Math.floor((playbackState?.currentTime || 0) % 60)
                      ).padStart(2, "0")}
                    </span>
                    <span>
                      {Math.floor(currentSong.mediaItem.duration / 60)}:
                      {String(currentSong.mediaItem.duration % 60).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={currentSong.mediaItem.duration}
                    value={playbackState?.currentTime || 0}
                    onChange={e => handleSeek(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Volume Control */}
              <div>
                <div className="flex items-center space-x-3">
                  <button onClick={handleMute} className="p-1">
                    {playbackState?.isMuted ? (
                      <SpeakerXMarkIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={playbackState?.volume || 80}
                      onChange={e =>
                        handleVolumeChange(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right">
                    {playbackState?.volume || 80}%
                  </span>
                </div>
              </div>
            </div>

            {/* Lyrics Offset Control */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Lyrics Timing
              </h3>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleLyricsOffsetChange(currentOffset - 1)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentOffset <= -10}
                >
                  <span className="text-lg font-bold text-gray-700">−</span>
                </button>

                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>-10s</span>
                    <span className="font-medium">
                      {currentOffset > 0 ? "+" : ""}
                      {currentOffset}s
                    </span>
                    <span>+10s</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="1"
                      value={currentOffset}
                      onChange={e =>
                        handleLyricsOffsetChange(parseInt(e.target.value))
                      }
                      className="lyrics-offset-slider w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          #ef4444 0%, 
                          #ef4444 ${((currentOffset + 10) / 20) * 50}%, 
                          #22c55e ${((currentOffset + 10) / 20) * 50}%, 
                          #22c55e 50%, 
                          #3b82f6 50%, 
                          #3b82f6 100%)`,
                      }}
                    />
                    {/* Center marker */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-px w-0.5 h-2 bg-gray-400 pointer-events-none"></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 text-center">
                    Adjust if lyrics appear too early (-) or too late (+)
                  </div>
                  {currentOffset !== 0 && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={() => handleLyricsOffsetChange(0)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Reset to 0s
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleLyricsOffsetChange(currentOffset + 1)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentOffset >= 10}
                >
                  <span className="text-lg font-bold text-gray-700">+</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Queue ({pendingQueue.length} songs)
              </h3>

              {pendingQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QueueListIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No songs in queue</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingQueue.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-purple-600">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.mediaItem.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {item.mediaItem.artist}
                        </p>
                        <p className="text-xs text-gray-500">
                          Added by {item.addedBy}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-xs text-gray-500">
                        {Math.floor(item.mediaItem.duration / 60)}:
                        {String(item.mediaItem.duration % 60).padStart(2, "0")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "emergency" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
              <div className="flex items-center text-red-600 mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                <h3 className="text-sm font-medium">Emergency Controls</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Use these controls only when technical issues occur.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleEmergencyStop}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <StopIcon className="w-4 h-4 mr-2" />
                  Emergency Stop
                </button>

                <button
                  onClick={() => handleSeek(0)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  disabled={!currentSong}
                >
                  <BackwardIcon className="w-4 h-4 mr-2" />
                  Restart Current Song
                </button>

                <button
                  onClick={() => handleVolumeChange(0)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
                  Mute Audio
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                System Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span
                    className={isConnected ? "text-green-600" : "text-red-600"}
                  >
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="text-gray-900">
                    {session?.connectedUsers.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Queue Length:</span>
                  <span className="text-gray-900">{pendingQueue.length}</span>
                </div>
              </div>
            </div>

            {/* Cache Status */}
            <CacheStatus showDetails={true} />
          </div>
        )}
      </div>

      {/* Custom styles for the lyrics offset slider */}
      <style jsx>{`
        .lyrics-offset-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .lyrics-offset-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .lyrics-offset-slider:focus {
          outline: none;
        }

        .lyrics-offset-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}
