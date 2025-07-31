/// <reference types="cypress" />

// Custom commands for Karaoke app testing

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Set up user for karaoke session
       * @param username - Username to use for the session
       */
      setupUser(username?: string): Chainable<void>;

      /**
       * Wait for WebSocket connection to be established
       */
      waitForWebSocketConnection(): Chainable<void>;

      /**
       * Search for content in the search interface
       * @param query - Search query string
       */
      searchFor(query: string): Chainable<void>;

      /**
       * Add a song to the queue
       * @param songTitle - Title of the song to add
       */
      addSongToQueue(songTitle: string): Chainable<void>;

      /**
       * Remove a song from the queue
       * @param songTitle - Title of the song to remove
       */
      removeSongFromQueue(songTitle: string): Chainable<void>;

      /**
       * Navigate to a specific tab in the mobile interface
       * @param tab - Tab name ('search' or 'queue')
       */
      navigateToTab(tab: "search" | "queue"): Chainable<void>;

      /**
       * Mock Jellyfin API responses for testing
       */
      mockJellyfinAPI(): Chainable<void>;

      /**
       * Wait for search results to load
       */
      waitForSearchResults(): Chainable<void>;

      /**
       * Check if admin controls are visible and functional
       */
      verifyAdminControls(): Chainable<void>;
    }
  }
}

// Set up user command
Cypress.Commands.add("setupUser", (username = "Cypress Test User") => {
  // Clear any existing user data
  cy.clearLocalStorage();

  // Visit the home page
  cy.visit("/");

  // Check if user setup is required
  cy.get("body").then($body => {
    if ($body.find('[data-testid="user-setup"]').length > 0) {
      // Fill in username
      cy.get('[data-testid="username-input"]').type(username);
      cy.get('[data-testid="join-session-button"]').click();
    }
  });

  // Wait for connection
  cy.waitForWebSocketConnection();
});

// Wait for WebSocket connection
Cypress.Commands.add("waitForWebSocketConnection", () => {
  // Wait for connection indicator to show connected state or not exist
  cy.get("body").then($body => {
    if ($body.find('[data-testid="connection-status"]').length > 0) {
      cy.get('[data-testid="connection-status"]', { timeout: 10000 }).should(
        "contain",
        "Connected"
      );
    }
    // If connection status doesn't exist, that's also acceptable
  });
});

// Search command
Cypress.Commands.add("searchFor", (query: string) => {
  cy.get('[data-testid="search-input"]').clear().type(query);
  // Wait for debounce to complete
  cy.wait(500);
  cy.waitForSearchResults();
});

// Wait for search results
Cypress.Commands.add("waitForSearchResults", () => {
  // Wait for loading to finish
  cy.get('[data-testid="search-loading"]').should("not.exist");
  // Wait for results to appear or no results message
  cy.get('[data-testid="search-results"], [data-testid="no-results"]', {
    timeout: 15000,
  }).should("be.visible");
});

// Add song to queue
Cypress.Commands.add("addSongToQueue", (songTitle: string) => {
  // Find the song in search results and click add button
  cy.get('[data-testid="song-item"]')
    .contains(songTitle)
    .closest('[data-testid="song-item"]')
    .find('[data-testid="add-song-button"]')
    .click();

  // Wait for confirmation dialog or success message
  cy.get(
    '[data-testid="confirmation-dialog"], [data-testid="success-message"]',
    { timeout: 5000 }
  ).should("be.visible");
});

// Remove song from queue
Cypress.Commands.add("removeSongFromQueue", (songTitle: string) => {
  // Navigate to queue tab first
  cy.navigateToTab("queue");

  // Find the song in queue and click remove button
  cy.get('[data-testid="queue-item"]')
    .contains(songTitle)
    .parent()
    .find('[data-testid="remove-song-button"]')
    .click();

  // Confirm removal if confirmation dialog appears
  cy.get("body").then($body => {
    if ($body.find('[data-testid="confirm-remove-button"]').length > 0) {
      cy.get('[data-testid="confirm-remove-button"]').click();
    }
  });
});

