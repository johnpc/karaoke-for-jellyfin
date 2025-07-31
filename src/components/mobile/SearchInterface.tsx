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
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { MediaItem, Artist, Playlist, Album } from "@/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { LyricsIndicator } from "@/components/LyricsIndicator";

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

      console.log(
        `Performing unified search for "${query}" - page ${page}, append: ${append}`
      );

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
        const limit = 50;
        const startIndex = (page - 1) * limit;

        // Search artists, albums, and songs in parallel
        const [artistResponse, albumResponse, songResponse] = await Promise.all(
          [
            fetch(
              `/api/artists?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
            ),
            fetch(
              `/api/albums?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
            ),
            fetch(
              `/api/songs/title?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
            ),
          ]
        );

        const [artistData, albumData, songData] = await Promise.all([
          artistResponse.json(),
          albumResponse.json(),
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

        // Process album results
        if (albumData.success) {
          const newAlbumResults = albumData.data || [];
          console.log(
            `Got ${newAlbumResults.length} album results for page ${page}`
          );

          if (append && page > 1) {
            setAlbumResults(prev => {
              const combined = [...prev, ...newAlbumResults];
              // Filter out duplicates by album.id
              const uniqueAlbums = combined.filter(
                (album, index, arr) =>
                  arr.findIndex(a => a.id === album.id) === index
              );
              console.log(
                `Total album results after append: ${uniqueAlbums.length} (${combined.length - uniqueAlbums.length} duplicates removed)`
              );
              return uniqueAlbums;
            });
          } else {
            setAlbumResults(newAlbumResults);
          }
        } else {
          console.error("Album search failed:", albumData.error);
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

        // Check if there are more results (if any endpoint has more)
        const artistHasMore =
          artistData.success && (artistData.data || []).length === limit;
        const albumHasMore =
          albumData.success && (albumData.data || []).length === limit;
        const songHasMore =
          songData.success && (songData.data || []).length === limit;
        const hasMore = artistHasMore || albumHasMore || songHasMore;

        console.log(
          `Has more results: ${hasMore} (artists: ${artistHasMore}, albums: ${albumHasMore}, songs: ${songHasMore})`
        );
        setHasMoreResults(hasMore);
        setCurrentPage(page);

        // Set error if all searches failed
        if (!artistData.success && !albumData.success && !songData.success) {
          setError("Failed to search artists, albums, and songs");
        } else if (!artistData.success && !albumData.success) {
          setError("Failed to search artists and albums");
        } else if (!artistData.success && !songData.success) {
          setError("Failed to search artists and songs");
        } else if (!albumData.success && !songData.success) {
          setError("Failed to search albums and songs");
        } else if (!artistData.success) {
          setError("Failed to search artists");
        } else if (!albumData.success) {
          setError("Failed to search albums");
        } else if (!songData.success) {
          setError("Failed to search songs");
        }
      } catch (err) {
        console.error("Unified search error:", err);
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
      console.log(
        `Getting songs for album "${album.name}" - page ${page}, append: ${append}`
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
          `/api/albums/${album.id}/songs?limit=${limit}&startIndex=${startIndex}`
        );
        const data = await response.json();

        if (data.success) {
          const newResults = data.data || [];
          console.log(
            `Got ${newResults.length} songs for album "${album.name}" - page ${page}`
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
                `Total songs for album after append: ${uniqueSongs.length} (${combined.length - uniqueSongs.length} duplicates removed)`
              );
              return uniqueSongs;
            });
          } else {
            setSongResults(newResults);
          }

          // Check if there are more results
          const hasMore = newResults.length === limit;
          console.log(`Has more songs for album: ${hasMore}`);
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
      } else if (selectedAlbum) {
        // Load more songs for selected album
        console.log(
          `Loading more songs for album "${selectedAlbum.name}" - page ${currentPage + 1}`
        );
        await getSongsByAlbum(selectedAlbum, currentPage + 1, true);
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
    console.log(`Selected album: ${album.name}`);
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
            data-testid="playlist-tab"
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
        {/* Back button for artist/album songs view */}
        {activeTab === "search" &&
          artistViewMode === "songs" &&
          (selectedArtist || selectedAlbum) && (
            <div className="flex items-center mb-3">
              <button
                data-testid="back-button"
                onClick={
                  selectedArtist ? handleBackToArtists : handleBackToAlbums
                }
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
              data-testid="back-button"
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
              data-testid="search-input"
              placeholder={getPlaceholderText()}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base text-gray-900 placeholder-gray-500"
            />
          </div>
        )}

        {/* Artist/Album info header when viewing songs */}
        {activeTab === "search" &&
          artistViewMode === "songs" &&
          (selectedArtist || selectedAlbum) && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center">
                {selectedArtist ? (
                  <>
                    <UserIcon className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">
                      Songs by {selectedArtist.name}
                    </span>
                  </>
                ) : selectedAlbum ? (
                  <>
                    <RectangleStackIcon className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">
                      Songs in {selectedAlbum.name}
                      {selectedAlbum.artist && ` by ${selectedAlbum.artist}`}
                    </span>
                  </>
                ) : null}
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
          albumResults.length === 0 &&
          playlistResults.length === 0 && (
            <div
              data-testid="search-loading"
              className="flex items-center justify-center py-12"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">
                {activeTab === "search" && artistViewMode === "artists"
                  ? "Searching..."
                  : activeTab === "search" && artistViewMode === "songs"
                    ? selectedArtist
                      ? `Finding songs by ${selectedArtist.name}...`
                      : selectedAlbum
                        ? `Finding songs in ${selectedAlbum.name}...`
                        : "Finding songs..."
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
            albumResults.length === 0 &&
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
            <div
              data-testid="no-results"
              className="flex flex-col items-center justify-center py-12 px-4"
            >
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

        {/* Unified Search Results - Artists, Albums, and Songs */}
        {activeTab === "search" &&
          artistViewMode === "artists" &&
          hasSearched && (
            <div data-testid="search-results">
              {/* Artists Section */}
              {artistResults.length > 0 && (
                <div
                  data-testid="artist-results"
                  className="border-b border-gray-200"
                >
                  <button
                    data-testid={
                      isArtistSectionCollapsed
                        ? "expand-artists"
                        : "collapse-artists"
                    }
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
                          data-testid="artist-item"
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

              {/* Albums Section */}
              {albumResults.length > 0 && (
                <div
                  data-testid="album-results"
                  className="border-b border-gray-200"
                >
                  <button
                    onClick={() =>
                      setIsAlbumSectionCollapsed(!isAlbumSectionCollapsed)
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <RectangleStackIcon className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        Albums ({albumResults.length})
                      </span>
                    </div>
                    {isAlbumSectionCollapsed ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {!isAlbumSectionCollapsed && (
                    <div className="divide-y divide-gray-200">
                      {albumResults.map(album => (
                        <div
                          key={album.id}
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleAlbumSelect(album)}
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
              )}

              {/* Songs Section */}
              {songResults.length > 0 && (
                <div data-testid="song-results">
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
                          data-testid="song-item"
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
                              data-testid="add-song-button"
                              onClick={() => handleAddSong(song)}
                              disabled={
                                !isConnected || addingSongId === song.id
                              }
                              className="ml-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Add to queue"
                            >
                              {addingSongId === song.id ? (
                                <div
                                  data-testid="add-song-loading"
                                  className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                                ></div>
                              ) : (
                                <PlusIcon className="w-5 h-5" />
                              )}
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
            <div
              data-testid="artist-songs"
              className="divide-y divide-gray-200"
            >
              {songResults.map(song => (
                <div
                  key={song.id}
                  data-testid="song-item"
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
                      data-testid="add-song-button"
                      onClick={() => handleAddSong(song)}
                      disabled={!isConnected || addingSongId === song.id}
                      className="ml-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Add to queue"
                    >
                      {addingSongId === song.id ? (
                        <div
                          data-testid="add-song-loading"
                          className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                        ></div>
                      ) : (
                        <PlusIcon className="w-5 h-5" />
                      )}
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
                  data-testid="playlist-item"
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
            <div
              data-testid="playlist-songs"
              className="divide-y divide-gray-200"
            >
              {songResults.map(song => (
                <div
                  key={song.id}
                  data-testid="song-item"
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
                      data-testid="add-song-button"
                      onClick={() => handleAddSong(song)}
                      disabled={!isConnected || addingSongId === song.id}
                      className="ml-4 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Add to queue"
                    >
                      {addingSongId === song.id ? (
                        <div
                          data-testid="add-song-loading"
                          className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                        ></div>
                      ) : (
                        <PlusIcon className="w-5 h-5" />
                      )}
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
            (artistResults.length > 0 ||
              albumResults.length > 0 ||
              songResults.length > 0)) ||
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
                      ? selectedArtist
                        ? `Load More Songs by ${selectedArtist.name}`
                        : selectedAlbum
                          ? `Load More Songs from ${selectedAlbum.name}`
                          : "Load More Songs"
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
            (artistResults.length > 0 ||
              albumResults.length > 0 ||
              songResults.length > 0)) ||
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
                  ? `Found all results (${artistResults.length} artists, ${albumResults.length} albums, ${songResults.length} songs)`
                  : activeTab === "playlist" && playlistViewMode === "playlists"
                    ? `Found all playlists (${playlistResults.length} total)`
                    : activeTab === "search" && artistViewMode === "songs"
                      ? selectedArtist
                        ? `Found all songs by ${selectedArtist.name} (${songResults.length} total)`
                        : selectedAlbum
                          ? `Found all songs in ${selectedAlbum.name} (${songResults.length} total)`
                          : `No more songs found (${songResults.length} total)`
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
