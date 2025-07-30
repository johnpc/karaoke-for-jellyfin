# Building Android TV APK

This guide explains how to build an Android TV APK for the Karaoke for Jellyfin project using Google's Bubblewrap.

## Prerequisites

Before building the APK, ensure you have the following installed:

1. **Node.js** (version 18 or higher)
2. **npm** (comes with Node.js)
3. **Java Development Kit (JDK)** (version 8 or higher)
4. **Android SDK** (optional, for installing to device)

### Installing Java

**On macOS:**

```bash
brew install openjdk@11
```

**On Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install openjdk-11-jdk
```

**On Windows:**
Download and install from [Oracle's website](https://www.oracle.com/java/technologies/downloads/) or use [OpenJDK](https://adoptium.net/).

### Installing Android SDK (Optional)

Only needed if you want to install the APK directly to a connected device:

1. Download [Android Studio](https://developer.android.com/studio)
2. Install Android SDK through Android Studio
3. Add `adb` to your PATH

## Building the APK

### Method 1: Using the Node.js Script (Recommended)

1. **Configure your server URL** in `.env.local`:

   ```bash
   # Copy the example file if you haven't already
   cp .env.local.example .env.local

   # Edit .env.local and set your server URL
   KARAOKE_SERVER_URL=http://192.168.1.100:3967
   ```

2. **Make the script executable:**

   ```bash
   chmod +x scripts/build-tv-apk.js
   ```

3. **Run the build script:**

   ```bash
   npm run build:android-tv
   ```

   Or directly:

   ```bash
   node scripts/build-tv-apk.js
   ```

4. **Follow the prompts:**
   - The script will automatically use your `KARAOKE_SERVER_URL` from `.env.local`
   - If not set, it will prompt you to enter the server URL
   - Choose whether to install to a connected device

### Method 2: Using the Bash Script

1. **Make the script executable:**

   ```bash
   chmod +x scripts/build-android-tv.sh
   ```

2. **Run the script:**
   ```bash
   ./scripts/build-android-tv.sh
   ```

## What the Build Process Does

1. **Dependency Check**: Verifies all required tools are installed
2. **TV Manifest Creation**: Creates an Android TV-specific web app manifest
3. **Next.js Build**: Builds the production version of your app
4. **Bubblewrap Initialization**: Sets up the Trusted Web Activity project
5. **Android TV Configuration**: Adds TV-specific features and permissions
6. **APK Build**: Compiles the final APK file
7. **Installation** (optional): Installs to connected Android TV device

## Output

After a successful build, you'll find:

- `karaoke-tv.apk` - The Android TV APK file in your project root
- `android-tv-build/` - Temporary build directory (can be deleted)

## Android TV Specific Features

The generated APK includes:

### Required Features

- `android.software.leanback` - Identifies as Android TV app
- `android.hardware.touchscreen` (not required) - Works without touchscreen

### Permissions

- `android.permission.INTERNET` - Network access
- `android.permission.ACCESS_NETWORK_STATE` - Network state monitoring
- `android.permission.WAKE_LOCK` - Prevent screen sleep during karaoke

### App Configuration

- **Display Mode**: Fullscreen for immersive experience
- **Orientation**: Landscape (optimized for TV screens)
- **Start URL**: `/tv` (opens directly to TV display interface)
- **Launcher Category**: `LEANBACK_LAUNCHER` (appears in Android TV launcher)

## Installing on Android TV

### Method 1: ADB Installation (Recommended)

1. **Enable Developer Options on your Android TV:**
   - Go to Settings > Device Preferences > About
   - Click "Build" 7 times to enable Developer Options
   - Go back to Settings > Device Preferences > Developer Options
   - Enable "USB Debugging" and "Apps from Unknown Sources"

2. **Connect via ADB:**

   ```bash
   # Find your Android TV's IP address in Settings > Network
   adb connect YOUR_TV_IP_ADDRESS:5555
   ```

3. **Install the APK:**
   ```bash
   adb install karaoke-tv.apk
   ```

### Method 2: USB Installation

1. Copy `karaoke-tv.apk` to a USB drive
2. Insert USB drive into Android TV
3. Use a file manager app to navigate to the APK
4. Install the APK (you may need to enable "Unknown Sources")

### Method 3: Network Installation

1. Upload the APK to a cloud storage service
2. Download and install a file manager on your Android TV
3. Download and install the APK through the file manager

## Troubleshooting

### Build Issues

**"Java not found" error:**

- Ensure Java is installed and in your PATH
- Try: `java --version` to verify installation

**"Bubblewrap command not found":**

- The script should auto-install Bubblewrap CLI
- Manual install: `npm install -g @bubblewrap/cli`

**Build fails during APK generation:**

- Ensure you have sufficient disk space
- Check that your server URL is accessible
- Verify all dependencies are correctly installed

### Installation Issues

**"App not installed" on Android TV:**

- Enable "Unknown Sources" in Developer Options
- Ensure the APK is not corrupted (try rebuilding)
- Check available storage space on the TV

**ADB connection issues:**

- Ensure USB Debugging is enabled
- Try disconnecting and reconnecting: `adb disconnect` then `adb connect IP:5555`
- Restart ADB server: `adb kill-server` then `adb start-server`

### Runtime Issues

**App crashes on startup:**

- Verify your Karaoke server is running and accessible
- Check the server URL is correct
- Ensure the `/tv` endpoint is working in a browser

**Network connectivity issues:**

- Verify Android TV and server are on the same network
- Check firewall settings on the server
- Test connectivity by opening the server URL in the TV's browser

## Customization

### Changing App Details

Edit the configuration in `scripts/build-tv-apk.js`:

```javascript
const CONFIG = {
  packageName: "com.jellyfin.karaoke.tv", // Android package name
  appName: "Karaoke TV", // Display name
  buildDir: "android-tv-build", // Build directory
  manifestFile: "public/manifest-tv.json", // TV manifest
  outputApk: "karaoke-tv.apk", // Output filename
};
```

### Adding Custom Icons

Replace the icons in the `public/icons/` directory with your custom icons. Ensure you have all required sizes:

- 48x48, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 256x256, 384x384, 512x512

### Modifying TV-Specific Settings

Edit the TV manifest creation in the build script to customize:

- Theme colors
- Orientation preferences
- Display mode
- App categories

## Security Considerations

### Keystore Management

For production builds, you should:

1. **Generate a keystore:**

   ```bash
   keytool -genkey -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Bubblewrap to use your keystore:**
   - Edit `twa-manifest.json` in the build directory
   - Update the `signingKey` section with your keystore details

3. **Keep your keystore secure:**
   - Never commit keystores to version control
   - Store keystores in a secure location
   - Back up your keystore safely

### Network Security

- Use HTTPS for production deployments
- Implement proper authentication if needed
- Consider network restrictions for sensitive environments

## Advanced Configuration

### Custom Bubblewrap Settings

You can modify the `twa-manifest-template.json` file to customize advanced Bubblewrap settings:

- Minimum SDK version
- Target SDK version
- Additional permissions
- Custom features
- Splash screen settings

### Build Automation

For CI/CD integration, you can automate the build process:

```bash
# Set environment variables
export KARAOKE_SERVER_URL="http://your-server:3967"
export SKIP_INSTALL="true"

# Run automated build
node scripts/build-tv-apk.js
```

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Verify all prerequisites are installed correctly
3. Ensure your Karaoke server is running and accessible
4. Check the [Bubblewrap documentation](https://github.com/GoogleChromeLabs/bubblewrap) for advanced issues

For project-specific issues, please check the main project documentation or create an issue in the repository.
