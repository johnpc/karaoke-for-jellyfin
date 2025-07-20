# Design Document - Karaoke For Jellyfin

## Overview

Karaoke For Jellyfin is a web-based karaoke system that integrates with Jellyfin media server to provide a complete karaoke experience. The system is built as a Next.js application with two main interfaces:

1. **Mobile Web Interface** - Responsive web app for song search and queue management
2. **TV Display Interface** - Full-screen web interface for lyrics display and playback

The Next.js application provides both the frontend interfaces and backend API routes, leveraging Jellyfin's existing media management capabilities while adding karaoke-specific features like queue management, lyrics synchronization, and multi-user coordination.

## Architecture

```mermaid
graph TB
    subgraph "User Devices"
        M1[Mobile Browser 1]
        M2[Mobile Browser 2]
        M3[Mobile Browser N]
    end

    subgraph "TV Display"
        TV[TV Browser/Display]
    end

    subgraph "Next.js Application"
        subgraph "Frontend Pages"
            MOBILE[Mobile Interface /]
            TVPAGE[TV Display /tv]
        end

        subgraph "API Routes"
            API[/api/songs, /api/queue]
            WS[/api/socket WebSocket]
        end

        subgraph "Server Components"
            JFS[Jellyfin Service]
            QM[Queue Manager]
            LYR[Lyrics Engine]
        end
    end

    subgraph "Jellyfin Server"
        JF[Jellyfin API]
        MEDIA[Media Library]
    end

    M1 <--> MOBILE
    M2 <--> MOBILE
    M3 <--> MOBILE
    TV <--> TVPAGE

    M1 <--> WS
    M2 <--> WS
    M3 <--> WS
    TV <--> WS

    MOBILE <--> API
    TVPAGE <--> API

    API <--> JFS
    JFS <--> JF
    LYR <--> MEDIA
    QM <--> WS

    JF <--> MEDIA
```

## Components and Interfaces

### 1. Next.js API Routes

**Core Responsibilities:**

- **Jellyfin Integration** - Authenticate with and query Jellyfin for songs
- **Session State Management** - Maintain in-memory karaoke session state (current queue, playing song, user list)
- **Real-time Coordination** - WebSocket server to sync state between mobile devices and TV display
- **Queue Management** - Handle adding/removing/reordering songs in the active karaoke queue
- **Lyrics Processing** - Parse and serve lyrics files with timing information
- **Playback Orchestration** - Coordinate when songs start/stop and advance the queue

**Data Storage:**

- **In-Memory Only** - No persistent database required
- **Session State** - Current queue, playing song, connected users (lost on restart)
- **Jellyfin Proxy** - Song metadata and files come from Jellyfin, not stored locally

**API Endpoints:**

- `GET/POST /api/songs` - Search and retrieve songs from Jellyfin
- `GET/POST/DELETE /api/queue` - Queue management operations
- `GET /api/lyrics/[songId]` - Retrieve lyrics for a song
- `WebSocket /api/socket` - Real-time communication

**Server-side Services:**

#### Jellyfin Integration Service

```typescript
interface JellyfinService {
  authenticate(
    server: string,
    username: string,
    password: string,
  ): Promise<AuthToken>;
  searchMedia(query: string, mediaType: "Audio"): Promise<MediaItem[]>;
  getStreamUrl(itemId: string): string;
  getMediaMetadata(itemId: string): Promise<MediaMetadata>;
}
```

#### Queue Manager

```typescript
interface QueueManager {
  addSong(song: QueueItem): void;
  removeSong(songId: string): void;
  getCurrentSong(): QueueItem | null;
  getQueue(): QueueItem[];
  advanceQueue(): QueueItem | null;
  reorderQueue(newOrder: string[]): void;
}
```

#### WebSocket Event Handler

```typescript
interface WebSocketEvents {
  "queue-updated": (queue: QueueItem[]) => void;
  "song-started": (song: QueueItem) => void;
  "song-ended": () => void;
  "lyrics-sync": (timestamp: number, line: string) => void;
  "playback-control": (action: PlaybackAction) => void;
}
```

### 2. Mobile Web Interface (React/TypeScript)

**Technology Stack:**

- React with TypeScript
- Tailwind CSS for styling
- Headless UI or Radix UI for accessible components
- React Hook Form for form handling

**Core Features:**

