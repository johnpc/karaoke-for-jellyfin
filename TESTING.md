# Testing Guide for Karaoke for Jellyfin

This document provides a comprehensive overview of the testing strategy and implementation for the Karaoke for Jellyfin application.

## Testing Stack

- **E2E Testing**: Cypress for end-to-end testing
- **Component Testing**: Cypress component testing for React components
- **Unit Testing**: Jest for unit tests (existing)
- **API Mocking**: Cypress intercepts for reliable testing

## Test Coverage

### 1. Mobile Interface Tests (`cypress/e2e/mobile-interface.cy.ts`)

**User Setup & Authentication**

- ✅ New user setup flow
- ✅ Username persistence across sessions
- ✅ Session joining and WebSocket connection

**Search Functionality**

- ✅ Default artist loading
- ✅ Unified search (songs, artists, albums)
- ✅ Search result filtering and pagination
- ✅ No results handling
- ✅ Search result section collapsing

**Navigation**

- ✅ Tab switching (Search ↔ Queue)
- ✅ Artist detail navigation
- ✅ Playlist navigation
- ✅ Back button functionality

**Queue Management**

- ✅ Adding songs from search results
- ✅ Adding songs from artist/playlist views
- ✅ Queue display with position numbers
- ✅ Song removal from queue
- ✅ Queue reordering (drag & drop)
- ✅ Empty queue state

### 2. Admin Interface Tests (`cypress/e2e/admin-interface.cy.ts`)

**Authentication**

- ✅ Admin login form
- ✅ Credential validation
- ✅ Session persistence

**Playback Controls**

- ✅ Play/pause functionality
- ✅ Skip to next song
- ✅ Volume control and muting
- ✅ Seek/scrub through songs
- ✅ Lyrics timing adjustment

**Queue Management**

- ✅ Queue status display
- ✅ Song details in admin view
- ✅ Admin song removal
- ✅ Queue position tracking

**Emergency Controls**

- ✅ Emergency stop functionality
- ✅ Song restart capability
- ✅ System status monitoring

**System Monitoring**

- ✅ Connection status indicators
- ✅ Active user count
- ✅ Cache management
- ✅ Real-time updates

### 3. TV Interface Tests (`cypress/e2e/tv-interface.cy.ts`)

**Initial State**

- ✅ Waiting screen with QR code
- ✅ Instructions for mobile access
- ✅ App branding display

**Queue Display**

- ✅ Next-up sidebar
- ✅ Queue preview with song details
- ✅ User attribution ("Added by")
- ✅ Position numbering

**Song Playback**

- ✅ Audio player display
- ✅ Current song information
- ✅ Lyrics display and synchronization
- ✅ Progress bar and timing
- ✅ Current lyric highlighting

**Host Controls**

- ✅ Keyboard shortcuts
- ✅ On-screen control overlay
- ✅ Auto-hide functionality
- ✅ Volume and playback controls

**Auto-play & Transitions**

- ✅ Auto-play when songs added
- ✅ Countdown timers
- ✅ Rating animations
- ✅ Next song splash screens
- ✅ Smooth transitions

**Visual Effects**

- ✅ Applause animations
- ✅ Background effects
- ✅ Responsive design across resolutions

### 4. Integration Tests (`cypress/e2e/integration-flow.cy.ts`)

**Complete Workflow**

- ✅ Full karaoke session setup
- ✅ Multi-interface coordination
- ✅ Cross-device synchronization

**Multi-User Scenarios**

- ✅ Simultaneous song additions
- ✅ Queue sharing between users
- ✅ Real-time updates across sessions

**Error Recovery**

- ✅ API failure handling
- ✅ WebSocket disconnection recovery
- ✅ Network issue resilience
- ✅ State persistence during errors

**Performance Testing**

- ✅ Rapid song additions
- ✅ Large queue handling
- ✅ Memory leak prevention
- ✅ Responsive UI under load

**Accessibility**

- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ Color contrast validation

### 5. Component Tests (`cypress/component/`)

**SearchInterface Component**

- ✅ Rendering and basic functionality
- ✅ Search input handling
- ✅ Tab switching
- ✅ API integration
- ✅ Error state handling
- ✅ Connection state management

## Test Data & Mocking

### Mock Data Structure

**Artists** (`cypress/fixtures/artists.json`)

- The Beatles, Queen, Led Zeppelin, Pink Floyd, The Rolling Stones

**Songs** (`cypress/fixtures/songs.json`)

- Hey Jude, Bohemian Rhapsody, Stairway to Heaven, Wish You Were Here, Paint It Black

**Albums** (`cypress/fixtures/albums.json`)

- Abbey Road, A Night at the Opera, Led Zeppelin IV, The Dark Side of the Moon

**Playlists** (`cypress/fixtures/playlists.json`)

- Classic Rock Hits, Karaoke Favorites, 80s Greatest Hits, Pop Anthems

**Queue State** (`cypress/fixtures/queue.json`)

- Sample queue with 2 songs and metadata

### API Mocking Strategy

All external API calls are intercepted and mocked:

