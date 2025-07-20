"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

type SearchTab = "title" | "artist";

export function SearchInterface({
  onAddSong,
  isConnected,
}: SearchInterfaceProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string, searchType: SearchTab, page: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setHasMoreResults(true);
      setCurrentPage(1);
      return;
    }

    console.log(`Performing ${searchType} search for "${query}" - page ${page}, append: ${append}`);

    if (page === 1) {
      setIsLoading(true);
      setSearchResults([]);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);
    setHasSearched(true);

    try {
      const endpoint = searchType === "title" ? "/api/songs/title" : "/api/songs/artist";
      const limit = 50;
      const startIndex = (page - 1) * limit;
      
      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`,
      );
      const data = await response.json();

      if (data.success) {
        const newResults = data.data || [];
        console.log(`Got ${newResults.length} results for page ${page}`);
        
        if (append && page > 1) {
          setSearchResults(prev => {
            const combined = [...prev, ...newResults];
            console.log(`Total results after append: ${combined.length}`);
            return combined;
          });
        } else {
          setSearchResults(newResults);
        }
        
        // Check if there are more results
        const hasMore = newResults.length === limit;
        console.log(`Has more results: ${hasMore}`);
        setHasMoreResults(hasMore);
        setCurrentPage(page);
      } else {
        setError(data.error?.message || `Failed to search songs by ${searchType}`);
        if (!append) {
          setSearchResults([]);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to connect to server");
      if (!append) {
        setSearchResults([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Load more results for infinite scroll
  const loadMoreResults = useCallback(async () => {
    if (!searchQuery.trim() || !hasMoreResults || isLoadingMore || isLoading) {
      return;
    }

    console.log(`Loading more results for "${searchQuery}" - page ${currentPage + 1}`);
    await performSearch(searchQuery, activeTab, currentPage + 1, true);
  }, [searchQuery, activeTab, currentPage, hasMoreResults, isLoadingMore, isLoading, performSearch]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

    if (isNearBottom && hasMoreResults && !isLoadingMore && !isLoading && searchQuery.trim()) {
      loadMoreResults();
    }
  }, [hasMoreResults, isLoadingMore, isLoading, searchQuery, loadMoreResults]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, activeTab);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, performSearch]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

  // Clear search when switching tabs
  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
    setHasMoreResults(true);
    setCurrentPage(1);
  };

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

  const getPlaceholderText = () => {
    return activeTab === "title" 
      ? "Search by song title..." 
      : "Search by artist name...";
  };

  const getEmptyStateText = () => {
    return activeTab === "title"
      ? "Try searching by song title or check your spelling"
      : "Try searching by artist name or check your spelling";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => handleTabChange("title")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "title"
                ? "border-purple-500 text-purple-600 bg-purple-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Search by Title
          </button>
          <button
            onClick={() => handleTabChange("artist")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "artist"
                ? "border-purple-500 text-purple-600 bg-purple-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Search by Artist
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={getPlaceholderText()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Results */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading && searchResults.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">
              {activeTab === "artist" ? "Finding all songs by this artist..." : "Searching..."}
            </span>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && hasSearched && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No songs found
            </h3>
            <p className="text-gray-500 text-center">
              {getEmptyStateText()}
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
              {activeTab === "title" 
                ? "Search by song title to add songs to the queue"
                : "Search by artist name to find all songs by that artist"
              }
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
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600 text-sm">Loading more songs...</span>
              </div>
            )}
            
            {/* End of results indicator */}
            {hasSearched && searchResults.length > 0 && !hasMoreResults && !isLoadingMore && (
              <div className="flex items-center justify-center py-6">
                <p className="text-gray-500 text-sm">
                  {activeTab === "artist" 
                    ? `Found all songs by this artist (${searchResults.length} total)`
                    : `No more songs found (${searchResults.length} total)`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Popular Songs
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
