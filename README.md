# Karaoke For Jellyfin

[![Docker Build](https://github.com/your-username/karaoke-for-jellyfin/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/your-username/karaoke-for-jellyfin/actions/workflows/docker-publish.yml)
[![Docker Hub](https://img.shields.io/docker/pulls/mrorbitman/karaoke-for-jellyfin)](https://hub.docker.com/r/mrorbitman/karaoke-for-jellyfin)

A web-based karaoke system that integrates with Jellyfin media server to provide karaoke functionality.

## Features

- **Mobile Interface**: Search and queue songs from your phone
- **TV Display**: Full-screen lyrics display and playback control
- **Jellyfin Integration**: Leverages your existing Jellyfin media library
- **Real-time Sync**: WebSocket-based real-time updates between devices

## Getting Started

### Docker (Recommended)

The easiest way to run Karaoke For Jellyfin is using Docker:

```bash
docker run -d \
  --name karaoke-app \
  -p 3000:3000 \
  -e JELLYFIN_SERVER_URL=http://your-jellyfin-server:8096 \
  -e JELLYFIN_API_KEY=your_api_key \
  -e JELLYFIN_USERNAME=your_username \
  -e SESSION_SECRET=your_session_secret \
  mrorbitman/karaoke-for-jellyfin:latest
```

Or use Docker Compose - see [DOCKER.md](./DOCKER.md) for detailed instructions.

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
