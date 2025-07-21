#!/bin/bash

# Jellyfin Lyrics Manager Runner
# This script sets up and runs the lyrics manager with proper error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Jellyfin Lyrics Manager${NC}"
echo "=========================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed${NC}"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is required but not installed${NC}"
    exit 1
fi

# Install requirements if needed
if [ -f "requirements.txt" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip3 install -r requirements.txt
fi

# Check SSH connectivity
echo -e "${YELLOW}Testing SSH connectivity...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes umbrel@192.168.7.211 exit 2>/dev/null; then
    echo -e "${RED}Warning: Cannot connect to umbrel@192.168.7.211${NC}"
    echo "Make sure:"
    echo "1. The server is running and accessible"
    echo "2. SSH key authentication is set up"
    echo "3. The IP address is correct"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Show usage options
echo ""
echo "Usage options:"
echo "  --dry-run     : Show what would be done without making changes"
echo "  --limit N     : Process only N songs (for testing)"
echo "  --library NAME: Process specific library"
echo "  --no-resume  : Start from beginning instead of resuming"
echo ""

# Run the script with all passed arguments
echo -e "${GREEN}Starting Jellyfin Lyrics Manager...${NC}"
python3 jellyfin-lyrics-manager.py "$@"

echo -e "${GREEN}Done!${NC}"
