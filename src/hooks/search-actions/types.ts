import { MediaItem, Artist, Album, Playlist } from "@/types";
import * as SearchService from "@/services/searchService";

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  return items.filter(
    (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
  );
}

export interface FetchContext {
  setIsLoading: (v: boolean) => void;
  setIsLoadingMore: (v: boolean) => void;
  setError: (v: string | null) => void;
  setHasMoreResults: (v: boolean) => void;
  setCurrentPage: (v: number) => void;
}

export interface UnifiedSearchContext extends FetchContext {
  setSongResults: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setArtistResults: React.Dispatch<React.SetStateAction<Artist[]>>;
  setAlbumResults: React.Dispatch<React.SetStateAction<Album[]>>;
  setHasSearched: (v: boolean) => void;
}

export interface SongFetchContext extends FetchContext {
  setSongResults: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

export interface PlaylistFetchContext extends FetchContext {
  setPlaylistResults: React.Dispatch<React.SetStateAction<Playlist[]>>;
  setHasSearched: (v: boolean) => void;
}

export interface ArtistFetchContext extends FetchContext {
  setArtistResults: React.Dispatch<React.SetStateAction<Artist[]>>;
}

export function clearUnifiedResults(ctx: UnifiedSearchContext): void {
  ctx.setSongResults([]);
  ctx.setArtistResults([]);
  ctx.setAlbumResults([]);
  ctx.setHasSearched(false);
  ctx.setHasMoreResults(true);
  ctx.setCurrentPage(1);
}

export function applyUnifiedResults(
  ctx: UnifiedSearchContext,
  results: {
    artists: Artist[];
    albums: Album[];
    songs: MediaItem[];
    hasMore: boolean;
    error?: string;
  },
  append: boolean,
  page: number
): void {
  if (append && page > 1) {
    ctx.setArtistResults(prev =>
      SearchService.mergeUniqueResults(prev, results.artists)
    );
    ctx.setAlbumResults(prev =>
      SearchService.mergeUniqueResults(prev, results.albums)
    );
    ctx.setSongResults(prev =>
      SearchService.mergeUniqueResults(prev, results.songs)
    );
  } else {
    ctx.setArtistResults(results.artists);
    ctx.setAlbumResults(results.albums);
    ctx.setSongResults(results.songs);
  }
  ctx.setHasMoreResults(results.hasMore);
  ctx.setCurrentPage(page);
  if (results.error) {
    ctx.setError(results.error);
  }
}
