// Jellyfin service — composed class and re-exports
import { MediaItem, Album, Artist } from "@/types";
import { JellyfinClient } from "./client";
import { searchArtists } from "./artists";
import { searchAlbums, getSongsByAlbumId } from "./albums";
import {
  getSongsByArtistId,
  getAllAudioItems,
  getMediaMetadata,
} from "./songs";
import { getLyrics, hasLyrics } from "./lyrics";
import { performSearch, sortByRelevance, searchByArtist } from "./search";

export type { JellyfinContext } from "./types";
export type {
  JellyfinAuthResponse,
  JellyfinMediaItem,
  JellyfinArtist,
  JellyfinAlbum,
  JellyfinSearchResponse,
  JellyfinArtistSearchResponse,
  JellyfinAlbumSearchResponse,
} from "./types";

export class JellyfinService extends JellyfinClient {
  private artistSearchCache: Map<string, MediaItem[]> = new Map();

  async searchMedia(query: string, limit: number = 50): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    const [byName, byArtist] = await Promise.all([
      performSearch(ctx, query, limit, "Name"),
      performSearch(ctx, query, limit, "Artists"),
    ]);

    const unique = new Map<string, MediaItem>();
    [...byName, ...byArtist].forEach(item => {
      if (!unique.has(item.id)) unique.set(item.id, item);
    });

    return sortByRelevance(Array.from(unique.values()), query).slice(0, limit);
  }

  async searchByTitle(query: string, limit: number = 50): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    return performSearch(ctx, query, limit, "Name");
  }

  async searchArtists(
    query: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<Artist[]> {
    const ctx = await this.ensureAuth();
    return searchArtists(ctx, query, limit, startIndex);
  }

  async searchAlbums(
    query: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<Album[]> {
    const ctx = await this.ensureAuth();
    return searchAlbums(ctx, query, limit, startIndex);
  }

  async getSongsByAlbumId(
    albumId: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    return getSongsByAlbumId(ctx, albumId, limit, startIndex);
  }

  async getSongsByArtistId(
    artistId: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    return getSongsByArtistId(ctx, artistId, limit, startIndex);
  }

  async searchByArtist(
    query: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    return searchByArtist(
      ctx,
      query,
      limit,
      startIndex,
      this.artistSearchCache
    );
  }

  async getAllAudioItems(
    startIndex: number = 0,
    limit: number = 100
  ): Promise<MediaItem[]> {
    const ctx = await this.ensureAuth();
    return getAllAudioItems(ctx, startIndex, limit);
  }

  async getMediaMetadata(itemId: string): Promise<MediaItem | null> {
    const ctx = await this.ensureAuth();
    return getMediaMetadata(ctx, itemId);
  }

  async getLyrics(itemId: string): Promise<string | unknown[] | null> {
    const ctx = await this.ensureAuth();
    return getLyrics(ctx, itemId);
  }

  async hasLyrics(itemId: string): Promise<boolean> {
    const ctx = await this.ensureAuth();
    return hasLyrics(ctx, itemId);
  }
}

// Singleton instance
let jellyfinService: JellyfinService | null = null;

export function getJellyfinService(): JellyfinService {
  if (!jellyfinService) {
    jellyfinService = new JellyfinService();
  }
  return jellyfinService;
}
