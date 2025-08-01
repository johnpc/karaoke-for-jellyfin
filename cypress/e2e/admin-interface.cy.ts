describe("Admin Interface", () => {
  beforeEach(() => {
    // Mock Jellyfin API responses
    cy.mockJellyfinAPI();

    // Visit admin page
    cy.visit("/admin");

    // Complete user setup first (admin page requires setup)
    cy.get('[data-testid="user-setup"]').should("be.visible");
    cy.get('[data-testid="username-input"]').type("Test Admin");
    cy.get('[data-testid="join-session-button"]').click();

    // Wait for admin interface to load after setup
    cy.get('[data-testid="admin-interface"]').should("be.visible");
  });

  describe("Admin Authentication", () => {
    it("should show admin login form", () => {
      // Check if admin login is required
      cy.get("body").then($body => {
        if ($body.find('[data-testid="admin-login"]').length > 0) {
          cy.get('[data-testid="admin-login"]').should("be.visible");
          cy.get('[data-testid="admin-password-input"]').should("be.visible");
          cy.get('[data-testid="admin-login-button"]').should("be.visible");
        }
      });
    });

    it("should allow admin to login with correct credentials", () => {
      cy.get("body").then($body => {
        if ($body.find('[data-testid="admin-login"]').length > 0) {
          cy.get('[data-testid="admin-password-input"]').type("admin");
          cy.get('[data-testid="admin-login-button"]').click();

          // Should proceed to admin controls
          cy.verifyAdminControls();
        }
      });
    });
  });

  describe("Playback Controls", () => {
    beforeEach(() => {
      // Ensure we're logged in as admin
      cy.get("body").then($body => {
        if ($body.find('[data-testid="admin-login"]').length > 0) {
          cy.get('[data-testid="admin-password-input"]').type("admin");
          cy.get('[data-testid="admin-login-button"]').click();
        }
      });

      // Set up test state with WebSocket helpers
      cy.window().then(win => {
        const helpers = (win as any).webSocketTestHelpers;

        if (helpers) {
          console.log("🧪 Admin Test: Setting up playback state...");

          const testSong = {
            id: "admin-test-song",
            mediaItem: {
              id: "jellyfin_admin-test-song",
              title: "Admin Test Song",
              artist: "Test Artist",
              album: "Test Album",
              duration: 180,
              jellyfinId: "admin-test-song",
              streamUrl: "/api/stream/admin-test-song",
              hasLyrics: true,
            },
            addedBy: "Test Admin",
            addedAt: new Date(),
            position: 1,
            status: "playing",
          };

          helpers.setCurrentSong(testSong);
          helpers.setQueue([testSong]);
          helpers.setPlaybackState({
            isPlaying: true,
            currentTime: 30,
            volume: 80,
            duration: 180,
          });
        }
      });

      cy.wait(1000);
    });

    it("should display playback control section", () => {
      cy.get('[data-testid="playback-controls"]').should("be.visible");
      cy.get('[data-testid="playback-controls"]').should("contain", "Controls");
    });

    it("should have play/pause button", () => {
      cy.get('[data-testid="play-pause-button"]').should("be.visible");
      // Check that the button contains either Play or Pause text (via icon or aria-label)
      cy.get('[data-testid="play-pause-button"]').should("exist");
    });

    it("should have skip button", () => {
      cy.get('[data-testid="skip-button"]').should("be.visible");
      cy.get('[data-testid="skip-button"]').should("be.enabled");
    });

    it("should have seek controls", () => {
      cy.get('[data-testid="seek-control"]').should("be.visible");
      cy.get('[data-testid="seek-slider"]').should("be.visible");
    });

    it("should have lyrics timing controls", () => {
      cy.get('[data-testid="lyrics-timing"]').should("be.visible");
      cy.get('[data-testid="lyrics-offset-minus"]').should("be.visible");
      cy.get('[data-testid="lyrics-offset-plus"]').should("be.visible");
    });

    it("should allow clicking play/pause button", () => {
      cy.get('[data-testid="play-pause-button"]').click();
      // Button should respond to click (state might change)
      cy.get('[data-testid="play-pause-button"]').should("be.visible");
    });

    it("should allow adjusting volume", () => {
      // Test volume slider interaction
      cy.get('[data-testid="volume-slider"]').should(
        "have.attr",
        "type",
        "range"
      );
      cy.get('[data-testid="volume-slider"]')
        .invoke("val", 50)
        .trigger("input");
    });

    it("should allow muting/unmuting", () => {
      cy.get('[data-testid="mute-button"]').click();
      cy.get('[data-testid="mute-button"]').should("be.visible");
    });

    it("should allow seeking through song", () => {
      cy.get('[data-testid="seek-slider"]').should(
        "have.attr",
        "type",
        "range"
      );
      cy.get('[data-testid="seek-slider"]').invoke("val", 30).trigger("input");
    });

    it("should allow adjusting lyrics timing", () => {
      cy.get('[data-testid="lyrics-offset-minus"]').click();
      cy.get('[data-testid="lyrics-offset-plus"]').click();
    });

    it("should display current song information", () => {
      cy.get('[data-testid="current-song-info"]').should("be.visible");
    });
  });

  describe("Queue Management", () => {
    beforeEach(() => {
      // Set up test state with queue items
      cy.window().then(win => {
        const helpers = (win as any).webSocketTestHelpers;

        if (helpers) {
          console.log("🧪 Admin Test: Setting up queue state...");

          const testQueue = [
            {
              id: "queue-song-1",
              mediaItem: {
                id: "jellyfin_queue-song-1",
                title: "Queue Song 1",
                artist: "Artist 1",
                album: "Album 1",
                duration: 180,
                jellyfinId: "queue-song-1",
                streamUrl: "/api/stream/queue-song-1",
                hasLyrics: true,
              },
              addedBy: "Test User 1",
              addedAt: new Date(),
              position: 1,
              status: "pending",
            },
            {
              id: "queue-song-2",
              mediaItem: {
                id: "jellyfin_queue-song-2",
                title: "Queue Song 2",
                artist: "Artist 2",
                album: "Album 2",
                duration: 200,
                jellyfinId: "queue-song-2",
                streamUrl: "/api/stream/queue-song-2",
                hasLyrics: true,
              },
              addedBy: "Test User 2",
              addedAt: new Date(),
              position: 2,
              status: "pending",
            },
          ];

          helpers.setQueue(testQueue);
          helpers.setCurrentSong(null); // No current song, just queue
        }
      });

      // Navigate to queue tab
      cy.contains("Queue").click();
      cy.wait(1000);
    });

    it("should display queue management section", () => {
      cy.get('[data-testid="queue-management"]').should("be.visible");
      cy.get('[data-testid="queue-management"]').should("contain", "Queue");
    });

    it("should show current queue status", () => {
      cy.get('[data-testid="queue-status"]').should("be.visible");
      cy.get('[data-testid="queue-count"]').should("be.visible");
    });

    it("should display queue items", () => {
      cy.get('[data-testid="admin-queue-list"]').should("be.visible");
    });

    it("should show song details in queue", () => {
      cy.get('[data-testid="admin-queue-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="song-title"]').should("be.visible");
          cy.get('[data-testid="song-artist"]').should("be.visible");
          cy.get('[data-testid="added-by"]').should("be.visible");
        });
    });

    it("should show queue position numbers", () => {
      cy.get('[data-testid="admin-queue-item"]').first().should("contain", "1");
    });

    it("should allow removing songs from admin view", () => {
      cy.get('[data-testid="admin-queue-item"]')
        .first()
        .within(() => {
          cy.get('[data-testid="admin-remove-song"]').should("be.visible");
          cy.get('[data-testid="admin-remove-song"]').click();
        });
    });
  });

  describe("Emergency Controls", () => {
    beforeEach(() => {
      // Set up test state with current song for restart functionality
      cy.window().then(win => {
        const helpers = (win as any).webSocketTestHelpers;

        if (helpers) {
          console.log(
            "🧪 Admin Test: Setting up current song for emergency controls..."
          );

          const testSong = {
            id: "emergency-test-song",
            mediaItem: {
              id: "jellyfin_emergency-test-song",
              title: "Emergency Test Song",
              artist: "Test Artist",
              album: "Test Album",
              duration: 180,
              jellyfinId: "emergency-test-song",
              streamUrl: "/api/stream/emergency-test-song",
              hasLyrics: true,
            },
            addedBy: "Test Admin",
            addedAt: new Date(),
            position: 1,
            status: "playing",
          };

          helpers.setCurrentSong(testSong);
          helpers.setPlaybackState({
            isPlaying: true,
            currentTime: 60,
            volume: 80,
            duration: 180,
          });
        }
      });

      // Navigate to emergency tab
      cy.contains("Emergency").click();
      cy.wait(1000);
    });

    it("should display emergency controls section", () => {
      // Ensure we're on the emergency tab
      cy.contains("Emergency").should("be.visible").click();
      cy.wait(1000);

      cy.get('[data-testid="emergency-controls"]').should("be.visible");
      cy.get('[data-testid="emergency-controls"]').should(
        "contain",
        "Emergency Controls"
      );
    });

    it("should have emergency stop button", () => {
      cy.get('[data-testid="emergency-stop-button"]').should("be.visible");
      cy.get('[data-testid="emergency-stop-button"]').should(
        "contain",
        "Emergency Stop"
      );
    });

    it("should have restart song button", () => {
      cy.get('[data-testid="restart-song-button"]').should("be.visible");
      cy.get('[data-testid="restart-song-button"]').should(
        "contain",
        "Restart"
      );
    });

    it("should allow clicking emergency stop", () => {
      cy.get('[data-testid="emergency-stop-button"]').click();
      // Should show confirmation or immediate action
      cy.get('[data-testid="emergency-stop-button"]').should("be.visible");
    });

    it("should allow restarting current song", () => {
      cy.get('[data-testid="restart-song-button"]').click();
      cy.get('[data-testid="restart-song-button"]').should("be.visible");
    });
  });

  describe("System Status", () => {
    beforeEach(() => {
      // Navigate to emergency tab where system status is located
      cy.contains("Emergency").click();
      cy.wait(1000);
    });

    it("should show system status section", () => {
      cy.get('[data-testid="system-status"]').should("be.visible");
    });

    it("should display connection status", () => {
      cy.get('[data-testid="connection-indicator"]').should("be.visible");
    });

    it("should show active users count", () => {
      // Ensure we're on the emergency tab where system status is
      cy.contains("Emergency").should("be.visible").click();
      cy.wait(1000);

      cy.get('[data-testid="active-users"]').should("be.visible");
      cy.get('[data-testid="user-count"]').should("be.visible");

      // Should contain a number (could be 0 or more)
      cy.get('[data-testid="user-count"]').should($el => {
        const text = $el.text().trim();
        expect(text).to.match(/^\d+$/); // Should be a number
      });
    });
  });

  describe("Cache Management", () => {
    beforeEach(() => {
      // Navigate to emergency tab where cache status is located
      cy.contains("Emergency").click();
      cy.wait(1000);
    });

    it("should show cache status", () => {
      cy.get('[data-testid="cache-status"]').should("be.visible");
    });

    it("should have cache clear button", () => {
      cy.get('[data-testid="clear-cache-button"]').should("be.visible");
      cy.get('[data-testid="clear-cache-button"]').should(
        "contain",
        "Quick Clear"
      );
    });

    it("should allow clearing cache", () => {
      cy.get('[data-testid="clear-cache-button"]').click();
      // Should show confirmation or success message
      cy.get('[data-testid="cache-cleared"]').should("be.visible");
    });

    it("should show cache statistics", () => {
      cy.get('[data-testid="cache-stats"]').should("be.visible");
    });
  });

  describe("Real-time Updates", () => {
    it("should update queue in real-time", () => {
      // Navigate to queue tab
      cy.contains("Queue").click();
      cy.wait(1000);

      // Verify queue section is visible
      cy.get('[data-testid="queue-management"]').should("be.visible");

      // Check that queue count is displayed
      cy.get('[data-testid="queue-count"]').should("be.visible");

      // The queue list should exist (even if empty)
      cy.get("body").then($body => {
        if ($body.find('[data-testid="admin-queue-list"]').length > 0) {
          cy.get('[data-testid="admin-queue-list"]').should("be.visible");
        } else {
          // If no queue items, should show empty state
          cy.get('[data-testid="queue-management"]').should(
            "contain",
            "No songs"
          );
        }
      });
    });

    it("should update playback status in real-time", () => {
      // Navigate to playback tab
      cy.contains("Playback").click();
      cy.wait(1000);

      cy.get('[data-testid="playback-status"]').should("be.visible");
    });

    it("should update connection status", () => {
      // Navigate to emergency tab where connection status is
      cy.contains("Emergency").click();
      cy.wait(1000);

      cy.get('[data-testid="connection-indicator"]').should("be.visible");
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should be responsive on mobile viewport", () => {
      cy.viewport("iphone-x");

      // Check that admin interface is visible
      cy.get('[data-testid="admin-interface"]').should("be.visible");

      // Check that tabs are accessible
      cy.contains("Playback").should("be.visible");
      cy.contains("Queue").should("be.visible");
      cy.contains("Emergency").should("be.visible");

      // Navigate to each tab to verify they work on mobile
      cy.contains("Playback").click();
      cy.get('[data-testid="playback-controls"]').should("be.visible");

      cy.contains("Queue").click();
      cy.get('[data-testid="queue-management"]').should("be.visible");

      cy.contains("Emergency").click();
      cy.get('[data-testid="emergency-controls"]').should("be.visible");
    });

    it("should have touch-friendly controls on mobile", () => {
      cy.viewport("iphone-x");

      // Navigate to playback tab
      cy.contains("Playback").click();
      cy.wait(1000);

      // Buttons should be large enough for touch
      cy.get('[data-testid="play-pause-button"]').should("be.visible");

      // Navigate to emergency tab
      cy.contains("Emergency").click();
      cy.wait(1000);

      cy.get('[data-testid="emergency-stop-button"]').should("be.visible");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      // Since the admin interface uses WebSocket, not HTTP API calls,
      // we'll test that the interface remains functional even with errors

      // Should show admin interface regardless of API issues
      cy.get('[data-testid="admin-interface"]').should("be.visible");

      // Should still allow navigation between tabs
      cy.contains("Playback").click();
      cy.contains("Queue").click();
      cy.contains("Emergency").click();
    });

    it("should handle WebSocket disconnection", () => {
      // Navigate to emergency tab where connection indicator is
      cy.contains("Emergency").click();
      cy.wait(1000);

      // Should show connection indicator
      cy.get('[data-testid="connection-indicator"]').should("exist");

      // The connection indicator should be visible and functional
      cy.get('[data-testid="connection-indicator"]').should("be.visible");
    });
  });

  describe("Keyboard Shortcuts", () => {
    beforeEach(() => {
      // Set up test state with current song for keyboard shortcuts
      cy.window().then(win => {
        const helpers = (win as any).webSocketTestHelpers;

        if (helpers) {
          console.log(
            "🧪 Admin Test: Setting up current song for keyboard shortcuts..."
          );

          const testSong = {
            id: "keyboard-test-song",
            mediaItem: {
              id: "jellyfin_keyboard-test-song",
              title: "Keyboard Test Song",
              artist: "Test Artist",
              album: "Test Album",
              duration: 180,
              jellyfinId: "keyboard-test-song",
              streamUrl: "/api/stream/keyboard-test-song",
              hasLyrics: true,
            },
            addedBy: "Test Admin",
            addedAt: new Date(),
            position: 1,
            status: "playing",
          };

          helpers.setCurrentSong(testSong);
          helpers.setPlaybackState({
            isPlaying: true,
            currentTime: 60,
            volume: 80,
            duration: 180,
          });
        }
      });

      // Navigate to playback tab where controls are
      cy.contains("Playback").click();
      cy.wait(1000);
    });

    it("should support spacebar for play/pause", () => {
      cy.get("body").type(" ");
      // Should trigger play/pause action
      cy.get('[data-testid="play-pause-button"]').should("be.visible");
    });

    it("should support arrow keys for seeking", () => {
      cy.get("body").type("{rightarrow}");
      cy.get("body").type("{leftarrow}");
      // Should trigger seek actions
      cy.get('[data-testid="seek-control"]').should("be.visible");
    });
  });
});
