"use client";

import { QueueItem, KaraokeSession } from "@/types";
import {
  StopIcon,
  BackwardIcon,
  SpeakerXMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface EmergencyTabProps {
  session: KaraokeSession | null;
  currentSong: QueueItem | null;
  pendingQueue: QueueItem[];
  onEmergencyStop: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function EmergencyTab({
  session,
  currentSong,
  pendingQueue,
  onEmergencyStop,
  onSeek,
  onVolumeChange,
}: EmergencyTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-red-400">
        <ExclamationTriangleIcon className="w-8 h-8" />
        <h3 className="text-lg font-semibold">Emergency Controls</h3>
      </div>

      <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
        <p className="text-red-300 mb-4">
          Use these controls only when technical issues occur or immediate
          intervention is needed.
        </p>

        <div className="space-y-3">
          <button
            onClick={onEmergencyStop}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Emergency Stop
          </button>

          <button
            onClick={() => onSeek(0)}
            className="w-full flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            disabled={!currentSong}
          >
            <BackwardIcon className="w-5 h-5 mr-2" />
            Restart Current Song
          </button>

          <button
            onClick={() => onVolumeChange(0)}
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
              {session?.hostControls?.autoAdvance ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
