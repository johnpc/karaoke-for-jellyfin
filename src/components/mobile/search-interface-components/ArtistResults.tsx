"use client";

import {
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Artist } from "@/types";

interface ArtistResultsProps {
  artists: Artist[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onArtistSelect: (artist: Artist) => void;
}

export function ArtistResults({
  artists,
  isCollapsed,
  onToggleCollapse,
  onArtistSelect,
}: ArtistResultsProps) {
  if (artists.length === 0) return null;

  return (
    <div data-testid="artist-results" className="border-b border-gray-200">
      <button
        data-testid={isCollapsed ? "expand-artists" : "collapse-artists"}
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center">
          <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
          <span className="font-medium text-gray-900">
            Artists ({artists.length})
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
          {artists.map(artist => (
            <div
              key={artist.id}
              data-testid="artist-item"
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onArtistSelect(artist)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate">
                    {artist.name}
                  </h3>
                  <p className="text-sm text-gray-600">Artist</p>
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
