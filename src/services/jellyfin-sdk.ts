// Jellyfin API integration service using the official SDK
import { Jellyfin, Api } from "@jellyfin/sdk";
import { MediaItem, Artist, Playlist } from "@/types";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export class JellyfinSDKService {
  private jellyfin: Jellyfin;
  private api: Api | null = null;
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private userId: string | null = null;
  private artistSearchCache: Map<string, Artist[]> | null = null;

  constructor() {
    this.baseUrl = process.env.JELLYFIN_SERVER_URL?.replace(/\/$/, "") || "";
    this.apiKey = process.env.JELLYFIN_API_KEY || "";
    this.username = process.env.JELLYFIN_USERNAME || "";

    if (!this.baseUrl || !this.apiKey || !this.username) {
      throw new Error(
        "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured"
      );
    }

    // Initialize the Jellyfin SDK
    this.jellyfin = new Jellyfin({
      clientInfo: {
        name: "Karaoke For Jellyfin",
        version: "1.0.0",
      },
      deviceInfo: {
        name: "Karaoke Server",
        id: "karaoke-server-001",
      },
    });

    // Create API instance with access token
    this.api = this.jellyfin.createApi(this.baseUrl, this.apiKey);
  }

  /**
   * Authenticate with Jellyfin and find user by username
   */
  async authenticate(): Promise<boolean> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    try {
      // Use fetch instead of axios instance to avoid base URL issues
      const usersUrl = `${this.baseUrl}/Users`;
      const response = await fetch(usersUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const users = await response.json();
      console.log(
        "Available users:",
        users?.map((u: any) => u.Name)
      );

      if (users && users.length > 0) {
        // Find user by username (case insensitive)
        const targetUser = users.find(
          (user: any) =>
            user.Name?.toLowerCase() === this.username.toLowerCase()
        );

        if (targetUser) {
          this.userId = targetUser.Id;
          console.log(
            `Authenticated as user: ${targetUser.Name} (ID: ${targetUser.Id})`
          );
          return true;
        } else {
          console.error(
            `User "${this.username}" not found. Available users:`,
            users.map((u: any) => u.Name)
          );
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Jellyfin authentication error:", error);
      return false;
    }
  }

  /**
   * Search for artists by name using the official SDK
   */
  async searchArtists(
    query: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<Artist[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Searching for artists: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch instead of axios instance to avoid base URL issues
      const params = new URLSearchParams({
        searchTerm: query,
        startIndex: startIndex.toString(),
        limit: limit.toString(),
        userId: this.userId!,
        fields: "Overview,ImageTags",
        recursive: "true",
      });

      const artistsUrl = `${this.baseUrl}/Artists?${params}`;
      const response = await fetch(artistsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);

      const artists = this.transformArtists(data.Items || []);
      console.log(`Transformed ${artists.length} artists`);

      return artists;
    } catch (error) {
      console.error("Jellyfin artist search error:", error);
      throw error;
    }
  }

  /**
   * Get all artists (without search query) using the official SDK
   */
  async getAllArtists(
    limit: number = 50,
    startIndex: number = 0
  ): Promise<Artist[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Getting all artists (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch instead of axios instance to avoid base URL issues
      const params = new URLSearchParams({
        startIndex: startIndex.toString(),
        limit: limit.toString(),
        userId: this.userId!,
        fields: "Overview,ImageTags",
        includeItemTypes: "MusicArtist",
        recursive: "true",
        sortBy: "SortName",
        sortOrder: "Ascending",
      });

      const artistsUrl = `${this.baseUrl}/Artists?${params}`;
      const response = await fetch(artistsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} artists`);

      const artists = this.transformArtists(data.Items || []);
      console.log(`Transformed ${artists.length} artists`);

      return artists;
    } catch (error) {
      console.error("Jellyfin get all artists error:", error);
      throw error;
    }
  }

  /**
   * Get all songs by a specific artist ID using the official SDK
   * This method uses artistIds filter which should get all songs where the artist is listed
   */
  async getSongsByArtistId(
    artistId: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<{ songs: MediaItem[]; totalCount: number }> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Getting songs for artist ID: ${artistId} (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch instead of axios instance to avoid base URL issues
      const params = new URLSearchParams({
        includeItemTypes: "Audio",
        recursive: "true",
        artistIds: artistId,
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks,HasLyrics", // Added HasLyrics field
        sortBy: "SortName", // Changed from "Album,SortName" to just "SortName" for better song discovery
        sortOrder: "Ascending",
        filters: "HasLyrics", // Filter to only include items with lyrics
      });

      const itemsUrl = `${this.baseUrl}/Items?${params}`;
      const response = await fetch(itemsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const totalCount = data.TotalRecordCount || 0;

      console.log(
        `Jellyfin returned ${data.Items?.length || 0} songs for artist ${artistId}`
      );
      console.log(`Total record count: ${totalCount}`);

      // Log some debug info about the query
      if (startIndex === 0) {
        console.log(`Artist search query URL: ${itemsUrl}`);
        console.log(`Total songs available for this artist: ${totalCount}`);
      }

      const songs = this.transformMediaItems(data.Items || []);
      console.log(`Transformed ${songs.length} songs`);

      return { songs, totalCount };
    } catch (error) {
      console.error("Jellyfin get songs by artist error:", error);
      throw error;
    }
  }

  /**
   * Search for audio items by title using the official SDK
   */
  async searchByTitle(
    query: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<MediaItem[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Searching by title: "${query}" (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch instead of axios instance to avoid base URL issues
      const params = new URLSearchParams({
        searchTerm: query,
        includeItemTypes: "Audio",
        recursive: "true",
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks,HasLyrics",
        filters: "HasLyrics", // Filter to only include items with lyrics
      });

      const itemsUrl = `${this.baseUrl}/Items?${params}`;
      const response = await fetch(itemsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `Jellyfin returned ${data.Items?.length || 0} items for title search`
      );

      const items = this.transformMediaItems(data.Items || []);

      // Filter by title for better relevance
      const queryLower = query.toLowerCase();
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(queryLower)
      );

      console.log(`After title filtering: ${filtered.length} items`);
      return filtered;
    } catch (error) {
      console.error("Jellyfin title search error:", error);
      throw error;
    }
  }

  /**
   * Get all audio items from Jellyfin library (for browsing)
   */
  async getAllAudioItems(
    startIndex: number = 0,
    limit: number = 100
  ): Promise<MediaItem[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      // Use fetch instead of axios instance to avoid base URL issues
      const params = new URLSearchParams({
        includeItemTypes: "Audio",
        recursive: "true",
        startIndex: startIndex.toString(),
        limit: limit.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks,HasLyrics",
        sortBy: "SortName",
        sortOrder: "Ascending",
        filters: "HasLyrics", // Filter to only include items with lyrics
      });

      const itemsUrl = `${this.baseUrl}/Items?${params}`;
      const response = await fetch(itemsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Jellyfin raw response:", {
        totalRecordCount: data.TotalRecordCount,
        itemsLength: data.Items?.length,
        firstItem: data.Items?.[0],
      });

      const transformedItems = this.transformMediaItems(data.Items);
      console.log("Transformed items count:", transformedItems.length);

      return transformedItems;
    } catch (error) {
      console.error("Jellyfin get audio items error:", error);
      throw error;
    }
  }

  /**
   * Get stream URL for a media item
   */
  getStreamUrl(itemId: string): string {
    // Use our proxy endpoint instead of direct Jellyfin URL to handle auth properly
    return `/api/stream/${itemId}`;
  }

  /**
   * Get direct Jellyfin stream URL (for internal use by proxy)
   */
  async getDirectStreamUrl(itemId: string): Promise<string> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("User ID not available - authentication required");
      }
    }
    // Use the proper streaming endpoint with required parameters
    return `${this.baseUrl}/Audio/${itemId}/universal?userId=${this.userId}&deviceId=karaoke-app&api_key=${this.apiKey}&container=mp3,aac,m4a,flac,webma,webm,wav,ogg`;
  }

  /**
   * Check if Jellyfin server is accessible
   */
  async healthCheck(): Promise<boolean> {
    if (!this.api) {
      return false;
    }

    try {
      // Use the full URL for health check instead of relying on axios base URL
      const healthUrl = `${this.baseUrl}/System/Info`;
      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Jellyfin health check failed:", error);
      return false;
    }
  }

  /**
   * Transform Jellyfin artists to our Artist format
   */
  private transformArtists(items: BaseItemDto[]): Artist[] {
    return items
      .filter(item => item.Type === "MusicArtist")
      .map(item => this.transformArtist(item))
      .filter(Boolean) as Artist[];
  }

  /**
   * Transform a single Jellyfin artist to our Artist format
   */
  private transformArtist(item: BaseItemDto): Artist | null {
    if (item.Type !== "MusicArtist") {
      return null;
    }

    return {
      id: `jellyfin_artist_${item.Id}`,
      name: item.Name || "Unknown Artist",
      jellyfinId: item.Id || "",
      imageUrl: item.ImageTags?.Primary
        ? `${this.baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&maxWidth=300&quality=90`
        : undefined,
    };
  }

  /**
   * Transform Jellyfin media items to our MediaItem format
   */
  private transformMediaItems(items: BaseItemDto[]): MediaItem[] {
    const transformedItems = items
      .map(item => this.transformMediaItem(item))
      .filter(Boolean) as MediaItem[];

    // Filter to only include songs with lyrics for karaoke
    const songsWithLyrics = transformedItems.filter(item => {
      const hasLyrics = item.hasLyrics === true;
      if (!hasLyrics) {
        console.log(
          `Filtering out "${item.title}" by ${item.artist} - no lyrics available`
        );
      }
      return hasLyrics;
    });

    return songsWithLyrics;
  }

  /**
   * Transform a single Jellyfin media item to our MediaItem format
   */
  private transformMediaItem(item: BaseItemDto): MediaItem | null {
    if (item.Type !== "Audio") {
      return null;
    }

    // Convert RunTimeTicks to seconds (Jellyfin uses 10,000,000 ticks per second)
    const duration = item.RunTimeTicks
      ? Math.round(item.RunTimeTicks / 10000000)
      : 0;

    return {
      id: `jellyfin_${item.Id}`,
      title: item.Name || "Unknown Title",
      artist: item.Artists?.join(", ") || "Unknown Artist",
      album: item.Album || undefined,
      duration,
      jellyfinId: item.Id || "",
      streamUrl: this.getStreamUrl(item.Id || ""),
      lyricsPath: this.detectLyricsPath(item),
      hasLyrics: item.HasLyrics === true, // Extract HasLyrics field from Jellyfin
    };
  }

  /**
   * Detect potential lyrics file path for a media item
   */
  private detectLyricsPath(item: BaseItemDto): string | undefined {
    // For now, we'll use the Jellyfin ID as the lyrics identifier
    return `jellyfin_${item.Id}`;
  }

  /**
   * Get all music playlists from Jellyfin
   */
  async getPlaylists(
    limit: number = 50,
    startIndex: number = 0
  ): Promise<Playlist[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Getting playlists (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch to get playlists
      const params = new URLSearchParams({
        includeItemTypes: "Playlist",
        recursive: "true",
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Overview,ChildCount,DateCreated",
        sortBy: "SortName",
        sortOrder: "Ascending",
      });

      const playlistsUrl = `${this.baseUrl}/Items?${params}`;
      const response = await fetch(playlistsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`Jellyfin returned ${data.Items?.length || 0} playlists`);

      const playlists = this.transformPlaylists(data.Items || []);
      console.log(`Transformed ${playlists.length} playlists`);

      return playlists;
    } catch (error) {
      console.error("Jellyfin get playlists error:", error);
      throw error;
    }
  }

  /**
   * Get songs from a specific playlist
   */
  async getPlaylistItems(
    playlistId: string,
    limit: number = 50,
    startIndex: number = 0
  ): Promise<MediaItem[]> {
    if (!this.api) {
      throw new Error("API not initialized");
    }

    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }

    try {
      console.log(
        `Getting playlist items for playlist ID: ${playlistId} (limit: ${limit}, startIndex: ${startIndex})`
      );

      // Use fetch to get playlist items
      const params = new URLSearchParams({
        limit: limit.toString(),
        startIndex: startIndex.toString(),
        userId: this.userId!,
        fields: "Artists,Album,RunTimeTicks,HasLyrics",
        filters: "HasLyrics", // Filter to only include items with lyrics
      });

      const playlistItemsUrl = `${this.baseUrl}/Playlists/${playlistId}/Items?${params}`;
      const response = await fetch(playlistItemsUrl, {
        method: "GET",
        headers: {
          "X-Emby-Token": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `Jellyfin returned ${data.Items?.length || 0} items for playlist ${playlistId}`
      );

      // Filter only audio items and transform them
      const audioItems = (data.Items || []).filter(
        (item: BaseItemDto) => item.Type === "Audio"
      );
      const songs = this.transformMediaItems(audioItems);
      console.log(`Transformed ${songs.length} songs from playlist`);

      return songs;
    } catch (error) {
      console.error("Jellyfin get playlist items error:", error);
      throw error;
    }
  }

  /**
   * Transform Jellyfin playlists to our Playlist format
   */
  private transformPlaylists(items: BaseItemDto[]): Playlist[] {
    return items
      .filter(item => item.Type === "Playlist")
      .map(item => ({
        id: `jellyfin_playlist_${item.Id}`,
        name: item.Name || "Unknown Playlist",
        jellyfinId: item.Id || "",
        imageUrl: item.ImageTags?.Primary
          ? `${this.baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&maxWidth=300&quality=90`
          : undefined,
        trackCount: item.ChildCount || 0,
        description: item.Overview || undefined,
        createdAt: item.DateCreated ? new Date(item.DateCreated) : undefined,
      }));
  }
}

// Singleton instance
let jellyfinSDKService: JellyfinSDKService | null = null;

export function getJellyfinSDKService(): JellyfinSDKService {
  if (!jellyfinSDKService) {
    jellyfinSDKService = new JellyfinSDKService();
  }
  return jellyfinSDKService;
}
