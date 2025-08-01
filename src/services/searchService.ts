import { MediaItem, Artist, Album, Playlist } from "@/types";

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  startIndex?: number;
}

export interface SearchResults {
  artists: Artist[];
  albums: Album[];
  songs: MediaItem[];
  hasMore: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  error?: string;
}

/**
 * Performs a unified search across artists, albums, and songs
 */
export async function performUnifiedSearch(
  options: SearchOptions
): Promise<SearchResults> {
  const { query, page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  if (!query.trim()) {
    return {
      artists: [],
      albums: [],
      songs: [],
      hasMore: false,
    };
  }

  console.log(`Performing unified search for "${query}" - page ${page}`);

  try {
    // Search artists, albums, and songs in parallel
    const [artistResponse, albumResponse, songResponse] = await Promise.all([
      fetch(
        `/api/artists?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
      ),
      fetch(
        `/api/albums?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
      ),
      fetch(
        `/api/songs/title?q=${encodeURIComponent(query.trim())}&limit=${limit}&startIndex=${startIndex}`
      ),
    ]);

    const [artistData, albumData, songData] = await Promise.all([
      artistResponse.json(),
      albumResponse.json(),
      songResponse.json(),
    ]);

    // Process results
    const artists = artistData.success ? artistData.data || [] : [];
    const albums = albumData.success ? albumData.data || [] : [];
    const songs = songData.success ? songData.data || [] : [];

    console.log(
      `Got ${artists.length} artists, ${albums.length} albums, ${songs.length} songs for page ${page}`
    );

    // Check if there are more results (if any endpoint has more)
    const artistHasMore = artistData.success && artists.length === limit;
    const albumHasMore = albumData.success && albums.length === limit;
    const songHasMore = songData.success && songs.length === limit;
    const hasMore = artistHasMore || albumHasMore || songHasMore;

    console.log(
      `Has more results: ${hasMore} (artists: ${artistHasMore}, albums: ${albumHasMore}, songs: ${songHasMore})`
    );

    // Set error if all searches failed
    let error: string | undefined;
    if (!artistData.success && !albumData.success && !songData.success) {
      error = "Failed to search artists, albums, and songs";
    } else if (!artistData.success && !albumData.success) {
      error = "Failed to search artists and albums";
    } else if (!artistData.success && !songData.success) {
      error = "Failed to search artists and songs";
    } else if (!albumData.success && !songData.success) {
      error = "Failed to search albums and songs";
    } else if (!artistData.success) {
      error = "Failed to search artists";
    } else if (!albumData.success) {
      error = "Failed to search albums";
    } else if (!songData.success) {
      error = "Failed to search songs";
    }

    return {
      artists,
      albums,
      songs,
      hasMore,
      error,
    };
  } catch (err) {
    console.error("Unified search error:", err);
    return {
      artists: [],
      albums: [],
      songs: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Loads more artists for browsing (without search query)
 */
export async function loadMoreArtists(
  options: SearchOptions
): Promise<PaginatedResponse<Artist>> {
  const { page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  console.log(`Loading more artists - page ${page}`);

  try {
    const response = await fetch(
      `/api/artists?limit=${limit}&startIndex=${startIndex}`
    );
    const data = await response.json();

    if (data.success) {
      const artists = data.data || [];
      const hasMore = artists.length === limit;

      console.log(
        `Got ${artists.length} artists for page ${page}, hasMore: ${hasMore}`
      );

      return {
        data: artists,
        hasMore,
      };
    } else {
      console.error("Load more artists failed:", data.error);
      return {
        data: [],
        hasMore: false,
        error: data.error || "Failed to load artists",
      };
    }
  } catch (err) {
    console.error("Load more artists error:", err);
    return {
      data: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Gets songs by artist ID
 */
export async function getSongsByArtist(
  artist: Artist,
  options: SearchOptions
): Promise<PaginatedResponse<MediaItem>> {
  const { page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  console.log(`Getting songs for artist "${artist.name}" - page ${page}`);

  try {
    const response = await fetch(
      `/api/artists/${artist.id}/songs?limit=${limit}&startIndex=${startIndex}`
    );
    const data = await response.json();

    if (data.success) {
      const songs = data.data || [];
      const hasMore = songs.length === limit;

      console.log(
        `Got ${songs.length} songs for artist "${artist.name}" - page ${page}`
      );

      return {
        data: songs,
        hasMore,
      };
    } else {
      console.error(
        `Get songs by artist failed for "${artist.name}":`,
        data.error
      );
      return {
        data: [],
        hasMore: false,
        error: data.error || "Failed to load artist songs",
      };
    }
  } catch (err) {
    console.error(`Get songs by artist error for "${artist.name}":`, err);
    return {
      data: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Gets songs by album ID
 */
export async function getSongsByAlbum(
  album: Album,
  options: SearchOptions
): Promise<PaginatedResponse<MediaItem>> {
  const { page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  console.log(`Getting songs for album "${album.name}" - page ${page}`);

  try {
    const response = await fetch(
      `/api/albums/${album.id}/songs?limit=${limit}&startIndex=${startIndex}`
    );
    const data = await response.json();

    if (data.success) {
      const songs = data.data || [];
      const hasMore = songs.length === limit;

      console.log(
        `Got ${songs.length} songs for album "${album.name}" - page ${page}`
      );

      return {
        data: songs,
        hasMore,
      };
    } else {
      console.error(
        `Get songs by album failed for "${album.name}":`,
        data.error
      );
      return {
        data: [],
        hasMore: false,
        error: data.error || "Failed to load album songs",
      };
    }
  } catch (err) {
    console.error(`Get songs by album error for "${album.name}":`, err);
    return {
      data: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Gets playlists
 */
export async function getPlaylists(
  options: SearchOptions
): Promise<PaginatedResponse<Playlist>> {
  const { page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  console.log(`Loading playlists - page ${page}`);

  try {
    const response = await fetch(
      `/api/playlists?limit=${limit}&startIndex=${startIndex}`
    );
    const data = await response.json();

    if (data.success) {
      const playlists = data.data || [];
      const hasMore = playlists.length === limit;

      console.log(`Got ${playlists.length} playlists for page ${page}`);

      return {
        data: playlists,
        hasMore,
      };
    } else {
      console.error("Get playlists failed:", data.error);
      return {
        data: [],
        hasMore: false,
        error: data.error || "Failed to load playlists",
      };
    }
  } catch (err) {
    console.error("Get playlists error:", err);
    return {
      data: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Gets songs by playlist ID
 */
export async function getSongsByPlaylist(
  playlist: Playlist,
  options: SearchOptions
): Promise<PaginatedResponse<MediaItem>> {
  const { page = 1, limit = 50 } = options;
  const startIndex = (page - 1) * limit;

  console.log(`Getting songs for playlist "${playlist.name}" - page ${page}`);

  try {
    const response = await fetch(
      `/api/playlists/${playlist.id}/songs?limit=${limit}&startIndex=${startIndex}`
    );
    const data = await response.json();

    if (data.success) {
      const songs = data.data || [];
      const hasMore = songs.length === limit;

      console.log(
        `Got ${songs.length} songs for playlist "${playlist.name}" - page ${page}`
      );

      return {
        data: songs,
        hasMore,
      };
    } else {
      console.error(
        `Get songs by playlist failed for "${playlist.name}":`,
        data.error
      );
      return {
        data: [],
        hasMore: false,
        error: data.error || "Failed to load playlist songs",
      };
    }
  } catch (err) {
    console.error(`Get songs by playlist error for "${playlist.name}":`, err);
    return {
      data: [],
      hasMore: false,
      error: "Failed to connect to server",
    };
  }
}

/**
 * Utility function to merge results without duplicates
 */
export function mergeUniqueResults<T extends { id: string }>(
  existing: T[],
  newResults: T[]
): T[] {
  const combined = [...existing, ...newResults];
  const unique = combined.filter(
    (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
  );

  console.log(
    `Merged results: ${existing.length} + ${newResults.length} = ${combined.length} total, ${unique.length} unique (${combined.length - unique.length} duplicates removed)`
  );

  return unique;
}
