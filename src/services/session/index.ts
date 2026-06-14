// Re-exports for @/services/session
export { KaraokeSessionManager } from "./session-manager";
export type { SessionStats, EventCallback, SessionEventType } from "./types";

// Singleton instance
import { KaraokeSessionManager } from "./session-manager";

let sessionManager: KaraokeSessionManager | null = null;

export function getSessionManager(): KaraokeSessionManager {
  if (!sessionManager) {
    sessionManager = new KaraokeSessionManager();
  }
  return sessionManager;
}
