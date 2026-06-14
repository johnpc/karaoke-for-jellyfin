import { Artist, MediaItem } from "@/types";
import { SearchOptions, PaginatedResponse } from "./types";

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
