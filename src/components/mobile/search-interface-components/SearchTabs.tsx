"use client";

interface SearchTabsProps {
  activeTab: "search" | "playlist";
  onTabChange: (tab: "search" | "playlist") => void;
}

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex">
        <button
          onClick={() => onTabChange("search")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "search"
              ? "border-purple-500 text-purple-600 bg-purple-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Search
        </button>
        <button
          data-testid="playlist-tab"
          onClick={() => onTabChange("playlist")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "playlist"
              ? "border-purple-500 text-purple-600 bg-purple-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Playlists
        </button>
      </div>
    </div>
  );
}
