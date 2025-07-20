# Docker Setup for Karaoke For Jellyfin

This document provides instructions for building and running the Karaoke For Jellyfin application using Docker.

## Quick Start

### Using Docker Compose (Recommended)

1. **Copy the environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your configuration:**
   ```bash
   # Jellyfin Configuration
   JELLYFIN_SERVER_URL=http://host.docker.internal:8096
   JELLYFIN_API_KEY=your_jellyfin_api_key_here
   JELLYFIN_USERNAME=your_jellyfin_username_here

   # Lyrics Configuration (adjust paths as needed)
   LYRICS_PATH=./lyrics
   JELLYFIN_MEDIA_PATH=/path/to/your/jellyfin/media

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SESSION_SECRET=your_secure_session_secret_here
   ```

3. **Start the application:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Mobile interface: http://localhost:3000
   - TV display: http://localhost:3000/tv

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t karaoke-for-jellyfin .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name karaoke-app \
     -p 3000:3000 \
     -e JELLYFIN_SERVER_URL=http://host.docker.internal:8096 \
     -e JELLYFIN_API_KEY=your_api_key \
     -e JELLYFIN_USERNAME=your_username \
     -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
     -e SESSION_SECRET=your_session_secret \
     -v $(pwd)/lyrics:/app/lyrics:ro \
     -v /path/to/jellyfin/media:/app/media:ro \
     --add-host host.docker.internal:host-gateway \
     karaoke-for-jellyfin
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JELLYFIN_SERVER_URL` | URL to your Jellyfin server | `http://localhost:8096` | Yes |
| `JELLYFIN_API_KEY` | Jellyfin API key | - | Yes |
| `JELLYFIN_USERNAME` | Jellyfin username | - | Yes |
| `LYRICS_PATH` | Path to lyrics folder | `/app/lyrics` | No |
| `JELLYFIN_MEDIA_PATH` | Path to Jellyfin media | `/app/media` | No |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | `http://localhost:3000` | No |
| `SESSION_SECRET` | Secret for session management | - | Yes |

### Volume Mounts

- **Lyrics Directory**: Mount your lyrics folder to `/app/lyrics` (read-only)
- **Media Directory**: Mount your Jellyfin media folder to `/app/media` (read-only)

### Network Configuration

The application needs to communicate with your Jellyfin server. There are several ways to configure this:

#### Option 1: Host Gateway (Recommended)
Use `host.docker.internal` in your Jellyfin URL and add the host gateway:
```bash
--add-host host.docker.internal:host-gateway
```

#### Option 2: Host Network
Use host networking to access services on localhost:
```yaml
network_mode: host
```

#### Option 3: External Network
If Jellyfin is running in another container, use a shared network.

## Development

### Development with Docker

For development, you can mount the source code and use hot reloading:

```bash
docker run -it \
  --name karaoke-dev \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -e NODE_ENV=development \
  node:18-alpine \
  sh -c "cd /app && npm install && npm run dev"
```

### Building for Different Architectures

To build for multiple architectures (useful for deployment on different systems):

```bash
# Build for AMD64 and ARM64
docker buildx build --platform linux/amd64,linux/arm64 -t karaoke-for-jellyfin .
```

## Troubleshooting

### Common Issues

1. **Cannot connect to Jellyfin server**
   - Ensure `JELLYFIN_SERVER_URL` is accessible from within the container
   - Use `host.docker.internal` instead of `localhost` if Jellyfin is on the host
   - Check firewall settings

2. **Lyrics not loading**
   - Verify the lyrics directory is mounted correctly
   - Check file permissions (container runs as user `nextjs` with UID 1001)

3. **WebSocket connection issues**
   - Ensure port 3000 is properly exposed
   - Check if reverse proxy is configured correctly for WebSocket upgrades

4. **Permission denied errors**
   - The container runs as a non-root user (nextjs:nodejs)
   - Ensure mounted volumes have appropriate permissions

### Logs

View application logs:
```bash
# Docker Compose
docker-compose logs -f karaoke-app

# Docker directly
docker logs -f karaoke-app
```

### Health Check

Check if the application is running:
```bash
curl http://localhost:3000/api/health
```

## Production Deployment

### Security Considerations

1. **Use strong session secrets**: Generate a secure random string for `SESSION_SECRET`
2. **Secure API keys**: Store Jellyfin API keys securely (consider using Docker secrets)
3. **Network security**: Use proper firewall rules and consider using a reverse proxy
4. **Regular updates**: Keep the Docker image updated with security patches

### Performance Optimization

1. **Resource limits**: Set appropriate CPU and memory limits
2. **Persistent storage**: Use named volumes for better performance
3. **Reverse proxy**: Use nginx or similar for SSL termination and caching

### Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  karaoke-app:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"  # Only bind to localhost
    environment:
      - NODE_ENV=production
      - JELLYFIN_SERVER_URL=https://your-jellyfin-server.com
      - JELLYFIN_API_KEY_FILE=/run/secrets/jellyfin_api_key
      - SESSION_SECRET_FILE=/run/secrets/session_secret
    volumes:
      - lyrics_data:/app/lyrics:ro
      - media_data:/app/media:ro
    secrets:
      - jellyfin_api_key
      - session_secret
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

volumes:
  lyrics_data:
    external: true
  media_data:
    external: true

secrets:
  jellyfin_api_key:
    external: true
  session_secret:
    external: true
```

## Support

If you encounter issues with the Docker setup, please check:
1. Docker and Docker Compose versions
2. System requirements and available resources
3. Network connectivity to Jellyfin server
4. File permissions for mounted volumes
