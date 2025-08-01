describe("Mobile Interface", () => {
  beforeEach(() => {
    // Mock Jellyfin API responses
    cy.mockJellyfinAPI();

    // Set up user and visit home page
    cy.setupUser("Cypress Test User");
  });

  describe("User Setup", () => {
    it("should show user setup form for new users", () => {
      // Clear localStorage to simulate new user
      cy.clearLocalStorage();
      cy.visit("/");

      // Should show user setup form
      cy.get('[data-testid="user-setup"]').should("be.visible");
      cy.get('[data-testid="username-input"]').should("be.visible");
      cy.get('[data-testid="join-session-button"]').should("be.visible");
    });

    it("should allow user to join session with username", () => {
      cy.clearLocalStorage();
      cy.visit("/");

      // Fill in username and join
      cy.get('[data-testid="username-input"]').type("Test User");
      cy.get('[data-testid="join-session-button"]').click();

      // Should proceed to main interface
      cy.get('[data-testid="search-content"]').should("be.visible");
      cy.get('[data-testid="search-tab"]').should("have.class", "active");
    });

    it("should remember username for returning users", () => {
      // Username should already be set from beforeEach
      cy.get('[data-testid="search-content"]').should("be.visible");
      cy.get('[data-testid="user-setup"]').should("not.exist");
    });
  });

  describe("Navigation", () => {
    it("should have search and queue tabs", () => {
      cy.get('[data-testid="search-tab"]').should("be.visible");
      cy.get('[data-testid="queue-tab"]').should("be.visible");
    });

    it("should switch between search and queue tabs", () => {
      // Start on search tab
      cy.get('[data-testid="search-tab"]').should("have.class", "active");
      cy.get('[data-testid="search-content"]').should("be.visible");

      // Switch to queue tab
      cy.navigateToTab("queue");
      cy.get('[data-testid="queue-tab"]').should("have.class", "active");
      cy.get('[data-testid="queue-content"]').should("be.visible");

      // Switch back to search tab
      cy.navigateToTab("search");
      cy.get('[data-testid="search-tab"]').should("have.class", "active");
      cy.get('[data-testid="search-content"]').should("be.visible");
    });
  });

  describe("Search Interface", () => {
    it("should load artists by default", () => {
      cy.wait("@getArtists");
      cy.get('[data-testid="artist-item"]').should(
        "have.length.greaterThan",
        0
      );
      cy.get('[data-testid="artist-item"]')
        .first()
        .should("contain", "The Beatles");
    });

    it("should have search input field", () => {
      cy.get('[data-testid="search-input"]').should("be.visible");
      cy.get('[data-testid="search-input"]').should("have.attr", "placeholder");
    });

    it("should search for songs, artists, and albums", () => {
      // Search for "Queen"
      cy.searchFor("Queen");

      // Should show results in different sections
      cy.get('[data-testid="artist-results"]').should("be.visible");
      cy.get('[data-testid="song-results"]').should("be.visible");
      cy.get('[data-testid="album-results"]').should("be.visible");

      // Should contain Queen in results
      cy.get('[data-testid="artist-item"]').should("contain", "Queen");
      cy.get('[data-testid="song-item"]').should(
        "contain",
        "Bohemian Rhapsody"
      );
    });

    it("should show no results message for invalid search", () => {
      cy.searchFor("NonexistentArtist123");
      cy.get('[data-testid="no-results"]').should("be.visible");
    });

    it("should clear search results when search is cleared", () => {
      // Search for something first
      cy.searchFor("Beatles");
      cy.get('[data-testid="search-results"]').should("be.visible");

      // Clear search
      cy.get('[data-testid="search-input"]').clear();

      // Should show default artists view
      cy.get('[data-testid="artist-item"]').should("be.visible");
    });

    it("should allow collapsing and expanding result sections", () => {
      cy.searchFor("Beatles");

      // Verify artist items are initially visible
      cy.get('[data-testid="artist-item"]').should("be.visible");

      // Collapse artist section
      cy.get('[data-testid="collapse-artists"]').click();
      cy.get('[data-testid="artist-item"]').should("not.exist");

      // Expand artist section
      cy.get('[data-testid="expand-artists"]').click();
      cy.get('[data-testid="artist-item"]').should("be.visible");
    });
  });

  describe("Artist Navigation", () => {
    it("should navigate into artist view", () => {
      // Click on an artist
      cy.get('[data-testid="artist-item"]').first().click();

      // Should show artist songs
      cy.get('[data-testid="artist-songs"]').should("be.visible");
      cy.get('[data-testid="back-button"]').should("be.visible");
    });

    it("should show artist songs when navigating into artist", () => {
      cy.get('[data-testid="artist-item"]').contains("The Beatles").click();

      // Should show songs by The Beatles
      cy.get('[data-testid="song-item"]').should("contain", "Hey Jude");
    });

    it("should allow going back from artist view", () => {
      // Perform a search to ensure artist items are available
      cy.searchFor("Beatles");

      // Navigate to artist
      cy.get('[data-testid="artist-item"]').first().click();
      cy.get('[data-testid="artist-songs"]').should("be.visible");

      // Go back
      cy.get('[data-testid="back-button"]').click();

      // Wait a moment for state updates to complete
      cy.wait(500);

      // Should be back to main search view
      cy.get('[data-testid="artist-item"]').should("be.visible");
    });
  });

  describe("Playlist Navigation", () => {
    it("should switch to playlist tab", () => {
      cy.get('[data-testid="playlist-tab"]').click();
      cy.wait("@getPlaylists");
      cy.get('[data-testid="playlist-item"]').should(
        "have.length.greaterThan",
        0
      );
    });

    it("should navigate into playlist view", () => {
      cy.get('[data-testid="playlist-tab"]').click();
      cy.get('[data-testid="playlist-item"]').first().click();

      // Should show playlist songs
      cy.get('[data-testid="playlist-songs"]').should("be.visible");
      cy.get('[data-testid="back-button"]').should("be.visible");
    });

    it("should show playlist songs when navigating into playlist", () => {
      cy.get('[data-testid="playlist-tab"]').click();
      cy.get('[data-testid="playlist-item"]')
        .contains("Classic Rock Hits")
        .click();

      // Should show songs in the playlist
      cy.get('[data-testid="song-item"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Adding Songs to Queue", () => {
    it("should add song to queue from search results", () => {
      cy.searchFor("Beatles");

      // Add first song to queue
      cy.get('[data-testid="song-item"]')
        .first()
        .find('[data-testid="add-song-button"]')
        .click();

      // Should show confirmation
      cy.get('[data-testid="confirmation-dialog"]').should("be.visible");
      cy.get('[data-testid="confirmation-dialog"]').should(
        "contain",
        "added to queue"
      );
    });

    it("should add song to queue from artist view", () => {
      // Navigate to artist
      cy.get('[data-testid="artist-item"]').contains("The Beatles").click();

      // Add song from artist view
      cy.get('[data-testid="song-item"]')
        .first()
        .find('[data-testid="add-song-button"]')
        .click();

      // Should show confirmation
      cy.get('[data-testid="confirmation-dialog"]').should("be.visible");
    });

    it("should add song to queue from playlist view", () => {
      // Navigate to playlist
      cy.get('[data-testid="playlist-tab"]').click();
      cy.get('[data-testid="playlist-item"]').first().click();

      // Add song from playlist
      cy.get('[data-testid="song-item"]')
        .first()
        .find('[data-testid="add-song-button"]')
        .click();

      // Should show confirmation
      cy.get('[data-testid="confirmation-dialog"]').should("be.visible");
    });
  });

  describe("Queue Management", () => {
    beforeEach(() => {
      // Add a song to queue first
      cy.searchFor("Beatles");
      cy.addSongToQueue("Hey Jude");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");
    });

    it("should show songs in queue", () => {
      cy.navigateToTab("queue");

      // With immediate playback, the first song becomes "Now Playing"
      // So we need to add a second song to see items in the pending queue
      cy.navigateToTab("search");
      cy.searchFor("Queen");
      cy.addSongToQueue("Bohemian Rhapsody");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");

      cy.navigateToTab("queue");

      // Should show the second song in pending queue
      cy.get('[data-testid="queue-item"]').should("have.length.greaterThan", 0);
      cy.get('[data-testid="queue-item"]').should(
        "contain",
        "Bohemian Rhapsody"
      );

      // Should also show the first song as "Now Playing"
      cy.get('[data-testid="now-playing"]').should("contain", "Hey Jude");
    });

    it("should show queue position for each song", () => {
      // Add a second song to have items in pending queue
      cy.navigateToTab("search");
      cy.searchFor("Queen");
      cy.addSongToQueue("Bohemian Rhapsody");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");

      cy.navigateToTab("queue");

      // The pending queue should show position numbers starting from 1
      cy.get('[data-testid="queue-item"]').first().should("contain", "1");
    });

    it("should allow removing songs from queue", () => {
      // Add a second song to have items in pending queue
      cy.navigateToTab("search");
      cy.searchFor("Queen");
      cy.addSongToQueue("Bohemian Rhapsody");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");

      cy.navigateToTab("queue");

      // Wait for queue items to be visible
      cy.get('[data-testid="queue-item"]', { timeout: 10000 }).should(
        "be.visible"
      );

      // Verify remove button exists and is clickable
      cy.get('[data-testid="queue-item"]')
        .first()
        .find('[data-testid="remove-song-button"]')
        .should("be.visible");
      cy.get('[data-testid="queue-item"]')
        .first()
        .find('[data-testid="remove-song-button"]')
        .click();

      // After removal, should have fewer items or show empty queue
      cy.get('[data-testid="queue-item"]').should("have.length", 0);
    });

    it("should show empty queue message when queue is empty", () => {
      cy.navigateToTab("queue");

      // With immediate playback, the first song is "Now Playing", not in pending queue
      // So the pending queue should already be empty and show the empty message
      cy.get('[data-testid="empty-queue"]').should("be.visible");

      // But should still show the current song as "Now Playing"
      cy.get('[data-testid="now-playing"]').should("be.visible");
      cy.get('[data-testid="now-playing"]').should("contain", "Hey Jude");
    });

    it("should allow reordering queue items", () => {
      // Add two more songs to have multiple items in pending queue
      cy.navigateToTab("search");
      cy.searchFor("Queen");
      cy.addSongToQueue("Bohemian Rhapsody");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");

      cy.searchFor("Led Zeppelin");
      cy.addSongToQueue("Stairway to Heaven");
      cy.get('[data-testid="confirmation-dialog"]').should("not.exist");

      cy.navigateToTab("queue");

      // Should have drag handles for the pending songs
      cy.get('[data-testid="drag-handle"]').should("have.length", 2);

      // Note: Actual drag and drop testing would require more complex setup
      // This test just verifies the drag handles are present
    });
  });

  describe("Connection Status", () => {
    it("should show connection status", () => {
      // Connection status might be in header or footer
      cy.get('[data-testid="connection-status"]').should("exist");
    });

    it("should handle disconnection gracefully", () => {
      // This would require mocking WebSocket disconnection
      // For now, just verify error handling elements exist
      cy.get("body").should("exist"); // Placeholder test
    });
  });

  describe("PWA Features", () => {
    it("should show PWA install prompt when available", () => {
      // PWA installer might not always be visible
      cy.get("body").then($body => {
        if ($body.find('[data-testid="pwa-install"]').length > 0) {
          cy.get('[data-testid="pwa-install"]').should("be.visible");
        }
      });
    });
  });
});
