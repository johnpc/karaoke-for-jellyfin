"use client";

import {
  RectangleStackIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Album } from "@/types";

interface AlbumResultsProps {
  albums: Album[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAlbumSelect: (album: Album) => void;
}

export function AlbumResults({
  albums,
  isCollapsed,
  onToggleCollapse,
  onAlbumSelect,
}: AlbumResultsProps) {
  if (albums.length === 0) return null;

  return (
    <div data-testid="album-results" className="border-b border-gray-200">
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center">
          <RectangleStackIcon className="w-5 h-5 text-gray-600 mr-2" />
          <span className="font-medium text-gray-900">
            Albums ({albums.length})
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronUpIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {!isCollapsed && (
        <div className="divide-y divide-gray-200">
          {albums.map(album => (
            <div
              key={album.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onAlbumSelect(album)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  {album.imageUrl ? (
                    <img
                      src={album.imageUrl}
                      alt={album.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <RectangleStackIcon className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {album.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {album.artist}
                    {album.year && ` • ${album.year}`}
                  </p>
                  {album.trackCount && (
                    <p className="text-xs text-gray-500 mt-1">
                      {album.trackCount} tracks
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <ArrowLeftIcon className="w-4 h-4 text-white transform rotate-180" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
