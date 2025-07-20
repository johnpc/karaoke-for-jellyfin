# Progressive Web App (PWA) Features

Karaoke For Jellyfin is a fully-featured Progressive Web App that can be installed on mobile devices and desktops for a native app-like experience.

## Features

### 📱 **Mobile Installation**
- **Add to Home Screen**: Install directly from your mobile browser
- **Standalone Mode**: Runs without browser UI for a native feel
- **Offline Support**: Basic functionality works without internet connection
- **Push Notifications**: Get notified about queue updates (coming soon)

### 🖥️ **Desktop Installation**
- **Chrome/Edge**: Install via browser's install prompt
- **Safari**: Add to Dock on macOS
- **Firefox**: Install via address bar icon

### 🎨 **Custom Icon & Branding**
- **High-Quality Icon**: Custom-designed karaoke microphone icon
- **Multiple Sizes**: Optimized for all device types and screen densities
- **Theme Colors**: Purple gradient theme matching the app design
- **Splash Screen**: Custom loading screen on mobile devices

## Installation Instructions

### Mobile Devices (iOS/Android)

#### Chrome/Edge/Samsung Internet:
1. Open the app in your mobile browser
2. Look for the "Install" prompt at the bottom of the screen
3. Tap "Install" to add to your home screen
4. The app will appear as a native app icon

#### Safari (iOS):
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired and tap "Add"

### Desktop

#### Chrome/Edge:
1. Open the app in your browser
2. Look for the install icon in the address bar
3. Click the install prompt or the icon
4. Click "Install" in the confirmation dialog

#### Safari (macOS):
1. Open the app in Safari
2. Go to File → Add to Dock
3. The app will be added to your Dock

## PWA Capabilities

### ✅ **Currently Supported**
- **Offline Caching**: Core app files cached for offline access
- **Responsive Design**: Optimized for all screen sizes
- **Fast Loading**: Service worker caching for instant startup
- **Native Feel**: Fullscreen mode without browser chrome
- **App Shortcuts**: Quick access to TV display mode

### 🚧 **Coming Soon**
- **Background Sync**: Queue updates when offline
- **Push Notifications**: Real-time notifications
- **File System Access**: Direct lyrics file management
- **Share Target**: Share songs directly to the app

## Technical Details

### Service Worker
The app includes a service worker (`/sw.js`) that:
- Caches essential app resources
- Enables offline functionality
- Provides fast loading times
- Manages cache updates

### Manifest Configuration
The web app manifest (`/manifest.json`) defines:
- App name and description
- Icon sets for all device types
- Display mode (standalone)
- Theme colors
- App shortcuts
- Start URL and scope

### Icon Specifications
The app includes icons in the following sizes:
- **48x48** - Small devices
- **72x72** - Medium devices  
- **96x96** - Standard mobile
- **128x128** - Large mobile
- **144x144** - High-DPI mobile
- **152x152** - iPad
- **167x167** - iPad Pro
- **192x192** - Android standard
- **256x256** - Large displays
- **384x384** - Extra large
- **512x512** - Splash screens
- **1024x1024** - High resolution

### Browser Support
- ✅ **Chrome** (Android/Desktop)
- ✅ **Edge** (Desktop/Mobile)
- ✅ **Safari** (iOS/macOS)
- ✅ **Firefox** (Desktop)
- ✅ **Samsung Internet** (Android)
- ⚠️ **Opera** (Limited support)

## Development

### Building Icons
Icons are generated using ImageMagick:

```bash
# Generate all icon sizes
npm run build:icons

# Or manually with ImageMagick
magick icon-source.png -resize 192x192 public/icons/icon-192x192.png
```

### Testing PWA Features

#### Local Testing:
```bash
# Build and serve
npm run build
npm start

# Test on mobile device using ngrok or similar
npx ngrok http 3000
```

#### PWA Audit:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run PWA audit
4. Check for any missing features

### Service Worker Development
The service worker is located at `/public/sw.js` and handles:
- Resource caching strategy
- Offline fallbacks
- Cache management
- Background sync (future)

## Troubleshooting

### Installation Issues

**"Add to Home Screen" not appearing:**
- Ensure HTTPS is enabled (required for PWA)
- Check that manifest.json is accessible
- Verify service worker is registered
- Clear browser cache and try again

**App not working offline:**
- Check service worker registration in DevTools
- Verify cached resources in Application tab
- Ensure critical resources are in cache list

**Icons not displaying correctly:**
- Verify icon files exist in `/public/icons/`
- Check manifest.json icon paths
- Clear browser cache
- Test different icon sizes

### Performance Issues

**Slow loading:**
- Check service worker caching
- Optimize icon file sizes
- Review cached resource list

**High memory usage:**
- Limit cached resources
- Implement cache expiration
- Use appropriate image formats

## Future Enhancements

### Planned Features
- **Background Sync**: Queue updates when offline
- **Push Notifications**: Real-time queue notifications
- **File System Access**: Direct lyrics file management
- **Share Target**: Share songs from other apps
- **Periodic Background Sync**: Automatic updates

### Advanced PWA Features
- **Web Share API**: Share songs with friends
- **Media Session API**: Control playback from lock screen
- **Badging API**: Show queue count on app icon
- **Screen Wake Lock**: Keep screen on during karaoke

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Testing](https://web.dev/pwa-checklist/)
