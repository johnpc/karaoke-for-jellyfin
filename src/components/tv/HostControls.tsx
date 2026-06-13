"use client";

import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";
import {
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { PlaybackTab } from "./host-controls/PlaybackTab";
import { QueueTab } from "./host-controls/QueueTab";
import { EmergencyTab } from "./host-controls/EmergencyTab";

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

  const pendingQueue =
    session?.queue.filter(item => item.status === "pending") || [];

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div
        data-testid="host-controls"
        className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-8 border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col"
      >
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
            <PlaybackTab
              currentSong={currentSong}
              playbackState={playbackState}
              pendingQueue={pendingQueue}
              session={session}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onMute={handleMute}
              onSkip={onSkip}
            />
          )}

          {activeTab === "queue" && (
            <QueueTab
              pendingQueue={pendingQueue}
              onRemoveSong={onRemoveSong}
              onReorderQueue={onReorderQueue}
            />
          )}

          {activeTab === "emergency" && (
            <EmergencyTab
              session={session}
              currentSong={currentSong}
              pendingQueue={pendingQueue}
              onEmergencyStop={handleEmergencyStop}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
            />
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
