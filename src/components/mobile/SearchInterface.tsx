"use client";

import { useState, useEffect, useCallback } from "react";
import { MediaItem, Artist, Playlist, Album } from "@/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { SearchContent } from "./search-interface-components";
import * as SearchService from "@/services/searchService";

interface SearchInterfaceProps {
  onAddSong: (mediaItem: MediaItem) => Promise<void>;
  isConnected: boolean;
}

type SearchTab = "search" | "playlist";
type ArtistViewMode = "artists" | "songs";
type PlaylistViewMode = "playlists" | "songs";
type AlbumViewMode = "albums" | "songs";

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
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Unified search results
  const [songResults, setSongResults] = useState<MediaItem[]>([]);
  const [artistResults, setArtistResults] = useState<Artist[]>([]);
  const [albumResults, setAlbumResults] = useState<Album[]>([]);

  // Playlist results (separate from unified search)
  const [playlistResults, setPlaylistResults] = useState<Playlist[]>([]);

  // Section collapse states
  const [isArtistSectionCollapsed, setIsArtistSectionCollapsed] =
    useState(false);
  const [isSongSectionCollapsed, setIsSongSectionCollapsed] = useState(false);
  const [isAlbumSectionCollapsed, setIsAlbumSectionCollapsed] = useState(false);

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
  const [addingSongId, setAddingSongId] = useState<string | null>(null);

  // Unified search function that searches artists, albums, and songs
  const performUnifiedSearch = useCallback(
    async (query: string, page: number = 1, append: boolean = false) => {
      if (!query.trim()) {
        setSongResults([]);
        setArtistResults([]);
        setAlbumResults([]);
        setHasSearched(false);
        setHasMoreResults(true);
        setCurrentPage(1);
        return;
      }

      if (page === 1) {
        setIsLoading(true);
        if (!append) {
          setSongResults([]);
          setArtistResults([]);
          setAlbumResults([]);
        }
      } else {
        setIsLoadingMore(true);
      }

      setError(null);
      setHasSearched(true);

      try {
        const results = await SearchService.performUnifiedSearch({
          query,
          page,
        });

        // Process results
        if (append && page > 1) {
          setArtistResults(prev =>
            SearchService.mergeUniqueResults(prev, results.artists)
          );
          setAlbumResults(prev =>
            SearchService.mergeUniqueResults(prev, results.albums)
          );
          setSongResults(prev =>
            SearchService.mergeUniqueResults(prev, results.songs)
          );
        } else {
          setArtistResults(results.artists);
          setAlbumResults(results.albums);
          setSongResults(results.songs);
        }

        setHasMoreResults(results.hasMore);
        setCurrentPage(page);

        if (results.error) {
          setError(results.error);
        }
      } catch (err) {
        console.error("Unified search wrapper error:", err);
        setError("Failed to connect to server");
        if (!append) {
          setSongResults([]);
          setArtistResults([]);
          setAlbumResults([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Get songs by album ID
  const getSongsByAlbum = useCallback(
    async (album: Album, page: number = 1, append: boolean = false) => {
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
          `/api/albums/${album.id}/songs?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];

          if (append && page > 1) {
            setSongResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          setHasMoreResults(hasMore);
          setCurrentPage(page);
        } else {
          setError(data.error?.message || "Failed to get songs by album");
          if (!append) {
            setSongResults([]);
          }
        }
      } catch (err) {
        console.error("Get songs by album error:", err);
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

  // Get songs by artist ID
  const getSongsByArtist = useCallback(
    async (artist: Artist, page: number = 1, append: boolean = false) => {
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
          if (append && page > 1) {
            setSongResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
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

          if (append) {
            setPlaylistResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by playlist.id
              const uniquePlaylists = combined.filter(
                (playlist, index, arr) =>
                  arr.findIndex(p => p.id === playlist.id) === index
              );
              return uniquePlaylists;
            });
          } else {
            setPlaylistResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
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

          if (append) {
            setSongResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by song.id
              const uniqueSongs = combined.filter(
                (song, index, arr) =>
                  arr.findIndex(s => s.id === song.id) === index
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
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

          if (append && page > 1) {
            setArtistResults(prev => {
              const combined = [...prev, ...newResults];
              // Filter out duplicates by artist.id
              const uniqueArtists = combined.filter(
                (artist, index, arr) =>
                  arr.findIndex(a => a.id === artist.id) === index
              );
              return uniqueArtists;
            });
          } else {
            setArtistResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
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
          // Load more unified search resultsawait performUnifiedSearch(searchQuery, currentPage + 1, true);
        } else {
          // Load more artists (initial browse)
          await loadMoreArtists(currentPage + 1, true);
        }
      } else if (selectedArtist) {
        // Load more songs for selected artistawait getSongsByArtist(selectedArtist, currentPage + 1, true);
      } else if (selectedAlbum) {
        // Load more songs for selected albumawait getSongsByAlbum(selectedAlbum, currentPage + 1, true);
      }
    } else if (activeTab === "playlist") {
      if (playlistViewMode === "playlists") {
        await getPlaylists(currentPage + 1, true);
      } else if (selectedPlaylist) {
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
    selectedAlbum,
    currentPage,
    hasMoreResults,
    isLoadingMore,
    isLoading,
    performUnifiedSearch,
    loadMoreArtists,
    getSongsByArtist,
    getSongsByAlbum,
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
    setAlbumResults([]);
    setPlaylistResults([]);
    setHasSearched(false);
    setError(null);
    setHasMoreResults(true);
    setCurrentPage(1);
    setArtistViewMode("artists");
    setPlaylistViewMode("playlists");
    setSelectedArtist(null);
    setSelectedPlaylist(null);
    setSelectedAlbum(null);

    // Reset collapse states
    setIsArtistSectionCollapsed(false);
    setIsSongSectionCollapsed(false);
    setIsAlbumSectionCollapsed(false);

    // Auto-load playlists when switching to playlist tab
    if (tab === "playlist") {
      getPlaylists();
    }
  };

  // Handle album selection
  const handleAlbumSelect = async (album: Album) => {
    setSelectedAlbum(album);
    setArtistViewMode("songs"); // Reuse the same view mode for consistency
    setCurrentPage(1);
    setHasMoreResults(true);
    await getSongsByAlbum(album);
  };

  // Handle back to albums view
  const handleBackToAlbums = () => {
    setArtistViewMode("artists"); // Reset to main search view
    setSelectedAlbum(null);
    setSongResults([]);
    setCurrentPage(1);
    setHasMoreResults(true);

    // Reset collapse states
    setIsArtistSectionCollapsed(false);
    setIsSongSectionCollapsed(false);
    setIsAlbumSectionCollapsed(false);
  };

  // Handle artist selection
  const handleArtistSelect = async (artist: Artist) => {
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
    setSelectedAlbum(null);
    setSongResults([]);
    setCurrentPage(1);
    setHasMoreResults(true);

    // Reset collapse states
    setIsArtistSectionCollapsed(false);
    setIsSongSectionCollapsed(false);
    setIsAlbumSectionCollapsed(false);
  };

  // Handle playlist selection
  const handlePlaylistSelect = async (playlist: Playlist) => {
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

    setAddingSongId(song.id);

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
    } finally {
      setAddingSongId(null);
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
        return "Search for artists, albums, and songs...";
      } else if (selectedArtist) {
        return `Search songs by ${selectedArtist.name}...`;
      } else if (selectedAlbum) {
        return `Search songs in ${selectedAlbum.name}...`;
      }
    }
    return "Search...";
  };

  const getEmptyStateText = () => {
    if (activeTab === "search") {
      if (artistViewMode === "artists") {
        return "Try searching by artist name, album title, or song title";
      } else if (selectedArtist) {
        return `No songs found for ${selectedArtist.name}`;
      } else if (selectedAlbum) {
        return `No songs found in ${selectedAlbum.name}`;
      }
    }
    return "No results found";
  };

  return (
    <div className="flex flex-col h-full">
      <SearchContent
        // State
        activeTab={activeTab}
        artistViewMode={artistViewMode}
        playlistViewMode={playlistViewMode}
        searchQuery={searchQuery}
        selectedArtist={selectedArtist}
        selectedAlbum={selectedAlbum}
        selectedPlaylist={selectedPlaylist}
        // Results
        songResults={songResults}
        artistResults={artistResults}
        albumResults={albumResults}
        playlistResults={playlistResults}
        // Loading states
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasSearched={hasSearched}
        hasMoreResults={hasMoreResults}
        error={error}
        addingSongId={addingSongId}
        isConnected={isConnected}
        // Collapse states
        isArtistSectionCollapsed={isArtistSectionCollapsed}
        isSongSectionCollapsed={isSongSectionCollapsed}
        isAlbumSectionCollapsed={isAlbumSectionCollapsed}
        // Event handlers
        handleTabChange={handleTabChange}
        handleSearchInputChange={e => setSearchQuery(e.target.value)}
        handleSearchSubmit={e => e.preventDefault()}
        handleArtistSelect={handleArtistSelect}
        handleAlbumSelect={handleAlbumSelect}
        handlePlaylistSelect={handlePlaylistSelect}
        handleBackToArtists={handleBackToArtists}
        handleBackToAlbums={handleBackToAlbums}
        handleBackToPlaylists={handleBackToPlaylists}
        handleAddSong={handleAddSong}
        handleLoadMore={handleLoadMore}
        setIsArtistSectionCollapsed={setIsArtistSectionCollapsed}
        setIsSongSectionCollapsed={setIsSongSectionCollapsed}
        setIsAlbumSectionCollapsed={setIsAlbumSectionCollapsed}
        // Utility functions
        formatDuration={formatDuration}
        getPlaceholderText={getPlaceholderText}
      />

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
