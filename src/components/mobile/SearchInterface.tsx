"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MusicalNoteIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { MediaItem, Artist, Playlist } from "@/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface SearchInterfaceProps {
  onAddSong: (mediaItem: MediaItem) => Promise<void>;
  isConnected: boolean;
}

type SearchTab = "title" | "artist" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

export function SearchInterface({
  onAddSong,
  isConnected,
}: SearchInterfaceProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("title");
  const [artistViewMode, setArtistViewMode] =
    useState<ArtistViewMode>("artists");
  const [playlistViewMode, setPlaylistViewMode] =
    useState<PlaylistViewMode>("playlists");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [playlistResults, setPlaylistResults] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [addedSong, setAddedSong] = useState<MediaItem | null>(null);
  const [confirmationType, setConfirmationType] = useState<"success" | "error">(
    "success",
  );

  // Debounced search function for songs
  const performSongSearch = useCallback(
    async (
      query: string,
      searchType: SearchTab,
      page: number = 1,
      append: boolean = false,
    ) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setHasMoreResults(true);
        setCurrentPage(1);
        return;
      }

      console.log(
        `Performing ${searchType} song search for "${query}" - page ${page}, append: ${append}`,
      );

      if (page === 1) {
        setIsLoading(true);
        setSearchResults([]);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);
      setHasSearched(true);

      try {
        const endpoint =
          searchType === "title" ? "/api/songs/title" : "/api/songs/artist";
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `${endpoint}?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`,
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Got ${newResults.length} song results for page ${page}`);

          if (append && page > 1) {
            setSearchResults((prev) => {
              const combined = [...prev, ...newResults];
              console.log(
                `Total song results after append: ${combined.length}`,
              );
              return combined;
            });
          } else {
            setSearchResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more song results: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(
            data.error?.message || `Failed to search songs by ${searchType}`,
          );
          if (!append) {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error("Song search error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Search function for artists
  const performArtistSearch = useCallback(
    async (query: string, page: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setArtistResults([]);
        setHasSearched(false);
        setHasMoreResults(true);
        setCurrentPage(1);
        return;
      }

      console.log(
        `Performing artist search for "${query}" - page ${page}, append: ${append}`,
      );

      if (page === 1) {
        setIsLoading(true);
        setArtistResults([]);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);
      setHasSearched(true);

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/artists?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`,
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(
            `Got ${newResults.length} artist results for page ${page}`,
          );

          if (append && page > 1) {
            setArtistResults((prev) => {
              const combined = [...prev, ...newResults];
              console.log(
                `Total artist results after append: ${combined.length}`,
              );
              return combined;
            });
          } else {
            setArtistResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more artist results: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to search artists");
          if (!append) {
            setArtistResults([]);
          }
        }
      } catch (err) {
        console.error("Artist search error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setArtistResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Get songs by artist ID
  const getSongsByArtist = useCallback(
    async (artist: Artist, page: number = 1, append: boolean = false) => {
      console.log(
        `Getting songs for artist "${artist.name}" - page ${page}, append: ${append}`,
      );

      if (page === 1) {
        setIsLoading(true);
        setSearchResults([]);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/artists/${artist.id}/songs?limit=${limit}&startIndex=${startIndex}`,
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(
            `Got ${newResults.length} songs for artist "${artist.name}" - page ${page}`,
          );

          if (append && page > 1) {
            setSearchResults((prev) => {
              const combined = [...prev, ...newResults];
              console.log(
                `Total songs for artist after append: ${combined.length}`,
              );
              return combined;
            });
          } else {
            setSearchResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more songs for artist: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get songs by artist");
          if (!append) {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error("Get songs by artist error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Get all playlists
  const getPlaylists = useCallback(
    async (page: number = 1, append: boolean = false) => {
      console.log(`Getting playlists - page ${page}, append: ${append}`);

      if (page === 1) {
        setIsLoading(true);
        setPlaylistResults([]);
        setHasSearched(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/playlists?limit=${limit}&startIndex=${startIndex}`,
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Received ${newResults.length} playlists`);

          if (append) {
            setPlaylistResults((prev) => [...prev, ...newResults]);
          } else {
            setPlaylistResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more playlist results: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get playlists");
          if (!append) {
            setPlaylistResults([]);
          }
        }
      } catch (err) {
        console.error("Get playlists error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setPlaylistResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Get songs by playlist ID
  const getSongsByPlaylist = useCallback(
    async (playlist: Playlist, page: number = 1, append: boolean = false) => {
      console.log(
        `Getting songs for playlist "${playlist.name}" - page ${page}, append: ${append}`,
      );

      if (page === 1) {
        setIsLoading(true);
        setSearchResults([]);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/playlists/${playlist.id}/items?limit=${limit}&startIndex=${startIndex}`,
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Received ${newResults.length} songs for playlist`);

          if (append) {
            setSearchResults((prev) => [...prev, ...newResults]);
          } else {
            setSearchResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more songs for playlist: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get songs by playlist");
          if (!append) {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.error("Get songs by playlist error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Load more results for infinite scroll
  const loadMoreResults = useCallback(async () => {
    if (!hasMoreResults || isLoadingMore || isLoading) {
      return;
    }

    if (activeTab === "artist") {
      if (artistViewMode === "artists") {
        if (!searchQuery.trim()) return;
        console.log(
          `Loading more artists for "${searchQuery}" - page ${currentPage + 1}`,
        );
        await performArtistSearch(searchQuery, currentPage + 1, true);
      } else if (selectedArtist) {
        console.log(
          `Loading more songs for artist "${selectedArtist.name}" - page ${currentPage + 1}`,
        );
        await getSongsByArtist(selectedArtist, currentPage + 1, true);
      }
    } else if (activeTab === "playlist") {
      if (playlistViewMode === "playlists") {
        console.log(`Loading more playlists - page ${currentPage + 1}`);
        await getPlaylists(currentPage + 1, true);
      } else if (selectedPlaylist) {
        console.log(
          `Loading more songs for playlist "${selectedPlaylist.name}" - page ${currentPage + 1}`,
        );
        await getSongsByPlaylist(selectedPlaylist, currentPage + 1, true);
      }
    } else {
      if (!searchQuery.trim()) return;
      console.log(
        `Loading more songs for "${searchQuery}" - page ${currentPage + 1}`,
      );
      await performSongSearch(searchQuery, activeTab, currentPage + 1, true);
    }
  }, [
    searchQuery,
    activeTab,
    artistViewMode,
    playlistViewMode,
    selectedArtist,
    selectedPlaylist,
    currentPage,
    hasMoreResults,
    isLoadingMore,
    isLoading,
    performSongSearch,
    performArtistSearch,
    getSongsByArtist,
    getPlaylists,
    getSongsByPlaylist,
  ]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

    if (isNearBottom && hasMoreResults && !isLoadingMore && !isLoading) {
      // Only load more if we have a search query or are viewing songs for an artist/playlist
      const shouldLoadMore =
        (activeTab === "title" && searchQuery.trim()) ||
        (activeTab === "artist" &&
          artistViewMode === "artists" &&
          searchQuery.trim()) ||
        (activeTab === "artist" &&
          artistViewMode === "songs" &&
          selectedArtist) ||
        (activeTab === "playlist" && playlistViewMode === "playlists") ||
        (activeTab === "playlist" &&
          playlistViewMode === "songs" &&
          selectedPlaylist);

      if (shouldLoadMore) {
        loadMoreResults();
      }
    }
  }, [
    hasMoreResults,
    isLoadingMore,
    isLoading,
    searchQuery,
    activeTab,
    artistViewMode,
    playlistViewMode,
    selectedArtist,
    selectedPlaylist,
    loadMoreResults,
  ]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "artist" && artistViewMode === "artists") {
        performArtistSearch(searchQuery);
      } else if (activeTab === "title") {
        performSongSearch(searchQuery, activeTab);
      }
      // Don't auto-search when viewing songs for a specific artist
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    activeTab,
    artistViewMode,
    performSongSearch,
    performArtistSearch,
  ]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
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
    setArtistResults([]);
    setPlaylistResults([]);
    setHasSearched(false);
    setError(null);
    setHasMoreResults(true);
    setCurrentPage(1);
    setArtistViewMode("artists");
    setPlaylistViewMode("playlists");
    setSelectedArtist(null);
    setSelectedPlaylist(null);

    // Auto-load playlists when switching to playlist tab
    if (tab === "playlist") {
      getPlaylists();
    }
  };

  // Handle artist selection
  const handleArtistSelect = async (artist: Artist) => {
    console.log(`Selected artist: ${artist.name}`);
    setSelectedArtist(artist);
    setArtistViewMode("songs");
    setCurrentPage(1);
    setHasMoreResults(true);
    await getSongsByArtist(artist);
  };

  // Handle back to artists view
  const handleBackToArtists = () => {
    setArtistViewMode("artists");
    setSelectedArtist(null);
    setSearchResults([]);
    setCurrentPage(1);
    setHasMoreResults(true);
  };

  // Handle playlist selection
  const handlePlaylistSelect = async (playlist: Playlist) => {
    console.log(`Selected playlist: ${playlist.name}`);
    setSelectedPlaylist(playlist);
    setPlaylistViewMode("songs");
    setCurrentPage(1);
    setHasMoreResults(true);
    await getSongsByPlaylist(playlist);
  };

  // Handle back to playlists view
  const handleBackToPlaylists = () => {
    setPlaylistViewMode("playlists");
    setSelectedPlaylist(null);
    setSearchResults([]);
    setCurrentPage(1);
    setHasMoreResults(true);
  };

  const handleAddSong = async (song: MediaItem) => {
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    try {
      await onAddSong(song);

      // Show success confirmation dialog with truncated title if too long
      const truncatedTitle =
        song.title.length > 40
          ? `${song.title.substring(0, 40)}...`
          : song.title;

      setAddedSong(song);
      setConfirmationMessage(
        `"${truncatedTitle}" by ${song.artist} added to queue!`,
      );
      setConfirmationType("success");
      setShowConfirmation(true);

      // Clear any existing error
      setError(null);
    } catch (err) {
      // Show error confirmation dialog instead of success
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add song to queue";

      // Check if it's the "join session" error and provide helpful guidance
      if (errorMessage.includes("join a session first")) {
        setConfirmationMessage(
          "You must join a session first. Please refresh the page and try again.",
        );
      } else {
        setConfirmationMessage(errorMessage);
      }

      setAddedSong(song);
      setConfirmationType("error");
      setShowConfirmation(true);
      setError(errorMessage);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPlaceholderText = () => {
    if (activeTab === "title") {
      return "Search by song title...";
    } else if (artistViewMode === "artists") {
      return "Search for artists...";
    } else {
      return `Search songs by ${selectedArtist?.name || "this artist"}...`;
    }
  };

  const getEmptyStateText = () => {
    if (activeTab === "title") {
      return "Try searching by song title or check your spelling";
    } else if (artistViewMode === "artists") {
      return "Try searching by artist name or check your spelling";
    } else {
      return `No songs found for ${selectedArtist?.name || "this artist"}`;
    }
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
          <button
            onClick={() => handleTabChange("playlist")}
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

      {/* Search Input */}
      <div className="p-4 bg-white border-b border-gray-200">
        {/* Back button for artist songs view */}
        {activeTab === "artist" && artistViewMode === "songs" && (
          <div className="flex items-center mb-3">
            <button
              onClick={handleBackToArtists}
              className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back to Artists</span>
            </button>
          </div>
        )}

        {/* Back button for playlist songs view */}
        {activeTab === "playlist" && playlistViewMode === "songs" && (
          <div className="flex items-center mb-3">
            <button
              onClick={handleBackToPlaylists}
              className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back to Playlists</span>
            </button>
          </div>
        )}

        {/* Search input - hide for playlist list view */}
        {!(activeTab === "playlist" && playlistViewMode === "playlists") && (
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
        )}

        {/* Artist info header when viewing songs */}
        {activeTab === "artist" &&
          artistViewMode === "songs" &&
          selectedArtist && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-900">
                  Songs by {selectedArtist.name}
                </span>
              </div>
            </div>
          )}

        {/* Playlist info header when viewing songs */}
        {activeTab === "playlist" &&
          playlistViewMode === "songs" &&
          selectedPlaylist && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <MusicalNoteIcon className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-900">
                  Songs in {selectedPlaylist.name}
                </span>
              </div>
            </div>
          )}
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

        {isLoading &&
          searchResults.length === 0 &&
          artistResults.length === 0 &&
          playlistResults.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">
                {activeTab === "artist" && artistViewMode === "artists"
                  ? "Searching for artists..."
                  : activeTab === "artist" && artistViewMode === "songs"
                    ? `Finding songs by ${selectedArtist?.name}...`
                    : activeTab === "playlist" &&
                        playlistViewMode === "playlists"
                      ? "Loading playlists..."
                      : activeTab === "playlist" && playlistViewMode === "songs"
                        ? `Loading songs from ${selectedPlaylist?.name}...`
                        : "Searching..."}
              </span>
            </div>
          )}

        {/* Empty state */}
        {!isLoading &&
          ((activeTab === "artist" &&
            artistViewMode === "artists" &&
            artistResults.length === 0) ||
            (activeTab === "artist" &&
              artistViewMode === "songs" &&
              searchResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "songs" &&
              searchResults.length === 0) ||
            (activeTab === "title" && searchResults.length === 0)) &&
          hasSearched && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {activeTab === "artist" && artistViewMode === "artists" ? (
                <UserIcon className="w-12 h-12 text-gray-400 mb-4" />
              ) : activeTab === "playlist" &&
                playlistViewMode === "playlists" ? (
                <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
              ) : (
                <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "artist" && artistViewMode === "artists"
                  ? "No artists found"
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? "No playlists found"
                    : "No songs found"}
              </h3>
              <p className="text-gray-500 text-center">
                {activeTab === "playlist" && playlistViewMode === "playlists"
                  ? "No music playlists found in your Jellyfin library"
                  : activeTab === "playlist" && playlistViewMode === "songs"
                    ? `No songs found in ${selectedPlaylist?.name || "this playlist"}`
                    : getEmptyStateText()}
              </p>
            </div>
          )}

        {/* Initial state */}
        {!isLoading && !hasSearched && activeTab !== "playlist" && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            {activeTab === "artist" && artistViewMode === "artists" ? (
              <UserIcon className="w-12 h-12 text-gray-400 mb-4" />
            ) : (
              <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Browse Music
            </h3>
            <p className="text-gray-500 text-center">
              {activeTab === "title"
                ? "Search by song title to add songs to the queue"
                : artistViewMode === "artists"
                  ? "Search for artists to browse their songs"
                  : `Browse songs by ${selectedArtist?.name || "this artist"}`}
            </p>
          </div>
        )}

        {/* Artist Results */}
        {activeTab === "artist" &&
          artistViewMode === "artists" &&
          artistResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {artistResults.map((artist) => (
                <div
                  key={artist.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleArtistSelect(artist)}
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

        {/* Playlist Results */}
        {activeTab === "playlist" &&
          playlistViewMode === "playlists" &&
          playlistResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {playlistResults.map((playlist) => (
                <div
                  key={playlist.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handlePlaylistSelect(playlist)}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      {playlist.imageUrl ? (
                        <img
                          src={playlist.imageUrl}
                          alt={playlist.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <MusicalNoteIcon className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {playlist.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {playlist.trackCount
                          ? `${playlist.trackCount} songs`
                          : "Playlist"}
                      </p>
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

        {/* Song Results */}
        {(activeTab === "title" ||
          (activeTab === "artist" && artistViewMode === "songs") ||
          (activeTab === "playlist" && playlistViewMode === "songs")) &&
          searchResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {song.title}
                        </h3>
                        <LyricsIndicator
                          song={song}
                          size="sm"
                          variant="badge"
                        />
                      </div>
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

        {/* Loading more indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 text-sm">
              {activeTab === "artist" && artistViewMode === "artists"
                ? "Loading more artists..."
                : activeTab === "playlist" && playlistViewMode === "playlists"
                  ? "Loading more playlists..."
                  : "Loading more songs..."}
            </span>
          </div>
        )}

        {/* End of results indicator */}
        {hasSearched &&
          ((activeTab === "artist" &&
            artistViewMode === "artists" &&
            artistResults.length > 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length > 0) ||
            ((activeTab === "title" ||
              (activeTab === "artist" && artistViewMode === "songs") ||
              (activeTab === "playlist" && playlistViewMode === "songs")) &&
              searchResults.length > 0)) &&
          !hasMoreResults &&
          !isLoadingMore && (
            <div className="flex items-center justify-center py-6">
              <p className="text-gray-500 text-sm">
                {activeTab === "artist" && artistViewMode === "artists"
                  ? `Found all matching artists (${artistResults.length} total)`
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? `Found all playlists (${playlistResults.length} total)`
                    : activeTab === "artist" && artistViewMode === "songs"
                      ? `Found all songs by ${selectedArtist?.name} (${searchResults.length} total)`
                      : activeTab === "playlist" && playlistViewMode === "songs"
                        ? `Found all songs in ${selectedPlaylist?.name} (${searchResults.length} total)`
                        : `No more songs found (${searchResults.length} total)`}
              </p>
            </div>
          )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title={
          confirmationType === "success" ? "Song Added!" : "Error Adding Song"
        }
        message={confirmationMessage}
        onClose={() => {
          setShowConfirmation(false);
          setAddedSong(null);
          setConfirmationMessage("");
          setConfirmationType("success");
        }}
        type={confirmationType}
        autoCloseDelay={2500}
      />
    </div>
  );
}
