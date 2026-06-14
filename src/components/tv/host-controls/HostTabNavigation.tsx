"use client";

import {
  ExclamationTriangleIcon,
  QueueListIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";

export type HostTab = "playback" | "queue" | "emergency";

interface TabConfig {
  id: HostTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
}

const TABS: TabConfig[] = [
  {
    id: "playback",
    label: "Playback",
    icon: MusicalNoteIcon,
    activeColor: "bg-purple-600 text-white",
  },
  {
    id: "queue",
    label: "Queue",
    icon: QueueListIcon,
    activeColor: "bg-purple-600 text-white",
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: ExclamationTriangleIcon,
    activeColor: "bg-red-600 text-white",
  },
];

interface HostTabNavigationProps {
  activeTab: HostTab;
  onTabChange: (tab: HostTab) => void;
  queueCount: number;
}

export function HostTabNavigation({
  activeTab,
  onTabChange,
  queueCount,
}: HostTabNavigationProps) {
  return (
    <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const label =
          tab.id === "queue" ? `${tab.label} (${queueCount})` : tab.label;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive
                ? tab.activeColor
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            }`}
          >
            <Icon className="w-5 h-5 mr-2" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
