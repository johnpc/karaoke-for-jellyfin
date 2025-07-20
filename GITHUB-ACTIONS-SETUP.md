# GitHub Actions Setup for Docker Hub Publishing

This document explains how to set up the GitHub Actions workflow to automatically build and publish Docker images to Docker Hub.

## Prerequisites

1. **Docker Hub Account**: You need a Docker Hub account
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Docker Hub Repository**: Create a repository named `karaoke-for-jellyfin` on Docker Hub

## Step 1: Create Docker Hub Access Token

1. Log into [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** → **Security**
3. Click **New Access Token**
4. Give it a name (e.g., "GitHub Actions")
5. Select **Read, Write, Delete** permissions
6. Click **Generate**
7. **Copy the token immediately** (you won't be able to see it again)

## Step 2: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Required Secrets

| Secret Name          | Value               | Description                  |
| -------------------- | ------------------- | ---------------------------- |
| `DOCKERHUB_USERNAME` | `mrorbitman`        | Your Docker Hub username     |
| `DOCKERHUB_TOKEN`    | `your_access_token` | The access token from Step 1 |

### Adding Each Secret

1. Click **New repository secret**
2. Enter the **Name** (e.g., `DOCKERHUB_USERNAME`)
3. Enter the **Secret** value
4. Click **Add secret**
5. Repeat for each secret

## Step 3: Verify Workflow Configuration

The workflow file `.github/workflows/docker-publish.yml` is already configured to:

- **Trigger on**:
  - Push to `main` or `master` branch
  - New tags (e.g., `v1.0.0`)
  - Pull requests (build only, no push)
  - Manual workflow dispatch

- **Build for multiple architectures**:
  - `linux/amd64` (Intel/AMD 64-bit)
  - `linux/arm64` (ARM 64-bit, including Apple Silicon)

- **Tag strategy**:
  - `latest` for main branch
  - Version tags for releases (e.g., `v1.0.0`, `v1.0`, `v1`)
  - Branch names for feature branches

## Step 4: Test the Workflow

### Option 1: Push to Main Branch

```bash
git add .
git commit -m "feat: add Docker Hub publishing workflow"
git push origin main
```

### Option 2: Create a Release Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Option 3: Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build and Push Docker Image** workflow
4. Click **Run workflow**
5. Choose the branch and click **Run workflow**

## Step 5: Monitor the Build

1. Go to the **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Monitor the build progress
4. Check for any errors in the logs

## Step 6: Verify Docker Hub

1. Go to [Docker Hub](https://hub.docker.com/)
2. Navigate to your repository: `mrorbitman/karaoke-for-jellyfin`
3. Verify the image was pushed successfully
4. Check that the README was updated automatically

## Workflow Features

### Multi-Architecture Support

The workflow builds for both AMD64 and ARM64 architectures, making it compatible with:

- Intel/AMD servers and desktops
- ARM-based systems (including Raspberry Pi, Apple Silicon Macs)

### Caching

The workflow uses GitHub Actions cache to speed up builds by caching Docker layers.

### Security

- Secrets are never exposed in logs
- Only pushes images on main branch and tags (not on pull requests)
- Uses official GitHub Actions for security

### Automatic README Updates

The workflow automatically updates the Docker Hub repository description with the contents of `README-DOCKERHUB.md`.

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are correct
   - Ensure the access token has the right permissions

2. **Build Fails**
   - Check the Dockerfile syntax
   - Verify all dependencies are available
   - Check the build logs for specific errors

3. **Multi-arch Build Issues**
   - Some dependencies might not support all architectures
   - Check if base images support the target architecture

4. **README Not Updated**
   - Verify the `README-DOCKERHUB.md` file exists
   - Check that the workflow has the correct file path

### Viewing Logs

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Click on the job name (e.g., "build-and-push")
4. Expand the failing step to see detailed logs

## Manual Docker Commands

If you need to build and push manually:

```bash
# Build for multiple architectures
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t mrorbitman/karaoke-for-jellyfin:latest \
  --push .

# Build for single architecture
docker build -t mrorbitman/karaoke-for-jellyfin:latest .
docker push mrorbitman/karaoke-for-jellyfin:latest
```

## Next Steps

Once the workflow is set up and working:

1. **Create releases**: Use semantic versioning (e.g., v1.0.0, v1.1.0)
2. **Monitor usage**: Check Docker Hub for download statistics
3. **Update documentation**: Keep README-DOCKERHUB.md up to date
4. **Security**: Regularly rotate access tokens

## Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Verify your Docker Hub credentials
3. Test the Docker build locally first
4. Check the GitHub Actions documentation
