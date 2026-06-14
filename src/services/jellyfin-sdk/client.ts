// Jellyfin SDK client — initialization and orchestration
import { Jellyfin, Api } from "@jellyfin/sdk";
import { MediaItem, Artist, Playlist } from "@/types";
import { JellyfinContext, SongResult } from "./types";
import { authenticateUser, fetchMusicLibraryId, checkHealth } from "./auth";
import { searchArtists, getAllArtists } from "./artists";
import { getSongsByArtistId, searchByTitle, getAllAudioItems } from "./songs";
import { getPlaylists, getPlaylistItems } from "./playlists";

export class JellyfinSDKService {
  private jellyfin: Jellyfin;
  private api: Api | null = null;
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private userId: string | null = null;
  private musicLibraryId: string | null = null;

  constructor() {
    this.baseUrl = process.env.JELLYFIN_SERVER_URL?.replace(/\/$/, "") || "";
    this.apiKey = process.env.JELLYFIN_API_KEY || "";
    this.username = process.env.JELLYFIN_USERNAME || "";

    if (!this.baseUrl || !this.apiKey || !this.username) {
      throw new Error(
        "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured"
      );
    }

    this.jellyfin = new Jellyfin({
      clientInfo: { name: "Karaoke For Jellyfin", version: "1.0.0" },
      deviceInfo: { name: "Karaoke Server", id: "karaoke-server-001" },
    });

    this.api = this.jellyfin.createApi(this.baseUrl, this.apiKey);
  }

  private async getMusicLibraryId(): Promise<string | null> {
    if (this.musicLibraryId) return this.musicLibraryId;
    this.musicLibraryId = await fetchMusicLibraryId(this.baseUrl, this.apiKey);
    return this.musicLibraryId;
  }

  async authenticate(): Promise<boolean> {
    if (!this.api) throw new Error("API not initialized");
    const userId = await authenticateUser(
      this.baseUrl,
      this.apiKey,
      this.username
    );
    if (userId) {
      this.userId = userId;
      return true;
    }
    return false;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.api) throw new Error("API not initialized");
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }
  }

  private getContext(): JellyfinContext {
    return {
      api: this.api!,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      userId: this.userId!,
    };
  }

  async searchArtists(
    query: string,
    limit = 50,
    startIndex = 0
  ): Promise<Artist[]> {
    await this.ensureAuthenticated();
    const libId = await this.getMusicLibraryId();
    return searchArtists(this.getContext(), query, limit, startIndex, libId);
  }

  async getAllArtists(limit = 50, startIndex = 0): Promise<Artist[]> {
    await this.ensureAuthenticated();
    const libId = await this.getMusicLibraryId();
    return getAllArtists(this.getContext(), limit, startIndex, libId);
  }

  async getSongsByArtistId(
    artistId: string,
    limit = 50,
    startIndex = 0
  ): Promise<SongResult> {
    await this.ensureAuthenticated();
    return getSongsByArtistId(this.getContext(), artistId, limit, startIndex);
  }

  async searchByTitle(
    query: string,
    limit = 50,
    startIndex = 0
  ): Promise<MediaItem[]> {
    await this.ensureAuthenticated();
    return searchByTitle(this.getContext(), query, limit, startIndex);
  }

  async getAllAudioItems(startIndex = 0, limit = 100): Promise<MediaItem[]> {
    await this.ensureAuthenticated();
    return getAllAudioItems(this.getContext(), startIndex, limit);
  }

  getStreamUrl(itemId: string): string {
    return `/api/stream/${itemId}`;
  }

  async getDirectStreamUrl(itemId: string): Promise<string> {
    await this.ensureAuthenticated();
    return `${this.baseUrl}/Audio/${itemId}/universal?userId=${this.userId}&deviceId=karaoke-app&api_key=${this.apiKey}&container=mp3,aac,m4a,flac,webma,webm,wav,ogg`;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.api) return false;
    return checkHealth(this.baseUrl, this.apiKey);
  }

  async getPlaylists(limit = 50, startIndex = 0): Promise<Playlist[]> {
    await this.ensureAuthenticated();
    return getPlaylists(this.getContext(), limit, startIndex);
  }

  async getPlaylistItems(
    playlistId: string,
    limit = 50,
    startIndex = 0
  ): Promise<MediaItem[]> {
    await this.ensureAuthenticated();
    return getPlaylistItems(this.getContext(), playlistId, limit, startIndex);
  }
}
