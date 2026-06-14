import { Playlist, MediaItem } from "@/types";
import { SearchOptions, PaginatedResponse } from "./types";

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
