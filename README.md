# Karaoke For Jellyfin

[![Docker Build](https://github.com/your-username/karaoke-for-jellyfin/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/your-username/karaoke-for-jellyfin/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/mrorbitman/karaoke-for-jellyfin)](https://hub.docker.com/r/mrorbitman/karaoke-for-jellyfin)

A web-based karaoke system that integrates with Jellyfin media server to provide karaoke functionality.

The system has two parts:

1. A large "Karaoke" UI where the singer/audience can see the lyrics and sing along, see who is up next, and scan QR code to join the fun. This is intended to be put up on a TV screen. The url is `<hostname>/tv`.
2. A mobile-optimized interface for searching and adding songs to the queue. When you scan the QR code on the TV, it opens this link (`<hostname>/`).

### Mobile Interface
Use your phone to search and queue songs while others sing along on the TV.

| Search & Browse | Add Songs | Manage Queue |
|---|---|---|
| ![Mobile Search](./screenshots/mobile-1-search-artists-playlists-songs.png) | ![Add Song](./screenshots/mobile-2-add-song-to-queue.png) | ![Queue Management](./screenshots/mobile-3-manage-queue.png) |
| Search by artist, playlist, or song title with real-time results | Add songs to the queue with server confirmation and loading feedback | View and manage the current queue with drag-to-reorder functionality |

### TV Display
Full-screen karaoke experience with lyrics, performance feedback, and queue management.

| Auto-Play & Controls | Sing-Along Lyrics | Performance Rating | Next Song Countdown |
|---|---|---|---|
| ![TV Autoplay](./screenshots/tv-1-autoplay-when-song-added.png) | ![TV Lyrics](./screenshots/tv-2-sing-along-with-lyrics.png) | ![TV Rating](./screenshots/tv-3-graded-singing-performance.png) | ![TV Next Up](./screenshots/tv-4-next-up-countdown.png) |
| Automatic playback when songs are added with host controls | Full-screen lyrics display with real-time synchronization | Performance ratings and feedback after each song. (These are just random. Shhh!) | Smooth transitions with next song preview and countdown timer |

---

## Features

- **Mobile Interface**: Search and queue songs from your phone
- **TV Display**: Full-screen lyrics display and playback control
- **Jellyfin Integration**: Leverages your existing Jellyfin media library
- **Real-time Sync**: WebSocket-based real-time updates between devices
- **Progressive Web App**: Install on mobile/desktop for native app experience
- **Offline Support**: Core functionality works without internet connection

## Getting Started

### Docker Compose (Recommended)

The easiest way to run Karaoke For Jellyfin is using Docker:

```bash
version: "3.8"
services:
  karaoke-app:
    image: mrorbitman/karaoke-for-jellyfin:latest
    ports:
      - 3967:3000
    environment:
      # Jellyfin Configuration
      - JELLYFIN_SERVER_URL=${JELLYFIN_SERVER_URL:-http://localhost:8096}
      - JELLYFIN_API_KEY=${JELLYFIN_API_KEY}
      - JELLYFIN_USERNAME=${JELLYFIN_USERNAME}

      # OPTIONAL Playlist Filtering
      - PLAYLIST_FILTER_REGEX=${PLAYLIST_FILTER_REGEX}

      # OPTIONAL TV Display Timing Configuration (in milliseconds)
      - RATING_ANIMATION_DURATION=${RATING_ANIMATION_DURATION:-15000}
      - NEXT_SONG_DURATION=${NEXT_SONG_DURATION:-15000}
      - CONTROLS_AUTO_HIDE_DELAY=${CONTROLS_AUTO_HIDE_DELAY:-10000}
      - AUTOPLAY_DELAY=${AUTOPLAY_DELAY:-500}
      - QUEUE_AUTOPLAY_DELAY=${QUEUE_AUTOPLAY_DELAY:-1000}
      - TIME_UPDATE_INTERVAL=${TIME_UPDATE_INTERVAL:-2000}

      # System Configuration
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    restart: always
networks: {}

```

### Local Development

### Prerequisites

- Node.js 18+
- A running Jellyfin server
- Audio files in your Jellyfin library

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment configuration:

   ```bash
   cp .env.local.example .env.local
   ```

4. Update `.env.local` with your Jellyfin server details

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) for the mobile interface
7. Open [http://localhost:3000/tv](http://localhost:3000/tv) for the TV display

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── tv/           # TV display interface
│   └── page.tsx      # Mobile interface
├── components/
│   ├── mobile/       # Mobile-specific components
│   └── tv/           # TV-specific components
├── lib/              # Utility libraries
├── services/         # Business logic services
└── types/            # TypeScript type definitions
```

## Development Status

This project is currently in development. See the implementation tasks in `.kiro/specs/self-hosted-karaoke/tasks.md` for current progress.