- Jellyfin API endpoints (`/api/artists`, `/api/songs`, etc.)
- WebSocket connections for real-time updates
- Audio streaming endpoints
- Lyrics retrieval endpoints

## Custom Cypress Commands

### User Management

```javascript
cy.setupUser(username); // Complete user setup flow
cy.waitForWebSocketConnection(); // Wait for connection establishment
```

### Search & Navigation

```javascript
cy.searchFor(query); // Perform search with results waiting
cy.navigateToTab(tabName); // Switch between interface tabs
cy.waitForSearchResults(); // Wait for search completion
```

### Queue Operations

```javascript
cy.addSongToQueue(songTitle); // Add song with confirmation
cy.removeSongFromQueue(songTitle); // Remove song with confirmation
```

### Admin Functions

```javascript
cy.verifyAdminControls(); // Verify all admin elements present
cy.mockJellyfinAPI(); // Set up all API mocks
```

## Running Tests

### Development Workflow

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Open Cypress Test Runner**:

   ```bash
   npm run test:e2e:open
   ```

3. **Run specific test suites**:
   ```bash
   npm run test:e2e:mobile      # Mobile interface only
   npm run test:e2e:admin       # Admin interface only
   npm run test:e2e:tv          # TV interface only
   npm run test:e2e:integration # Integration tests only
   ```

### CI/CD Pipeline

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Parallel execution across 4 containers
- Automatic artifact collection on failures

### Performance Benchmarks

- **Test Suite Execution**: < 10 minutes total
- **Individual Test**: < 30 seconds average
- **Page Load Times**: < 3 seconds
- **API Response Mocking**: < 100ms

## Test Maintenance

### Adding New Tests

1. **Identify the interface**: Mobile, Admin, TV, or Integration
2. **Add data-testid attributes** to new components
3. **Update fixtures** if new API endpoints are added
4. **Create test cases** following existing patterns
5. **Update custom commands** for new common operations

### Required Test IDs

When adding new features, ensure these `data-testid` attributes are present:

#### Mobile Interface

- User setup: `user-setup`, `username-input`, `join-session-button`
- Search: `search-input`, `search-results`, `search-tab`, `queue-tab`
- Content: `artist-item`, `song-item`, `album-item`, `playlist-item`
- Actions: `add-song-button`, `remove-song-button`
- Queue: `queue-item`, `queue-content`, `drag-handle`

#### Admin Interface

- Authentication: `admin-interface`, `admin-login`, `admin-password-input`
- Controls: `playback-controls`, `play-pause-button`, `skip-button`
- Volume: `volume-control`, `volume-slider`, `mute-button`
- Queue: `queue-management`, `admin-queue-list`, `admin-queue-item`
- Emergency: `emergency-controls`, `emergency-stop-button`
- Status: `system-status`, `connection-indicator`, `cache-status`

#### TV Interface

- Display: `tv-interface`, `waiting-screen`, `qr-code`
- Playback: `audio-player`, `lyrics-display`, `current-lyric`
- Queue: `next-up-sidebar`, `queue-preview`, `queue-item-preview`
- Controls: `host-controls`, `rating-animation`
- Transitions: `next-song-splash`, `countdown-timer`

### Debugging Failed Tests

1. **Check Screenshots**: Automatic screenshots on failure
2. **Review Videos**: Full test execution recordings
3. **Examine Console Logs**: Browser console output
4. **Verify Test Data**: Ensure fixtures match expected format
5. **Check API Mocks**: Verify intercepts are working correctly

## Best Practices

### Test Writing

- Use descriptive test names that explain expected behavior
- Group related tests with `describe` blocks
- Set up common state in `beforeEach` hooks
- Make tests independent and able to run in any order
- Use proper waits instead of fixed delays

### Maintenance

- Keep fixtures up to date with API changes
- Update test IDs when refactoring components
- Review and update tests when adding new features
- Monitor test execution times and optimize slow tests
- Regularly review and remove obsolete tests

### CI/CD Integration

- Tests must pass before merging
- Parallel execution for faster feedback
- Automatic artifact collection for debugging
- Integration with GitHub status checks
- Dashboard reporting for test trends

## Troubleshooting

### Common Issues

**WebSocket Connection Failures**

- Ensure development server is running
- Check for port conflicts
- Verify WebSocket endpoint configuration

**Element Not Found Errors**

- Confirm `data-testid` attributes are present
- Check for timing issues with dynamic content
- Verify component rendering conditions

**API Mocking Issues**

- Ensure intercepts are set up before page visits
- Check fixture data format matches expectations
- Verify API endpoint URLs are correct

**Flaky Tests**

- Add proper waits for async operations
- Check for race conditions in test setup
- Ensure test isolation and cleanup

### Debug Commands

```javascript
cy.debug(); // Pause test execution
cy.screenshot("debug-name"); // Take manual screenshot
cy.log("Debug message"); // Log to Cypress console
cy.get('[data-testid="element"]').debug(); // Debug specific element
```

This comprehensive test suite ensures the Karaoke for Jellyfin application works reliably across all interfaces and user scenarios, providing confidence in deployments and feature additions.
