#!/bin/bash

# Karaoke for Jellyfin - Android TV APK Build Script
# This script uses Google's Bubblewrap to create an Android TV APK

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="karaoke-for-jellyfin"
PACKAGE_NAME="com.jellyfin.karaoke.tv"
APP_NAME="Karaoke TV"
BUILD_DIR="android-tv-build"
MANIFEST_FILE="public/manifest-tv.json"

echo -e "${BLUE}🎤 Building Karaoke for Jellyfin Android TV APK${NC}"
echo "=================================================="

# Check if required tools are installed
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    # Check Java (required for Android builds)
    if ! command -v java &> /dev/null; then
        echo -e "${RED}❌ Java is not installed. Please install Java 8 or higher${NC}"
        exit 1
    fi
    
    # Check if Bubblewrap CLI is installed
    if ! command -v bubblewrap &> /dev/null; then
        echo -e "${YELLOW}⚠️  Bubblewrap CLI not found. Installing...${NC}"
        npm install -g @bubblewrap/cli
    fi
    
    echo -e "${GREEN}✅ All dependencies are available${NC}"
}

# Create Android TV specific manifest
create_tv_manifest() {
    echo -e "${YELLOW}Creating Android TV manifest...${NC}"
    
    cat > "$MANIFEST_FILE" << EOF
{
  "name": "Karaoke TV Display",
  "short_name": "Karaoke TV",
  "description": "Full-screen karaoke display for Android TV",
  "start_url": "/tv",
  "display": "fullscreen",
  "background_color": "#8B5CF6",
  "theme_color": "#8B5CF6",
  "orientation": "landscape-primary",
  "scope": "/",
  "lang": "en",
  "categories": ["entertainment", "music"],
  "icons": [
    {
      "src": "/icons/icon-48x48.png",
      "sizes": "48x48",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-256x256.png",
      "sizes": "256x256",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
EOF
    
    echo -e "${GREEN}✅ TV manifest created${NC}"
}

# Build the Next.js application
build_nextjs() {
    echo -e "${YELLOW}Building Next.js application...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    # Build the application
    npm run build
    
    echo -e "${GREEN}✅ Next.js build completed${NC}"
}

# Initialize Bubblewrap project
init_bubblewrap() {
    echo -e "${YELLOW}Initializing Bubblewrap project...${NC}"
    
    # Clean up previous build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"
    
    # Get the local server URL (you'll need to update this with your actual server URL)
    read -p "Enter your Karaoke server URL (e.g., http://192.168.1.100:3967): " SERVER_URL
    
    if [ -z "$SERVER_URL" ]; then
        echo -e "${RED}❌ Server URL is required${NC}"
        exit 1
    fi
    
    # Initialize Bubblewrap with TV-specific configuration
    bubblewrap init --manifest="${SERVER_URL}/manifest-tv.json" \
        --directory=. \
        --packageId="$PACKAGE_NAME" \
        --name="$APP_NAME" \
        --launcherName="$APP_NAME" \
        --display=fullscreen \
        --orientation=landscape \
        --themeColor="#8B5CF6" \
        --backgroundColor="#8B5CF6" \
        --startUrl="/tv" \
        --iconUrl="${SERVER_URL}/icons/icon-512x512.png" \
        --maskableIconUrl="${SERVER_URL}/icons/icon-512x512.png"
    
    echo -e "${GREEN}✅ Bubblewrap project initialized${NC}"
}

# Configure Android TV specific settings
configure_android_tv() {
    echo -e "${YELLOW}Configuring Android TV settings...${NC}"
    
    # Update the TWA manifest for Android TV
    if [ -f "twa-manifest.json" ]; then
        # Use jq if available, otherwise use sed
        if command -v jq &> /dev/null; then
            # Add Android TV specific configurations using jq
            jq '.androidPackage.features += [
                {
                    "name": "android.software.leanback",
                    "required": true
                },
                {
                    "name": "android.hardware.touchscreen",
                    "required": false
                }
            ]' twa-manifest.json > twa-manifest-temp.json && mv twa-manifest-temp.json twa-manifest.json
            
            # Set TV launcher category
            jq '.androidPackage.launcherName = "Karaoke TV"' twa-manifest.json > twa-manifest-temp.json && mv twa-manifest-temp.json twa-manifest.json
        else
            echo -e "${YELLOW}⚠️  jq not found. Manual configuration may be needed.${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ Android TV configuration completed${NC}"
}

# Build the APK
build_apk() {
    echo -e "${YELLOW}Building APK...${NC}"
    
    # Build the APK
    bubblewrap build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ APK build completed successfully!${NC}"
        
        # Find the generated APK
        APK_FILE=$(find . -name "*.apk" -type f | head -1)
        if [ -n "$APK_FILE" ]; then
            echo -e "${GREEN}📱 APK location: $(pwd)/$APK_FILE${NC}"
            
            # Copy APK to project root for easy access
            cp "$APK_FILE" "../karaoke-tv.apk"
            echo -e "${GREEN}📱 APK copied to: $(pwd)/../karaoke-tv.apk${NC}"
        fi
    else
        echo -e "${RED}❌ APK build failed${NC}"
        exit 1
    fi
}

# Install APK to connected device (optional)
install_apk() {
    read -p "Do you want to install the APK to a connected Android TV device? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v adb &> /dev/null; then
            echo -e "${YELLOW}Installing APK to connected device...${NC}"
            
            APK_FILE=$(find . -name "*.apk" -type f | head -1)
            if [ -n "$APK_FILE" ]; then
                adb install "$APK_FILE"
                echo -e "${GREEN}✅ APK installed successfully!${NC}"
            else
                echo -e "${RED}❌ APK file not found${NC}"
            fi
        else
            echo -e "${RED}❌ ADB not found. Please install Android SDK platform tools${NC}"
        fi
    fi
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    cd ..
    # Remove temporary TV manifest
    if [ -f "$MANIFEST_FILE" ]; then
        rm "$MANIFEST_FILE"
    fi
}

# Main execution
main() {
    check_dependencies
    create_tv_manifest
    build_nextjs
    init_bubblewrap
    configure_android_tv
    build_apk
    install_apk
    cleanup
    
    echo -e "${GREEN}🎉 Android TV APK build process completed!${NC}"
    echo -e "${BLUE}📱 Your Karaoke TV APK is ready: karaoke-tv.apk${NC}"
    echo -e "${BLUE}🚀 Install it on your Android TV to enjoy full-screen karaoke!${NC}"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"
