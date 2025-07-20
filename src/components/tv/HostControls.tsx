"use client";

import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  StopIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  UserIcon,
  Cog6ToothIcon,
  TrashIcon,
  Bars3Icon,
  ExclamationTriangleIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

interface HostControlsProps {
  session: KaraokeSession | null;
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  onClose: () => void;
  onSkip: () => void;
  onPlaybackControl: (command: PlaybackCommand) => void;
  onRemoveSong?: (queueItemId: string) => void;
  onReorderQueue?: (queueItemId: string, newPosition: number) => void;
  onEmergencyStop?: () => void;
}

export function HostControls({
  session,
  currentSong,
  playbackState,
  onClose,
  onSkip,
  onPlaybackControl,
  onRemoveSong,
  onReorderQueue,
  onEmergencyStop,
}: HostControlsProps) {
  const [activeTab, setActiveTab] = useState<
    "playback" | "queue" | "emergency"
  >("playback");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handlePlayPause = () => {
    if (playbackState) {
      onPlaybackControl({
        action: playbackState.isPlaying ? "pause" : "play",
        userId: "tv-host",
        timestamp: new Date(),
      });
    }
  };

  const handleVolumeChange = (volume: number) => {
    onPlaybackControl({
      action: "volume",
      value: Math.max(0, Math.min(100, volume)),
      userId: "tv-host",
      timestamp: new Date(),
    });
  };

  const handleMute = () => {
    onPlaybackControl({
      action: "mute",
      userId: "tv-host",
      timestamp: new Date(),
    });
  };

  const handleSeek = (seconds: number) => {
    onPlaybackControl({
      action: "seek",
      value: Math.max(0, seconds),
      userId: "tv-host",
      timestamp: new Date(),
    });
  };

  const handleEmergencyStop = () => {
    onPlaybackControl({
      action: "stop",
      userId: "tv-host",
      timestamp: new Date(),
    });
    if (onEmergencyStop) {
      onEmergencyStop();
    }
  };

  // Drag and drop handlers for queue reordering
  const handleDragStart = (e: React.DragEvent, queueItemId: string) => {
    setDraggedItem(queueItemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, newIndex: number) => {
    e.preventDefault();
    if (draggedItem && onReorderQueue) {
      onReorderQueue(draggedItem, newIndex);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const pendingQueue =
    session?.queue.filter((item) => item.status === "pending") || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-8 border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Cog6ToothIcon className="w-8 h-8 text-purple-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">Host Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <XMarkIcon className="w-8 h-8 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("playback")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "playback"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <MusicalNoteIcon className="w-5 h-5 mr-2" />
            Playback
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "queue"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <QueueListIcon className="w-5 h-5 mr-2" />
            Queue ({pendingQueue.length})
          </button>
          <button
            onClick={() => setActiveTab("emergency")}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              activeTab === "emergency"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Emergency
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "playback" && (
            <div className="space-y-6">
              {/* Current Song Info */}
              {currentSong && (
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
              )}

              {/* No Queue Warning */}
              {pendingQueue.length === 0 && !currentSong && (
                <div className="p-4 bg-yellow-900 bg-opacity-30 rounded-lg border border-yellow-700 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                    No Songs in Queue
                  </h3>
                  <p className="text-yellow-200 text-sm mb-3">
                    Add songs to the queue using the mobile interface to start
                    playback. Go to the main page, search for songs, and add
                    them to the queue.
                  </p>
                  <div className="text-xs text-yellow-400">
                    Debug: Session={session ? "Active" : "None"}, Queue=
                    {session?.queue?.length || 0}, Pending={pendingQueue.length}
                  </div>
                </div>
              )}

              {/* Playback Controls */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Playback Controls
                </h3>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={() =>
                      handleSeek((playbackState?.currentTime || 0) - 10)
                    }
                    className="flex items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                    disabled={!currentSong}
                    title="Rewind 10s"
                  >
                    <BackwardIcon className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="flex items-center justify-center w-16 h-16 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={pendingQueue.length === 0 && !currentSong}
                    title={
                      pendingQueue.length === 0 && !currentSong
                        ? "No songs in queue"
                        : ""
                    }
                  >
                    {playbackState?.isPlaying ? (
                      <PauseIcon className="w-8 h-8 text-white" />
                    ) : (
                      <PlayIcon className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>

                  <button
                    onClick={onSkip}
                    className="flex items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                    disabled={!currentSong}
                    title="Skip Song"
                  >
                    <ForwardIcon className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="text-center mb-4">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      playbackState?.isPlaying
                        ? "bg-green-900 text-green-300"
                        : "bg-yellow-900 text-yellow-300"
                    }`}
                  >
                    {playbackState?.isPlaying ? "Playing" : "Paused"}
                  </div>
                </div>

                {/* Seek Bar */}
                {currentSong && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>
                        {Math.floor((playbackState?.currentTime || 0) / 60)}:
                        {String(
                          Math.floor((playbackState?.currentTime || 0) % 60),
                        ).padStart(2, "0")}
                      </span>
                      <span>
                        {Math.floor(currentSong.mediaItem.duration / 60)}:
                        {String(currentSong.mediaItem.duration % 60).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={currentSong.mediaItem.duration}
                      value={playbackState?.currentTime || 0}
                      onChange={(e) => handleSeek(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Volume Controls */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Volume Control
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleMute}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    {playbackState?.isMuted ? (
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
                      value={playbackState?.volume || 80}
                      onChange={(e) =>
                        handleVolumeChange(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${playbackState?.volume || 80}%, #374151 ${playbackState?.volume || 80}%, #374151 100%)`,
                      }}
                    />
                  </div>

                  <div className="text-white font-medium w-12 text-center">
                    {playbackState?.volume || 80}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "queue" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Queue Management
                </h3>
                <div className="text-sm text-gray-400">
                  Drag songs to reorder • Click trash to remove
                </div>
              </div>

              {pendingQueue.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <QueueListIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No songs in queue</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendingQueue.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center p-3 rounded-lg border transition-all cursor-move ${
                        dragOverIndex === index
                          ? "border-purple-500 bg-purple-900 bg-opacity-20"
                          : "border-gray-700 bg-gray-800 hover:bg-gray-750"
                      } ${draggedItem === item.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center mr-3 text-gray-400">
                        <Bars3Icon className="w-5 h-5" />
                        <span className="ml-2 text-sm font-mono">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {item.mediaItem.title}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          {item.mediaItem.artist}
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {item.addedBy}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-gray-400 text-sm">
                          {Math.floor(item.mediaItem.duration / 60)}:
                          {String(item.mediaItem.duration % 60).padStart(
                            2,
                            "0",
                          )}
                        </div>
                        {onRemoveSong && (
                          <button
                            onClick={() => onRemoveSong(item.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-full transition-colors"
                            title="Remove from queue"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-red-400">
                <ExclamationTriangleIcon className="w-8 h-8" />
                <h3 className="text-lg font-semibold">Emergency Controls</h3>
              </div>

              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 mb-4">
                  Use these controls only when technical issues occur or
                  immediate intervention is needed.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleEmergencyStop}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <StopIcon className="w-5 h-5 mr-2" />
                    Emergency Stop
                  </button>

                  <button
                    onClick={() => handleSeek(0)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    disabled={!currentSong}
                  >
                    <BackwardIcon className="w-5 h-5 mr-2" />
                    Restart Current Song
                  </button>

                  <button
                    onClick={() => handleVolumeChange(0)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <SpeakerXMarkIcon className="w-5 h-5 mr-2" />
                    Mute Audio
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">System Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connection Status:</span>
                    <span className="text-green-400">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Users:</span>
                    <span className="text-white">
                      {session?.connectedUsers.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue Length:</span>
                    <span className="text-white">{pendingQueue.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auto Advance:</span>
                    <span
                      className={
                        session?.hostControls?.autoAdvance
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {session?.hostControls?.autoAdvance
                        ? "Enabled"
                        : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-700 mt-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Press H to toggle controls • Space to play/pause • S to skip • Esc
              to close
            </span>
            <span>Host Controls Active</span>
          </div>
        </div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #8b5cf6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
