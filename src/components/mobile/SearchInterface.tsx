"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { MediaItem } from "@/types";

interface SearchInterfaceProps {
  onAddSong: (mediaItem: MediaItem) => void;
  isConnected: boolean;
}

export function SearchInterface({
  onAddSong,
  isConnected,
}: SearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/songs?q=${encodeURIComponent(query.trim())}&limit=50`,
      );
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        setError(data.error?.message || "Failed to search songs");
        setSearchResults([]);
      }
    } catch (err) {
      setError("Failed to connect to server");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Load popular songs on initial load
  useEffect(() => {
    const loadInitialSongs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/songs?limit=20");
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load initial songs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!hasSearched) {
      loadInitialSongs();
    }
  }, [hasSearched]);

  const handleAddSong = (song: MediaItem) => {
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    try {
      onAddSong(song);
    } catch (err) {
      setError("Failed to add song to queue");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && hasSearched && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No songs found
            </h3>
            <p className="text-gray-500 text-center">
              Try searching with different keywords or check your spelling
            </p>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && !hasSearched && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Browse Music
            </h3>
            <p className="text-gray-500 text-center">
              Search for songs to add to the karaoke queue
            </p>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="divide-y divide-gray-200">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {song.artist}
                      {song.album && ` • ${song.album}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDuration(song.duration)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddSong(song)}
                    disabled={!isConnected}
                    className="ml-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Add to queue"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasSearched && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {searchQuery ? "Search Results" : "Popular Songs"}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
