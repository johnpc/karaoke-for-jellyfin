"use client";

import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";
import { XMarkIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { PlaybackTab } from "./host-controls/PlaybackTab";
import { QueueTab } from "./host-controls/QueueTab";
import { EmergencyTab } from "./host-controls/EmergencyTab";
import {
  HostTabNavigation,
  type HostTab,
} from "./host-controls/HostTabNavigation";
import {
  createHostPlayPauseCommand,
  createHostVolumeCommand,
  createHostMuteCommand,
  createHostSeekCommand,
  createHostStopCommand,
} from "./host-controls/hostControlHandlers";

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
  const [activeTab, setActiveTab] = useState<HostTab>("playback");

  const pendingQueue =
    session?.queue.filter(item => item.status === "pending") || [];

  const handlePlayPause = () => {
    if (playbackState) {
      onPlaybackControl(createHostPlayPauseCommand(playbackState.isPlaying));
    }
  };

  const handleVolumeChange = (volume: number) => {
    onPlaybackControl(createHostVolumeCommand(volume));
  };

  const handleMute = () => {
    onPlaybackControl(createHostMuteCommand());
  };

  const handleSeek = (seconds: number) => {
    onPlaybackControl(createHostSeekCommand(seconds));
  };

  const handleEmergencyStop = () => {
    onPlaybackControl(createHostStopCommand());
    onEmergencyStop?.();
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

        <HostTabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          queueCount={pendingQueue.length}
        />
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
    </div>
  );
}
