import { SearchOptions, SearchResults } from "./types";
import { buildSearchErrorMessage } from "./helpers";

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

    const artists = artistData.success ? artistData.data || [] : [];
    const albums = albumData.success ? albumData.data || [] : [];
    const songs = songData.success ? songData.data || [] : [];

    console.log(
      `Got ${artists.length} artists, ${albums.length} albums, ${songs.length} songs for page ${page}`
    );

    const artistHasMore = artistData.success && artists.length === limit;
    const albumHasMore = albumData.success && albums.length === limit;
    const songHasMore = songData.success && songs.length === limit;
    const hasMore = artistHasMore || albumHasMore || songHasMore;

    console.log(
      `Has more results: ${hasMore} (artists: ${artistHasMore}, albums: ${albumHasMore}, songs: ${songHasMore})`
    );

    const error = buildSearchErrorMessage(
      artistData.success,
      albumData.success,
      songData.success
    );

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
