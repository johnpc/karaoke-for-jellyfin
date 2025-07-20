# Auto-Play Feature

The TV display now includes intelligent auto-play functionality that automatically starts music playback when songs are added to the queue, eliminating the need to manually press spacebar to begin karaoke sessions.

## How It Works

### 🎵 **Automatic Playback Triggers**

The auto-play system activates in two scenarios:

1. **New Song Available**: When a current song becomes available and playback is not already active
2. **Queue Population**: When the queue changes from empty to having pending songs

### ⚡ **Smart Logic**

The auto-play feature includes intelligent logic to prevent issues:

- **Single Trigger**: Prevents multiple auto-play attempts for the same song
- **Connection Check**: Only triggers when properly connected to the server
- **State Validation**: Ensures playback state is ready before attempting to play
- **Graceful Delays**: Uses appropriate delays to ensure audio is loaded and ready

### 🔄 **State Management**

- **Auto-play Flag**: Tracks whether auto-play has been triggered for the current song
- **Reset on Song Change**: Clears the flag when a new song becomes current
- **Connection Awareness**: Monitors connection status before triggering playback

## User Experience

### 📺 **TV Display**

- **Immediate Playback**: Songs start automatically when added to queue
- **Visual Feedback**: "Auto-play will start shortly..." message when songs are queued
- **Status Indicator**: Updated help text shows "Auto-play enabled"

### 📱 **Mobile Interface**

- **Seamless Experience**: Add songs and they start playing automatically on TV
- **No Manual Intervention**: No need to switch to TV to start playback
- **Real-time Updates**: Instant feedback when songs begin playing

## Technical Implementation

### 🏗️ **Architecture**

```typescript
// Auto-play when current song is available
useEffect(() => {
  if (
    currentSong &&
    isConnected &&
    playbackState &&
    !playbackState.isPlaying &&
    !hasTriggeredAutoPlay
  ) {
    // Trigger auto-play with delay for audio loading
    setTimeout(() => {
      playbackControl({
        action: "play",
        userId: "tv-display-autoplay",
        timestamp: new Date(),
      });
    }, 500);
  }
}, [currentSong, isConnected, playbackState, hasTriggeredAutoPlay]);

// Reset flag when song changes
useEffect(() => {
  setHasTriggeredAutoPlay(false);
}, [currentSong?.id]);
```

### 🎯 **Key Components**

1. **TV Display (`/tv/page.tsx`)**:
   - Main auto-play logic
   - State management for auto-play flags
   - Connection and playback state monitoring

2. **Audio Player (`AudioPlayer.tsx`)**:
   - Handles actual audio playback
   - Manages audio loading and ready states
   - Processes playback control commands

3. **Waiting Screen (`WaitingScreen.tsx`)**:
   - Visual feedback for auto-play status
   - User guidance about automatic playback

### ⏱️ **Timing & Delays**

- **Current Song Auto-play**: 500ms delay to ensure audio is loaded
- **Queue Auto-play**: 1000ms delay to ensure session is fully established
- **State Reset**: Immediate when song changes

## Configuration

### 🎛️ **Manual Override**

Users can still manually control playback:

- **Spacebar**: Toggle play/pause (overrides auto-play)
- **S Key**: Skip to next song
- **Host Controls**: Full manual control panel

### 🔧 **Customization**

The auto-play behavior can be modified by adjusting:

```typescript
// Delay before auto-play triggers
const AUTO_PLAY_DELAY = 500; // milliseconds

// Delay for queue-based auto-play
const QUEUE_AUTO_PLAY_DELAY = 1000; // milliseconds
```

## Troubleshooting

### 🚨 **Common Issues**

1. **Auto-play Not Working**:
   - Check browser auto-play policies
   - Ensure connection is established
   - Verify audio files are accessible

2. **Multiple Play Attempts**:
   - Auto-play flag prevents duplicate triggers
   - Check console logs for debugging

3. **Delayed Playback**:
   - Normal behavior to ensure audio is loaded
   - Delays are intentional for reliability

### 🔍 **Debugging**

Enable console logging to monitor auto-play behavior:

```javascript
// Check browser console for these messages:
"Auto-starting playback for: [Song Title]";
"Auto-starting first song in queue: [Song Title]";
```

### 📊 **Browser Compatibility**

- ✅ **Chrome**: Full support with user gesture requirement
- ✅ **Firefox**: Full support with user gesture requirement
- ✅ **Safari**: Full support with user gesture requirement
- ✅ **Edge**: Full support with user gesture requirement

**Note**: Most browsers require a user gesture before allowing auto-play. The first interaction with the page (clicking, tapping) enables auto-play for subsequent songs.

## Benefits

### 🎉 **User Experience**

- **Seamless Sessions**: No manual intervention needed to start karaoke
- **Instant Gratification**: Songs play immediately when added
- **Reduced Friction**: Eliminates the need to remember keyboard shortcuts

### 🏠 **Party/Event Usage**

- **Host-Friendly**: Hosts don't need to manage playback manually
- **Guest Experience**: Guests can add songs and see immediate results
- **Continuous Flow**: Maintains energy and momentum during events

### 🔧 **Technical Benefits**

- **Reduced Complexity**: Fewer manual steps for users
- **Better UX**: More intuitive and expected behavior
- **Reliability**: Consistent playback behavior across sessions

## Future Enhancements

### 🚀 **Planned Features**

- **Auto-play Settings**: Toggle auto-play on/off
- **Delay Configuration**: Customizable auto-play delays
- **Smart Queuing**: Intelligent song ordering and auto-advance

### 🎵 **Advanced Features**

- **Crossfade**: Smooth transitions between songs
- **Pre-loading**: Load next song while current is playing
- **Volume Ramping**: Gradual volume increase on auto-play

## Migration Notes

### 📈 **Upgrading from Manual Play**

- Existing keyboard shortcuts still work
- No breaking changes to existing functionality
- Auto-play is additive, not replacing manual controls

### 🔄 **Backward Compatibility**

- All existing features remain functional
- Manual play/pause still available
- Host controls unchanged
