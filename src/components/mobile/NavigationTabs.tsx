"use client";

import {
  MagnifyingGlassIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

interface NavigationTabsProps {
  activeTab: "search" | "queue";
  onTabChange: (tab: "search" | "queue") => void;
  queueCount: number;
}

export function NavigationTabs({
  activeTab,
  onTabChange,
  queueCount,
}: NavigationTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex">
        <button
          onClick={() => onTabChange("search")}
          className={`flex-1 flex items-center justify-center py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-purple-500 text-purple-600 bg-purple-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
          Search Songs
        </button>

        <button
          onClick={() => onTabChange("queue")}
          className={`flex-1 flex items-center justify-center py-4 px-4 text-sm font-medium border-b-2 transition-colors relative ${
            activeTab === "queue"
              ? "border-purple-500 text-purple-600 bg-purple-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <QueueListIcon className="w-5 h-5 mr-2" />
          Queue
          {queueCount > 0 && (
            <span className="ml-2 bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
              {queueCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
