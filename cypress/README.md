# Cypress E2E Testing Suite

This directory contains end-to-end tests for the Karaoke for Jellyfin application using Cypress.

## Test Structure

### Test Files

- **`mobile-interface.cy.ts`** - Tests for the mobile interface (`/`)
  - User setup and authentication
  - Search functionality (artists, songs, albums)
  - Navigation between search and queue tabs
  - Adding songs to queue from search results
  - Queue management and song removal
  - Artist and playlist navigation

- **`admin-interface.cy.ts`** - Tests for the admin interface (`/admin`)
  - Admin authentication
  - Playback controls (play/pause, skip, volume, seek)
  - Queue management from admin perspective
  - Emergency controls (emergency stop, restart song)
  - System status monitoring
  - Cache management

- **`tv-interface.cy.ts`** - Tests for the TV display (`/tv`)
  - Initial waiting screen with QR code
  - Queue display and next-up sidebar
  - Song playback with lyrics display
  - Host controls and keyboard shortcuts
  - Auto-play functionality
  - Song transitions and rating animations
  - Visual effects and responsive design

- **`integration-flow.cy.ts`** - Integration tests across all interfaces
  - Complete karaoke session workflow
  - Cross-interface synchronization
  - Multi-user scenarios
  - Error recovery and resilience
  - Performance under load

### Support Files

- **`support/commands.ts`** - Custom Cypress commands
- **`support/e2e.ts`** - Global configuration and setup
- **`fixtures/`** - Mock data for API responses

## Running Tests

### Prerequisites

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests

#### Interactive Mode (Recommended for Development)

```bash
npm run test:e2e:open
```

This opens the Cypress Test Runner where you can select and run individual tests while watching them execute in a browser.

#### Headless Mode (CI/CD)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:mobile      # Mobile interface tests only
npm run test:e2e:admin       # Admin interface tests only
npm run test:e2e:tv          # TV interface tests only
npm run test:e2e:integration # Integration tests only
```

## Test Configuration

### Environment Variables

Tests use the following environment variables (configured in `cypress.config.ts`):

- `JELLYFIN_SERVER_URL` - URL of the Jellyfin server (default: http://localhost:8096)
- `TEST_USERNAME` - Username for test user (default: cypress-test-user)

### Viewport Settings

- Default: 1280x720 (desktop)
- Mobile tests: Various mobile viewports (iPhone X, etc.)
- TV tests: Various TV resolutions (1080p, 4K)

## Custom Commands

The test suite includes several custom Cypress commands to simplify common operations:

### User Management

```javascript
cy.setupUser("Test User Name"); // Set up user and join session
cy.waitForWebSocketConnection(); // Wait for WebSocket connection
```

### Search and Navigation

```javascript
cy.searchFor("Beatles"); // Search for content
cy.waitForSearchResults(); // Wait for search results to load
cy.navigateToTab("queue"); // Switch between tabs
```

### Queue Management

```javascript
cy.addSongToQueue("Hey Jude"); // Add song to queue
cy.removeSongFromQueue("Hey Jude"); // Remove song from queue
```

### API Mocking

```javascript
cy.mockJellyfinAPI(); // Mock all Jellyfin API endpoints
```

### Admin Controls

```javascript
cy.verifyAdminControls(); // Verify admin interface elements
```

## Test Data

### Fixtures

Mock data is provided in the `fixtures/` directory:

- `artists.json` - Sample artist data
- `songs.json` - Sample song data
- `albums.json` - Sample album data
- `playlists.json` - Sample playlist data
- `queue.json` - Sample queue state

### Data-testid Attributes

Tests rely on `data-testid` attributes in the application components. Key test IDs include:

#### Mobile Interface

- `user-setup`, `username-input`, `join-session-button`
- `search-input`, `search-results`, `search-tab`, `queue-tab`
- `artist-item`, `song-item`, `album-item`, `playlist-item`
- `add-song-button`, `remove-song-button`
- `queue-item`, `queue-content`

#### Admin Interface

- `admin-interface`, `admin-login`
- `playback-controls`, `play-pause-button`, `skip-button`
- `volume-control`, `volume-slider`, `mute-button`
- `queue-management`, `admin-queue-list`
- `emergency-controls`, `emergency-stop-button`
- `system-status`, `cache-status`

#### TV Interface

- `tv-interface`, `waiting-screen`, `qr-code`
- `audio-player`, `lyrics-display`, `current-lyric`
- `next-up-sidebar`, `queue-preview`
- `host-controls`, `rating-animation`
- `next-song-splash`, `countdown-timer`

## Best Practices

### Writing Tests

1. **Use Page Object Pattern**: Group related functionality into reusable commands
2. **Mock External Dependencies**: Use `cy.mockJellyfinAPI()` to avoid external dependencies
3. **Wait for Elements**: Use `cy.should('be.visible')` instead of `cy.wait()`
4. **Test User Flows**: Focus on complete user journeys rather than isolated features
5. **Handle Async Operations**: Properly wait for WebSocket connections and API responses

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to organize related test cases
2. **Use beforeEach**: Set up common state in `beforeEach` hooks
3. **Independent Tests**: Each test should be able to run independently
4. **Clear Test Names**: Use descriptive test names that explain the expected behavior

### Debugging

1. **Use Cypress Dashboard**: View test results and screenshots
2. **Debug Mode**: Use `cy.debug()` to pause test execution
3. **Screenshots**: Automatic screenshots are taken on test failures
4. **Console Logs**: Check browser console for application errors

## Continuous Integration

### GitHub Actions

The test suite is designed to run in CI/CD environments. Example GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: cypress-io/github-action@v5
        with:
          build: npm run build
          start: npm start
          wait-on: "http://localhost:3000"
```

### Docker Support

Tests can run in Docker containers for consistent environments:

```bash
docker run -it -v $PWD:/e2e -w /e2e cypress/included:latest
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**: Ensure the development server is running
2. **Element Not Found**: Check that `data-testid` attributes are present
3. **Timing Issues**: Use proper waits instead of fixed delays
4. **API Mocking**: Verify mock data matches expected format

### Debug Commands

```javascript
// Pause test execution
cy.debug();

// Log element information
cy.get('[data-testid="element"]').debug();

// Take screenshot
cy.screenshot("debug-screenshot");

// Log to console
cy.log("Debug message");
```

## Contributing

When adding new features to the application:

1. Add appropriate `data-testid` attributes to new components
2. Update fixtures if new API endpoints are added
3. Add test cases for new functionality
4. Update custom commands if new common operations are needed
5. Run the full test suite before submitting changes

## Performance Considerations

- Tests run against a local development server
- API responses are mocked to ensure consistent test performance
- Large datasets are simulated with fixtures rather than real data
- Tests are designed to complete within reasonable time limits (< 30 seconds per test)
