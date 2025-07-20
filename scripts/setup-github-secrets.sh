#!/bin/bash

# GitHub Secrets Setup Helper Script
# This script helps you set up the required GitHub secrets for Docker Hub publishing

set -e

echo "🐳 GitHub Actions Docker Hub Setup Helper"
echo "========================================"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Please install it from: https://cli.github.com/"
    echo "   Or use the GitHub web interface to add secrets manually."
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ You are not logged in to GitHub CLI."
    echo "   Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and you are logged in."
echo ""

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Current repository: $REPO"
echo ""

# Prompt for Docker Hub username
read -p "🐳 Enter your Docker Hub username (mrorbitman): " DOCKERHUB_USERNAME
DOCKERHUB_USERNAME=${DOCKERHUB_USERNAME:-mrorbitman}

# Prompt for Docker Hub token
echo ""
echo "🔑 Docker Hub Access Token:"
echo "   1. Go to https://hub.docker.com/settings/security"
echo "   2. Click 'New Access Token'"
echo "   3. Name it 'GitHub Actions'"
echo "   4. Select 'Read, Write, Delete' permissions"
echo "   5. Copy the generated token"
echo ""
read -s -p "   Paste your Docker Hub access token: " DOCKERHUB_TOKEN
echo ""

if [ -z "$DOCKERHUB_TOKEN" ]; then
    echo "❌ Docker Hub token cannot be empty."
    exit 1
fi

echo ""
echo "🔧 Setting up GitHub secrets..."

# Set the secrets
gh secret set DOCKERHUB_USERNAME --body "$DOCKERHUB_USERNAME"
gh secret set DOCKERHUB_TOKEN --body "$DOCKERHUB_TOKEN"

echo "✅ GitHub secrets have been set successfully!"
echo ""
echo "📋 Summary:"
echo "   - DOCKERHUB_USERNAME: $DOCKERHUB_USERNAME"
echo "   - DOCKERHUB_TOKEN: [HIDDEN]"
echo ""
echo "🚀 Next steps:"
echo "   1. Push your code to trigger the workflow:"
echo "      git add ."
echo "      git commit -m 'feat: add Docker Hub publishing'"
echo "      git push origin main"
echo ""
echo "   2. Or create a release tag:"
echo "      git tag v1.0.0"
echo "      git push origin v1.0.0"
echo ""
echo "   3. Monitor the build at:"
echo "      https://github.com/$REPO/actions"
echo ""
echo "   4. Check your Docker Hub repository:"
echo "      https://hub.docker.com/r/$DOCKERHUB_USERNAME/karaoke-for-jellyfin"
echo ""
echo "🎉 Setup complete!"
