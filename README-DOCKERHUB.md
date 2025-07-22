# Karaoke For Jellyfin

A web-based karaoke system that integrates with Jellyfin media server to provide karaoke functionality.

## Quick Start

### Using Docker Compose (Recommended)

1. **Create a docker-compose.yml file:**

```yaml
version: "3.8"

services:
  karaoke-app:
    image: mrorbitman/karaoke-for-jellyfin:latest
    ports:
      - "3000:3000"
    environment:
      # Jellyfin Configuration
      - JELLYFIN_SERVER_URL=http://your-jellyfin-server:8096
      - JELLYFIN_API_KEY=your_jellyfin_api_key_here
      - JELLYFIN_USERNAME=your_jellyfin_username_here

      # Optional: Lyrics Configuration
      - LYRICS_PATH=/app/lyrics
      - JELLYFIN_MEDIA_PATH=/app/media
    volumes:
      # Optional: Mount lyrics directory
      - ./lyrics:/app/lyrics:ro
      # Optional: Mount Jellyfin media directory
      - /path/to/jellyfin/media:/app/media:ro
    restart: unless-stopped
    extra_hosts:
      # Allow container to access host services
      - "host.docker.internal:host-gateway"
```

2. **Start the application:**

   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Mobile interface: http://localhost:3000
   - TV display: http://localhost:3000/tv

### Using Docker Run

```bash
docker run -d \
  --name karaoke-app \
  -p 3000:3000 \
  -e JELLYFIN_SERVER_URL=http://your-jellyfin-server:8096 \
  -e JELLYFIN_API_KEY=your_api_key \
  -e JELLYFIN_USERNAME=your_username \
  --add-host host.docker.internal:host-gateway \
  mrorbitman/karaoke-for-jellyfin:latest
```

## Features

- **Mobile Interface**: Search and queue songs from your phone
- **TV Display**: Full-screen lyrics display and playback control
- **Jellyfin Integration**: Leverages your existing Jellyfin media library
- **Real-time Sync**: WebSocket-based real-time updates between devices
- **Multi-platform**: Supports AMD64 and ARM64 architectures

## Environment Variables

| Variable              | Description                 | Required | Default       |
| --------------------- | --------------------------- | -------- | ------------- |
| `JELLYFIN_SERVER_URL` | URL to your Jellyfin server | Yes      | -             |
| `JELLYFIN_API_KEY`    | Jellyfin API key            | Yes      | -             |
| `JELLYFIN_USERNAME`   | Jellyfin username           | Yes      | -             |
| `LYRICS_PATH`         | Path to lyrics folder       | No       | `/app/lyrics` |
| `JELLYFIN_MEDIA_PATH` | Path to Jellyfin media      | No       | `/app/media`  |

## Getting Your Jellyfin API Key

1. Log into your Jellyfin server as an administrator
2. Go to **Dashboard** → **API Keys**
3. Click **New API Key**
4. Give it a name (e.g., "Karaoke App")
5. Copy the generated API key

## Volume Mounts

- **Lyrics Directory**: Mount your lyrics folder to `/app/lyrics` (read-only)
- **Media Directory**: Mount your Jellyfin media folder to `/app/media` (read-only)

## Network Configuration

The application needs to communicate with your Jellyfin server:

- **Host Gateway**: Use `host.docker.internal` in your Jellyfin URL for localhost servers
- **External Server**: Use the full URL/IP of your Jellyfin server
- **Docker Network**: If Jellyfin is in another container, use a shared network

## Supported Architectures

This image supports multiple architectures:

- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/AArch64)

## Tags

- `latest` - Latest stable release from main branch
- `v1.0.0`, `v1.0`, `v1` - Semantic version tags
- `main` - Latest development build

## Health Check

The application exposes a health endpoint at `/api/health` for monitoring.

## Troubleshooting

### Common Issues

1. **Cannot connect to Jellyfin server**
   - Ensure `JELLYFIN_SERVER_URL` is accessible from within the container
   - Use `host.docker.internal` instead of `localhost` if Jellyfin is on the host
   - Check firewall settings

2. **WebSocket connection issues**
   - Ensure port 3000 is properly exposed
   - Check if reverse proxy is configured correctly for WebSocket upgrades

3. **Permission denied errors**
   - The container runs as a non-root user (nextjs:nodejs)
   - Ensure mounted volumes have appropriate permissions

### Logs

View application logs:

```bash
docker logs karaoke-app
```

## Source Code

- **GitHub**: [https://github.com/your-username/karaoke-for-jellyfin](https://github.com/your-username/karaoke-for-jellyfin)
- **Issues**: Report bugs and feature requests on GitHub

## License

This project is open source. See the repository for license details.

---

**Note**: This application requires a running Jellyfin server with audio files in your media library. Make sure your Jellyfin server is accessible from the Docker container.
