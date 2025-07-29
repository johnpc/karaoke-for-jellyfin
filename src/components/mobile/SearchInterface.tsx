"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MusicalNoteIcon,
  UserIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { MediaItem, Artist, Playlist } from "@/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { LyricsIndicator } from "@/components/LyricsIndicator";

interface SearchInterfaceProps {
  onAddSong: (mediaItem: MediaItem) => Promise<void>;
  isConnected: boolean;
}

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";

export function SearchInterface({
  onAddSong,
  isConnected,
}: SearchInterfaceProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("search");
  const [artistViewMode, setArtistViewMode] =
    useState<ArtistViewMode>("artists");
  const [playlistViewMode, setPlaylistViewMode] =
    useState<PlaylistViewMode>("playlists");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Unified search results
  const [songResults, setSongResults] = useState<MediaItem[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);

  // Playlist results (separate from unified search)
  const [playlistResults, setPlaylistResults] = useState<Playlist[]>([]);

  // Section collapse states
  const [isArtistSectionCollapsed, setIsArtistSectionCollapsed] =
    useState(false);
  const [isSongSectionCollapsed, setIsSongSectionCollapsed] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [addedSong, setAddedSong] = useState<MediaItem | null>(null);
  const [confirmationType, setConfirmationType] = useState<"success" | "error">(
    "success"
  );

  // Unified search function that searches both artists and songs
  const performUnifiedSearch = useCallback(
    async (query: string, page: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setSongResults([]);
        setArtistResults([]);
        setHasSearched(false);
        setHasMoreResults(true);
        setCurrentPage(1);
        return;
      }

      console.log(
        `Performing unified search for "${query}" - page ${page}, append: ${append}`
      );

      if (page === 1) {
        setIsLoading(true);
        if (!append) {
          setSongResults([]);
          setArtistResults([]);
        }
      } else {
        setIsLoadingMore(true);
      }

      setError(null);
      setHasSearched(true);

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        // Search both artists and songs in parallel
        const [artistResponse, songResponse] = await Promise.all([
          fetch(
            `/api/artists?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
          ),
          fetch(
            `/api/songs/title?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
          ),
        ]);

        const [artistData, songData] = await Promise.all([
          artistResponse.json(),
          songResponse.json(),
        ]);

        // Process artist results
        if (artistData.success) {
          const newArtistResults = artistData.data || [];
          console.log(
            `Got ${newArtistResults.length} artist results for page ${page}`
          );

          if (append && page > 1) {
            setArtistResults(prev => {
              const combined = [...prev, ...newArtistResults];
              // Filter out duplicates by artist.id
              const uniqueArtists = combined.filter(
                (artist, index, arr) =>
                  arr.findIndex(a => a.id === artist.id) === index
              );
              console.log(
                `Total artist results after append: ${uniqueArtists.length} (${combined.length - uniqueArtists.length} duplicates removed)`
              );
              return uniqueArtists;
            });
          } else {
            setArtistResults(newArtistResults);
          }
        } else {
          console.error("Artist search failed:", artistData.error);
        }

        // Process song results
        if (songData.success) {
          const newSongResults = songData.data || [];
          console.log(
            `Got ${newSongResults.length} song results for page ${page}`
          );

          if (append && page > 1) {
            setSongResults(prev => {
              const combined = [...prev, ...newSongResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              console.log(
                `Total song results after append: ${uniqueSongs.length} (${combined.length - uniqueSongs.length} duplicates removed)`
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newSongResults);
          }
        } else {
          console.error("Song search failed:", songData.error);
        }

        // Check if there are more results (if either endpoint has more)
        const artistHasMore =
          artistData.success && (artistData.data || []).length === limit;
        const songHasMore =
          songData.success && (songData.data || []).length === limit;
        const hasMore = artistHasMore || songHasMore;

        console.log(
          `Has more results: ${hasMore} (artists: ${artistHasMore}, songs: ${songHasMore})`
        );
        setHasMoreResults(hasMore);
        setCurrentPage(page);

        // Set error if both searches failed
        if (!artistData.success && !songData.success) {
          setError("Failed to search artists and songs");
        } else if (!artistData.success) {
          setError("Failed to search artists");
        } else if (!songData.success) {
          setError("Failed to search songs");
        }
      } catch (err) {
        console.error("Unified search error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSongResults([]);
          setArtistResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Get songs by artist ID
  const getSongsByArtist = useCallback(
    async (artist: Artist, page: number = 1, append: boolean = false) => {
      console.log(
        `Getting songs for artist "${artist.name}" - page ${page}, append: ${append}`
      );

      if (page === 1) {
        setIsLoading(true);
        setSongResults([]);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/artists/${artist.id}/songs?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(
            `Got ${newResults.length} songs for artist "${artist.name}" - page ${page}`
          );

          if (append && page > 1) {
            setSongResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              console.log(
                `Total songs for artist after append: ${uniqueSongs.length} (${combined.length - uniqueSongs.length} duplicates removed)`
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more songs for artist: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get songs by artist");
          if (!append) {
            setSongResults([]);
          }
        }
      } catch (err) {
        console.error("Get songs by artist error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSongResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
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
          `/api/playlists?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Received ${newResults.length} playlists`);

          if (append) {
            setPlaylistResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by playlist.id
              const uniquePlaylists = combined.filter(
                (playlist, index, arr) =>
                  arr.findIndex(p => p.id === playlist.id) === index
              );
              console.log(
                `Total playlists after append: ${uniquePlaylists.length} (${combined.length - uniquePlaylists.length} duplicates removed)`
              );
              return uniquePlaylists;
            });
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
    []
  );

  // Get songs by playlist ID
  const getSongsByPlaylist = useCallback(
    async (playlist: Playlist, page: number = 1, append: boolean = false) => {
      console.log(
        `Getting songs for playlist "${playlist.name}" - page ${page}, append: ${append}`
      );

      if (page === 1) {
        setIsLoading(true);
        setSongResults([]);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/playlists/${playlist.id}/items?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Received ${newResults.length} songs for playlist`);

          if (append) {
            setSongResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              console.log(
                `Total songs for playlist after append: ${uniqueSongs.length} (${combined.length - uniqueSongs.length} duplicates removed)`
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more songs for playlist: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get songs by playlist");
          if (!append) {
            setSongResults([]);
          }
        }
      } catch (err) {
        console.error("Get songs by playlist error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSongResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Load more artists (for initial browse without search)
  const loadMoreArtists = useCallback(
    async (page: number = 1, append: boolean = false) => {
      console.log(`Loading more artists - page ${page}, append: ${append}`);

      if (page === 1) {
        setIsLoading(true);
        if (!append) {
          setArtistResults([]);
        }
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const limit = 50;
        const startIndex = (page - 1) * limit;

        const response = await fetch(
          `/api/artists?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(`Got ${newResults.length} artists for page ${page}`);

          if (append && page > 1) {
            setArtistResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by artist.id
              const uniqueArtists = combined.filter(
                (artist, index, arr) =>
                  arr.findIndex(a => a.id === artist.id) === index
              );
              console.log(
                `Total artists after append: ${uniqueArtists.length} (${combined.length - uniqueArtists.length} duplicates removed)`
              );
              return uniqueArtists;
            });
          } else {
            setArtistResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more artists: ${hasMore}`);
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to load artists");
          if (!append) {
            setArtistResults([]);
          }
        }
      } catch (err) {
        console.error("Load more artists error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setArtistResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );
  const loadMoreResults = useCallback(async () => {
    if (!hasMoreResults || isLoadingMore || isLoading) {
      return;
    }

    if (activeTab === "search") {
      if (artistViewMode === "artists") {
        if (searchQuery.trim()) {
          // Load more unified search results
          console.log(
            `Loading more unified search results for "${searchQuery}" - page ${currentPage + 1}`
          );
          await performUnifiedSearch(searchQuery, currentPage + 1, true);
        } else {
          // Load more artists (initial browse)
          console.log(`Loading more artists - page ${currentPage + 1}`);
          await loadMoreArtists(currentPage + 1, true);
        }
      } else if (selectedArtist) {
        // Load more songs for selected artist
        console.log(
          `Loading more songs for artist "${selectedArtist.name}" - page ${currentPage + 1}`
        );
        await getSongsByArtist(selectedArtist, currentPage + 1, true);
      }
    } else if (activeTab === "playlist") {
      if (playlistViewMode === "playlists") {
        console.log(`Loading more playlists - page ${currentPage + 1}`);
        await getPlaylists(currentPage + 1, true);
      } else if (selectedPlaylist) {
        console.log(
          `Loading more songs for playlist "${selectedPlaylist.name}" - page ${currentPage + 1}`
        );
        await getSongsByPlaylist(selectedPlaylist, currentPage + 1, true);
      }
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
    performUnifiedSearch,
    loadMoreArtists,
    getSongsByArtist,
    getPlaylists,
    getSongsByPlaylist,
  ]);

  // Handle load more button click
  const handleLoadMore = useCallback(() => {
    if (!hasMoreResults || isLoadingMore || isLoading) {
      return;
    }
    loadMoreResults();
  }, [hasMoreResults, isLoadingMore, isLoading, loadMoreResults]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === "search" && artistViewMode === "artists") {
        performUnifiedSearch(searchQuery);
      }
      // Don't auto-search when viewing songs for a specific artist
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, artistViewMode, performUnifiedSearch]);

  // Load all artists on initial load
  useEffect(() => {
    const loadInitialArtists = async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const limit = 50;
        const response = await fetch(
          `/api/artists?limit=${limit}&startIndex=0`
        );
        const data = await response.json();

        if (data.success) {
          const artists = data.data || [];
          setArtistResults(artists);

          // Check if there are more results
          const hasMore = artists.length === limit;
          setHasMoreResults(hasMore);
          setCurrentPage(1);

          console.log(
            `Loaded ${artists.length} initial artists, hasMore: ${hasMore}`
          );
        } else {
          console.error("Failed to load initial artists:", data.error);
          setError(data.error?.message || "Failed to load artists");
        }
      } catch (err) {
        console.error("Failed to load initial artists:", err);
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    if (
      !hasSearched &&
      activeTab === "search" &&
      artistViewMode === "artists"
    ) {
      loadInitialArtists();
    }
  }, [hasSearched, activeTab, artistViewMode]);

  // Clear search when switching tabs
  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSongResults([]);
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

    // Reset collapse states
    setIsArtistSectionCollapsed(false);
    setIsSongSectionCollapsed(false);

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
    setSongResults([]);
    setCurrentPage(1);
    setHasMoreResults(true);

    // Reset collapse states
    setIsArtistSectionCollapsed(false);
    setIsSongSectionCollapsed(false);
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
    setSongResults([]);
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
        `"${truncatedTitle}" by ${song.artist} added to queue!`
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
          "You must join a session first. Please refresh the page and try again."
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
    if (activeTab === "search") {
      if (artistViewMode === "artists") {
        return "Search for artists and songs...";
      } else {
        return `Search songs by ${selectedArtist?.name || "this artist"}...`;
      }
    }
    return "Search...";
  };

  const getEmptyStateText = () => {
    if (activeTab === "search") {
      if (artistViewMode === "artists") {
        return "Try searching by artist name or song title";
      } else {
        return `No songs found for ${selectedArtist?.name || "this artist"}`;
      }
    }
    return "No results found";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => handleTabChange("search")}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "search"
                ? "border-purple-500 text-purple-600 bg-purple-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Search
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
        {activeTab === "search" && artistViewMode === "songs" && (
          <div className="flex items-center mb-3">
            <button
              onClick={handleBackToArtists}
              className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back to Search</span>
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
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Artist info header when viewing songs */}
        {activeTab === "search" &&
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
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading &&
          songResults.length === 0 &&
          artistResults.length === 0 &&
          playlistResults.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">
                {activeTab === "search" && artistViewMode === "artists"
                  ? "Searching..."
                  : activeTab === "search" && artistViewMode === "songs"
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
          ((activeTab === "search" &&
            artistViewMode === "artists" &&
            artistResults.length === 0 &&
            songResults.length === 0) ||
            (activeTab === "search" &&
              artistViewMode === "songs" &&
              songResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length === 0) ||
            (activeTab === "playlist" &&
              playlistViewMode === "songs" &&
              songResults.length === 0)) &&
          hasSearched && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {activeTab === "search" && artistViewMode === "artists" ? (
                <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
              ) : activeTab === "playlist" &&
                playlistViewMode === "playlists" ? (
                <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
              ) : (
                <MusicalNoteIcon className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "search" && artistViewMode === "artists"
                  ? "No results found"
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
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search Music
            </h3>
            <p className="text-gray-500 text-center">
              {activeTab === "search"
                ? "Search for artists and songs to add to the queue"
                : artistViewMode === "artists"
                  ? "Search for artists to browse their songs"
                  : `Browse songs by ${selectedArtist?.name || "this artist"}`}
            </p>
          </div>
        )}

        {/* Unified Search Results - Artists and Songs */}
        {activeTab === "search" &&
          artistViewMode === "artists" &&
          hasSearched && (
            <div>
              {/* Artists Section */}
              {artistResults.length > 0 && (
                <div className="border-b border-gray-200">
                  <button
                    onClick={() =>
                      setIsArtistSectionCollapsed(!isArtistSectionCollapsed)
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        Artists ({artistResults.length})
                      </span>
                    </div>
                    {isArtistSectionCollapsed ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {!isArtistSectionCollapsed && (
                    <div className="divide-y divide-gray-200">
                      {artistResults.map(artist => (
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
                </div>
              )}

              {/* Songs Section */}
              {songResults.length > 0 && (
                <div>
                  <button
                    onClick={() =>
                      setIsSongSectionCollapsed(!isSongSectionCollapsed)
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <MusicalNoteIcon className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        Songs ({songResults.length})
                      </span>
                    </div>
                    {isSongSectionCollapsed ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {!isSongSectionCollapsed && (
                    <div className="divide-y divide-gray-200">
                      {songResults.map(song => (
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
                </div>
              )}
            </div>
          )}

        {/* Artist Songs View */}
        {activeTab === "search" &&
          artistViewMode === "songs" &&
          songResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {songResults.map(song => (
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

        {/* Playlist Results */}
        {activeTab === "playlist" &&
          playlistViewMode === "playlists" &&
          playlistResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {playlistResults.map(playlist => (
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

        {/* Playlist Songs View */}
        {activeTab === "playlist" &&
          playlistViewMode === "songs" &&
          songResults.length > 0 && (
            <div className="divide-y divide-gray-200">
              {songResults.map(song => (
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
              {activeTab === "search" && artistViewMode === "artists"
                ? "Loading more results..."
                : activeTab === "playlist" && playlistViewMode === "playlists"
                  ? "Loading more playlists..."
                  : "Loading more songs..."}
            </span>
          </div>
        )}

        {/* Load More Button */}
        {hasSearched &&
          hasMoreResults &&
          !isLoadingMore &&
          !isLoading &&
          ((activeTab === "search" &&
            artistViewMode === "artists" &&
            (artistResults.length > 0 || songResults.length > 0)) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length > 0) ||
            (((activeTab === "search" && artistViewMode === "songs") ||
              (activeTab === "playlist" && playlistViewMode === "songs")) &&
              songResults.length > 0)) && (
            <div className="flex items-center justify-center py-6">
              <button
                onClick={handleLoadMore}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium"
              >
                {activeTab === "search" && artistViewMode === "artists"
                  ? "Load More Results"
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? "Load More Playlists"
                    : activeTab === "search" && artistViewMode === "songs"
                      ? `Load More Songs by ${selectedArtist?.name}`
                      : activeTab === "playlist" && playlistViewMode === "songs"
                        ? `Load More Songs from ${selectedPlaylist?.name}`
                        : "Load More Songs"}
              </button>
            </div>
          )}

        {/* End of results indicator */}
        {hasSearched &&
          ((activeTab === "search" &&
            artistViewMode === "artists" &&
            (artistResults.length > 0 || songResults.length > 0)) ||
            (activeTab === "playlist" &&
              playlistViewMode === "playlists" &&
              playlistResults.length > 0) ||
            (((activeTab === "search" && artistViewMode === "songs") ||
              (activeTab === "playlist" && playlistViewMode === "songs")) &&
              songResults.length > 0)) &&
          !hasMoreResults &&
          !isLoadingMore && (
            <div className="flex items-center justify-center py-6">
              <p className="text-gray-500 text-sm">
                {activeTab === "search" && artistViewMode === "artists"
                  ? `Found all results (${artistResults.length} artists, ${songResults.length} songs)`
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? `Found all playlists (${playlistResults.length} total)`
                    : activeTab === "search" && artistViewMode === "songs"
                      ? `Found all songs by ${selectedArtist?.name} (${songResults.length} total)`
                      : activeTab === "playlist" && playlistViewMode === "songs"
                        ? `Found all songs in ${selectedPlaylist?.name} (${songResults.length} total)`
                        : `No more songs found (${songResults.length} total)`}
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
