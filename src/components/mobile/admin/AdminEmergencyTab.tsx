"use client";

import { KaraokeSession, QueueItem, PlaybackCommand } from "@/types";
import {
  BackwardIcon,
  StopIcon,
  SpeakerXMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CacheStatus } from "@/components/CacheStatus";

interface AdminEmergencyTabProps {
  session: KaraokeSession | null;
  currentSong: QueueItem | null;
  isConnected: boolean;
  pendingQueueLength: number;
  onPlaybackControl: (command: PlaybackCommand) => void;
}

export function AdminEmergencyTab({
  session,
  currentSong,
  isConnected,
  pendingQueueLength,
  onPlaybackControl,
}: AdminEmergencyTabProps) {
  const handleEmergencyStop = () => {
    onPlaybackControl({
      action: "stop",
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const handleSeekToStart = () => {
    onPlaybackControl({
      action: "seek",
      value: 0,
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  const handleMuteAudio = () => {
    onPlaybackControl({
      action: "volume",
      value: 0,
      userId: "mobile-admin",
      timestamp: new Date(),
    });
  };

  return (
    <div data-testid="emergency-controls" className="space-y-4">
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
            data-testid="emergency-stop-button"
            onClick={handleEmergencyStop}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <StopIcon className="w-4 h-4 mr-2" />
            Emergency Stop
          </button>

          <button
            data-testid="restart-song-button"
            onClick={handleSeekToStart}
            className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            disabled={!currentSong}
          >
            <BackwardIcon className="w-4 h-4 mr-2" />
            Restart Current Song
          </button>

          <button
            onClick={handleMuteAudio}
            className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <SpeakerXMarkIcon className="w-4 h-4 mr-2" />
            Mute Audio
          </button>
        </div>
      </div>

      {/* System Status */}
      <div
        data-testid="system-status"
        className="bg-white rounded-lg p-4 shadow-sm border"
      >
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          System Status
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Connection:</span>
            <span
              data-testid="connection-indicator"
              className={isConnected ? "text-green-600" : "text-red-600"}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div data-testid="active-users" className="flex justify-between">
            <span className="text-gray-600">Active Users:</span>
            <span data-testid="user-count" className="text-gray-900">
              {session?.connectedUsers.length || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Queue Length:</span>
            <span className="text-gray-900">{pendingQueueLength}</span>
          </div>
        </div>
      </div>

      {/* Cache Status */}
      <CacheStatus showDetails={true} />
    </div>
  );
}
