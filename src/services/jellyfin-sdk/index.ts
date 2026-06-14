// Re-export the public API for the Jellyfin SDK service
import { JellyfinSDKService } from "./client";

export { JellyfinSDKService };

// Singleton instance
let jellyfinSDKService: JellyfinSDKService | null = null;

export function getJellyfinSDKService(): JellyfinSDKService {
  if (!jellyfinSDKService) {
    jellyfinSDKService = new JellyfinSDKService();
  }
  return jellyfinSDKService;
}