// Navigate to tab
Cypress.Commands.add("navigateToTab", (tab: "search" | "queue") => {
  cy.get(`[data-testid="${tab}-tab"]`).click();
  cy.get(`[data-testid="${tab}-content"]`).should("be.visible");
});

// Mock Jellyfin API
Cypress.Commands.add("mockJellyfinAPI", () => {
  // Mock artists endpoint (both search and browse)
  cy.intercept("GET", "/api/artists*", req => {
    const query = req.url.includes("q=")
      ? new URL(req.url).searchParams.get("q")
      : "";
    if (query && query.includes("NonexistentArtist123")) {
      req.reply({ success: true, data: [] });
    } else {
      req.reply({ fixture: "artists.json" });
    }
  }).as("getArtists");

  // Mock songs endpoint (both search and browse)
  cy.intercept("GET", "/api/songs*", req => {
    const query = req.url.includes("q=")
      ? new URL(req.url).searchParams.get("q")
      : "";
    if (query && query.includes("NonexistentArtist123")) {
      req.reply({ success: true, data: [] });
    } else {
      req.reply({ fixture: "songs.json" });
    }
  }).as("getSongs");

  // Mock specific song title search endpoint
  cy.intercept("GET", "/api/songs/title*", req => {
    const query = req.url.includes("q=")
      ? new URL(req.url).searchParams.get("q")
      : "";
    if (query && query.includes("NonexistentArtist123")) {
      req.reply({ success: true, data: [] });
    } else {
      req.reply({ fixture: "songs.json" });
    }
  }).as("searchSongs");

  // Mock artist songs endpoint
  cy.intercept("GET", "/api/artists/*/songs*", {
    fixture: "songs.json",
  }).as("getArtistSongs");

  // Mock playlists endpoint
  cy.intercept("GET", "/api/playlists*", {
    fixture: "playlists.json",
  }).as("getPlaylists");

  // Mock playlist items endpoint
  cy.intercept("GET", "/api/playlists/*/items*", {
    fixture: "songs.json",
  }).as("getPlaylistSongs");

  // Mock albums endpoint
  cy.intercept("GET", "/api/albums*", req => {
    const query = req.url.includes("q=")
      ? new URL(req.url).searchParams.get("q")
      : "";
    if (query && query.includes("NonexistentArtist123")) {
      req.reply({ success: true, data: [] });
    } else {
      req.reply({ fixture: "albums.json" });
    }
  }).as("getAlbums");

  // Mock album songs endpoint
  cy.intercept("GET", "/api/albums/*/songs*", {
    fixture: "songs.json",
  }).as("getAlbumSongs");

  // Mock queue endpoint - default behavior (will be overridden by specific tests)
  cy.intercept("GET", "/api/queue", {
    fixture: "queue.json",
  }).as("getQueue");

  // Mock add to queue with delay to test loading state
  cy.intercept("POST", "/api/queue", req => {
    // Add a longer delay to make loading state visible for testing
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          statusCode: 200,
          body: { success: true, message: "Song added to queue" },
        });
      }, 500);
    });
  }).as("addToQueue");

  // Mock remove from queue
  cy.intercept("DELETE", "/api/queue/*", {
    statusCode: 200,
    body: { success: true, message: "Song removed from queue" },
  }).as("removeFromQueue");
});

// Verify admin controls
Cypress.Commands.add("verifyAdminControls", () => {
  // Check for main admin control sections
  cy.get('[data-testid="playback-controls"]').should("be.visible");
  cy.get('[data-testid="queue-management"]').should("be.visible");
  cy.get('[data-testid="emergency-controls"]').should("be.visible");

  // Check for specific control buttons
  cy.get('[data-testid="play-pause-button"]').should("be.visible");
  cy.get('[data-testid="skip-button"]').should("be.visible");
  cy.get('[data-testid="volume-control"]').should("be.visible");
  cy.get('[data-testid="emergency-stop-button"]').should("be.visible");
});
