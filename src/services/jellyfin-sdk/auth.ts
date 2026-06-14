// Authentication and library discovery for the Jellyfin SDK service

interface VirtualFolder {
  CollectionType?: string;
  ItemId?: string;
}

interface JellyfinUser {
  Id?: string;
  Name?: string;
}

/**
 * Find the Music library ID from Jellyfin virtual folders
 */
export async function fetchMusicLibraryId(
  baseUrl: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/Library/VirtualFolders`, {
      method: "GET",
      headers: {
        "X-Emby-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const libraries: VirtualFolder[] = await response.json();
    const musicLibrary = libraries.find(lib => lib.CollectionType === "music");

    if (musicLibrary) {
      console.log(`Found Music library with ID: ${musicLibrary.ItemId}`);
      return musicLibrary.ItemId ?? null;
    }

    console.warn("No Music library found");
    return null;
  } catch (error) {
    console.error("Error getting Music library ID:", error);
    return null;
  }
}

/**
 * Authenticate with Jellyfin by finding a user matching the given username.
 * Returns the user ID on success, or null on failure.
 */
export async function authenticateUser(
  baseUrl: string,
  apiKey: string,
  username: string
): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/Users`, {
      method: "GET",
      headers: {
        "X-Emby-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const users: JellyfinUser[] = await response.json();
    console.log(
      "Available users:",
      users?.map(u => u.Name)
    );

    if (!users || users.length === 0) return null;

    const targetUser = users.find(
      user => user.Name?.toLowerCase() === username.toLowerCase()
    );

    if (targetUser) {
      console.log(
        `Authenticated as user: ${targetUser.Name} (ID: ${targetUser.Id})`
      );
      return targetUser.Id ?? null;
    }

    console.error(
      `User "${username}" not found. Available users:`,
      users.map(u => u.Name)
    );
    return null;
  } catch (error) {
    console.error("Jellyfin authentication error:", error);
    return null;
  }
}

/**
 * Health check against Jellyfin system info endpoint
 */
export async function checkHealth(
  baseUrl: string,
  apiKey: string
): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/System/Info`, {
      method: "GET",
      headers: {
        "X-Emby-Token": apiKey,
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.error("Jellyfin health check failed:", error);
    return false;
  }
}