- Responsive design optimized for mobile devices
- Song search with real-time results
- Queue viewing and management
- User identification and song ownership tracking

**Key Components:**

#### Search Component

- Debounced search input
- Results display with artist, title, duration
- Add to queue functionality
- Loading states and error handling

#### Queue Component

- Real-time queue display via WebSocket
- User's songs highlighted
- Position indicators
- Remove own songs capability

#### User Session Component

- Simple name/identifier input
- Session persistence
- Connection status indicator

### 3. TV Display Interface (React/TypeScript)

**Core Features:**

- Full-screen lyrics display
- Audio playback control
- Queue preview
- Host control interface
- Waiting screen when queue is empty

**Key Components:**

#### Lyrics Display Component

- Large, readable text optimized for TV viewing
- Current line highlighting
- Smooth scrolling and transitions
- Fallback display for songs without lyrics

#### Audio Player Component

- HTML5 audio element with Jellyfin stream URLs
- Automatic playback progression
- Volume control
- Playback state management

#### Host Controls Component

- Play/pause/skip controls
- Volume adjustment
- Queue management (reorder, remove)
- Emergency stop functionality

## Data Models

### Song/Media Item

```typescript
interface MediaItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  jellyfinId: string;
  streamUrl: string;
  lyricsPath?: string;
}
```

### Queue Item

```typescript
interface QueueItem {
  id: string;
  mediaItem: MediaItem;
  addedBy: string;
  addedAt: Date;
  position: number;
}
```

### Lyrics Data

```typescript
interface LyricsLine {
  timestamp: number; // milliseconds
  text: string;
  duration?: number;
}

interface LyricsFile {
  songId: string;
  lines: LyricsLine[];
  format: "lrc" | "srt" | "txt";
}
```

### Session State

```typescript
interface KaraokeSession {
  id: string;
  queue: QueueItem[];
  currentSong: QueueItem | null;
  isPlaying: boolean;
  currentTime: number;
  connectedUsers: string[];
  hostControls: {
    volume: number;
    autoAdvance: boolean;
  };
}
```

## Error Handling

### Jellyfin Connection Issues

- Retry logic with exponential backoff
- Graceful degradation when Jellyfin is unavailable
- Clear error messages for configuration issues
- Fallback to cached media data when possible

### WebSocket Connection Management

- Automatic reconnection for mobile clients
- State synchronization on reconnect
- Heartbeat mechanism to detect disconnections
- Queue state recovery from server

### Audio Playback Errors

- Skip to next song on playback failure
- Host notification of playback issues
- Manual override controls for host
- Logging of media errors for troubleshooting

### Lyrics Synchronization

- Graceful handling of missing lyrics files
- Fallback to basic song info display
- Manual timing adjustment capabilities
- Support for multiple lyrics formats

## Testing Strategy

### Unit Testing

- Jellyfin API integration functions
- Queue management logic
- Lyrics parsing and synchronization
- WebSocket event handling

### Integration Testing

- End-to-end queue workflow
- Multi-user session scenarios
- Jellyfin server integration
- Real-time synchronization between clients

### User Experience Testing

- Mobile interface responsiveness
- TV display readability from distance
- Audio/lyrics synchronization accuracy
- Performance with multiple concurrent users

### Performance Testing

- Large media library search performance
- WebSocket connection scaling
- Memory usage with long-running sessions
- Audio streaming reliability

## Security Considerations

### Jellyfin Authentication

- Secure storage of Jellyfin credentials
- Token refresh handling
- API key management for server-to-server communication

### Session Management

- Simple user identification (no complex auth needed)
- Session isolation between different karaoke instances
- Rate limiting for API endpoints

### Content Access

- Respect Jellyfin user permissions
- Media file access through Jellyfin's security model
- No direct file system access from web clients

## Deployment Architecture

### Development Setup

- Docker Compose with Jellyfin and Next.js application
- Next.js development server with hot reload
- Mock data for testing without full Jellyfin setup
- Integrated frontend and backend development

### Production Deployment

- Single Docker container for Next.js application
- Environment-based configuration
- Health checks and monitoring
- Optional reverse proxy for custom domains

### Configuration Management

- Environment variables for Jellyfin connection
- Next.js configuration for WebSocket support
- Configurable lyrics file locations
- Adjustable queue and session limits
