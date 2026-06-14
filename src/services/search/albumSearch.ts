import { Album, MediaItem } from "@/types";
import { SearchOptions, PaginatedResponse } from "./types";

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
