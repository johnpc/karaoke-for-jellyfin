// Jellyfin connection, authentication, and health check
import type { JellyfinContext } from "./types";

interface JellyfinUser {
  Id: string;
  Name: string;
}

export class JellyfinClient {
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private userId: string | null = null;

  constructor() {
    this.baseUrl = process.env.JELLYFIN_SERVER_URL?.replace(/\/$/, "") || "";
    this.apiKey = process.env.JELLYFIN_API_KEY || "";
    this.username = process.env.JELLYFIN_USERNAME || "";

    if (!this.baseUrl || !this.apiKey || !this.username) {
      throw new Error(
        "JELLYFIN_SERVER_URL, JELLYFIN_API_KEY, and JELLYFIN_USERNAME must be configured"
      );
    }
  }

  /**
   * Authenticate with Jellyfin using API key and find user by username
   */
  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/Users`, {
        headers: this.headers(),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const users: JellyfinUser[] = await response.json();
      console.log(
        "Available users:",
        users?.map(u => u.Name)
      );

      if (!users || users.length === 0) return false;

      const targetUser = users.find(
        user => user.Name?.toLowerCase() === this.username.toLowerCase()
      );

      if (targetUser) {
        this.userId = targetUser.Id;
        console.log(
          `Authenticated as user: ${targetUser.Name} (ID: ${targetUser.Id})`
        );
        return true;
      }

      console.error(
        `User "${this.username}" not found. Available users:`,
        users.map(u => u.Name)
      );
      return false;
    } catch (error) {
      console.error("Jellyfin authentication error:", error);
      return false;
    }
  }

  /**
   * Ensure the client is authenticated and return context for other modules
   */
  async ensureAuth(): Promise<JellyfinContext> {
    if (!this.userId) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error("Failed to authenticate with Jellyfin");
      }
    }
    return { baseUrl: this.baseUrl, apiKey: this.apiKey, userId: this.userId! };
  }

  /**
   * Check if Jellyfin server is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/System/Info`, {
        headers: { "X-Emby-Token": this.apiKey },
      });
      return response.ok;
    } catch (error) {
      console.error("Jellyfin health check failed:", error);
      return false;
    }
  }

  /**
   * Get stream URL for a media item (proxy endpoint)
   */
  getStreamUrl(itemId: string): string {
    return `/api/stream/${itemId}`;
  }

  /**
   * Get direct Jellyfin stream URL (for internal use by proxy)
   */
  async getDirectStreamUrl(itemId: string): Promise<string> {
    const ctx = await this.ensureAuth();
    return `${ctx.baseUrl}/Audio/${itemId}/universal?userId=${ctx.userId}&deviceId=karaoke-app&api_key=${ctx.apiKey}&container=mp3,aac,m4a,flac,webma,webm,wav,ogg`;
  }

  /**
   * Get user library views
   */
  async getLibraries(): Promise<unknown[]> {
    if (!this.userId) {
      await this.authenticate();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Users/${this.userId}/Views`,
        { headers: this.headers() }
      );

      if (!response.ok) {
        throw new Error(`Failed to get libraries: ${response.status}`);
      }

      const data = await response.json();
      return data.Items || [];
    } catch (error) {
      console.error("Failed to get libraries:", error);
      return [];
    }
  }

  /** Standard headers for Jellyfin API calls */
  headers(): Record<string, string> {
    return {
      "X-Emby-Token": this.apiKey,
      "Content-Type": "application/json",
    };
  }
}
