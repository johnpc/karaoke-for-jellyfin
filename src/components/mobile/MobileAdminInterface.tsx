"use client";

import { useState } from "react";
import {
  KaraokeSession,
  QueueItem,
  PlaybackState,
  PlaybackCommand,
} from "@/types";
import {
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { AdminPlaybackTab } from "./admin/AdminPlaybackTab";
import { AdminQueueTab } from "./admin/AdminQueueTab";
import { AdminEmergencyTab } from "./admin/AdminEmergencyTab";
import { TabButton } from "./admin/TabButton";

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

type AdminTab = "playback" | "queue" | "emergency";

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
  const [activeTab, setActiveTab] = useState<AdminTab>("playback");
  const pendingQueue = queue.filter(item => item.status === "pending") || [];

  return (
    <div data-testid="admin-interface" className="min-h-screen bg-gray-50">
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
              className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span
              data-testid="connection-status"
              className="text-sm text-gray-600"
            >
              {isConnected ? `Connected as ${userName}` : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
        <div className="flex">
          <TabButton
            active={activeTab === "playback"}
            onClick={() => setActiveTab("playback")}
            activeColor="purple"
          >
            <MusicalNoteIcon className="w-4 h-4 mr-1" />
            Playback
          </TabButton>
          <TabButton
            active={activeTab === "queue"}
            onClick={() => setActiveTab("queue")}
            activeColor="purple"
          >
            <QueueListIcon className="w-4 h-4 mr-1" />
            Queue ({pendingQueue.length})
          </TabButton>
          <TabButton
            active={activeTab === "emergency"}
            onClick={() => setActiveTab("emergency")}
            activeColor="red"
          >
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Emergency
          </TabButton>
        </div>
      </div>
      <div className="p-4 pb-20">
        {activeTab === "playback" && (
          <AdminPlaybackTab
            currentSong={currentSong}
            playbackState={playbackState}
            pendingQueueLength={pendingQueue.length}
            onSkip={onSkip}
            onPlaybackControl={onPlaybackControl}
          />
        )}
        {activeTab === "queue" && (
          <AdminQueueTab
            pendingQueue={pendingQueue}
            onRemoveSong={onRemoveSong}
            onReorderQueue={onReorderQueue}
          />
        )}
        {activeTab === "emergency" && (
          <AdminEmergencyTab
            session={session}
            currentSong={currentSong}
            isConnected={isConnected}
            pendingQueueLength={pendingQueue.length}
            onPlaybackControl={onPlaybackControl}
          />
        )}
      </div>
    </div>
  );
}
