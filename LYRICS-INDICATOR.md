# Lyrics Availability Indicator

This document explains the lyrics availability indicator feature that helps users identify which songs have karaoke lyrics available.

## Overview

The lyrics indicator is a visual badge that appears next to song titles throughout the application, showing whether a song has karaoke lyrics available or is audio-only.

## Visual Design

### Badge Variants

The indicator comes in two states:

#### ✅ **Karaoke Available** (Green Badge)
- **Color**: Green background with dark green text
- **Icon**: Microphone/speaker icon
- **Text**: "Karaoke"
- **Tooltip**: "Lyrics available"

#### 🎵 **Audio Only** (Gray Badge)
- **Color**: Gray background with gray text  
- **Icon**: Speaker with X icon
- **Text**: "Audio Only"
- **Tooltip**: "No lyrics available"

### Size Options

The indicator supports three sizes:
- **Small (`sm`)**: Used in mobile lists and compact displays
- **Medium (`md`)**: Used in TV queue displays
- **Large (`lg`)**: Used in prominent displays like next song splash

## Implementation

### Component Structure

```typescript
<LyricsIndicator 
  song={mediaItem} 
  size="sm" 
  variant="badge" 
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `song` | `MediaItem` | Required | The song object to check for lyrics |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | Size of the indicator |
| `variant` | `"badge" \| "icon" \| "text"` | `"badge"` | Display style |
| `className` | `string` | `""` | Additional CSS classes |

### Logic

The indicator checks for the presence of `song.lyricsPath`:
```typescript
const hasLyrics = Boolean(song.lyricsPath);
```

## Locations

The lyrics indicator appears in the following locations:

### 📱 Mobile Interface

1. **Search Results** (`SearchInterface.tsx`)
   - Next to song titles in search results
   - Size: Small badge
   - Helps users choose karaoke-ready songs

2. **Queue View** (`QueueView.tsx`)
   - Next to queued song titles
   - Size: Small badge
   - Shows lyrics availability for upcoming songs

### 📺 TV Display

1. **Next Up Sidebar** (`NextUpSidebar.tsx`)
   - Shows lyrics status for the next song
   - Size: Small badge
   - Visible during current song playback

2. **Queue Preview** (`QueuePreview.tsx`)
   - Shows lyrics status for all queued songs
   - Size: Small badge for queue items, Medium for current song
   - Visible when queue is displayed (Q key)

3. **Next Song Splash** (`NextSongSplash.tsx`)
   - Prominently displays lyrics availability for upcoming song
   - Size: Large badge
   - Helps singer prepare for karaoke vs audio-only performance

## User Experience Benefits

### 🎤 For Singers
- **Clear Expectations**: Know whether lyrics will be displayed
- **Performance Preparation**: Can prepare differently for karaoke vs audio-only songs
- **Song Selection**: Can prioritize karaoke-enabled songs when browsing

### 🎵 For Song Selection
- **Informed Choices**: Users can filter their selections based on karaoke availability
- **Queue Planning**: Mix of karaoke and audio-only songs is visible at a glance
- **Accessibility**: Visual indicator works for all users regardless of hearing ability

## Technical Details

### Data Source

The indicator relies on the `lyricsPath` field in the `MediaItem` type:

```typescript
interface MediaItem {
  // ... other fields
  lyricsPath?: string; // Optional path to lyrics file
  // ... other fields
}
```

### Styling

The component uses Tailwind CSS classes for consistent styling:

```css
/* Karaoke Available */
.karaoke-available {
  @apply bg-green-100 text-green-800 border border-green-200;
}

/* Audio Only */
.audio-only {
  @apply bg-gray-100 text-gray-600 border border-gray-200;
}
```

### Icons

Uses inline SVG icons for optimal performance:
- **Karaoke**: Microphone/speaker icon
- **Audio Only**: Speaker with X overlay icon

## Future Enhancements

### Potential Improvements

1. **Lyrics Quality Indicator**
   - Show different badges for different lyrics sources
   - Indicate synchronized vs static lyrics

2. **Language Support**
   - Show language flags for multi-language lyrics
   - Indicate original vs translated lyrics

3. **User Preferences**
   - Allow users to filter search results by lyrics availability
   - Save preference for karaoke-only or mixed results

4. **Statistics**
   - Show percentage of library with lyrics
   - Track most popular karaoke songs

### Configuration Options

Future versions could include:
- Customizable badge colors and text
- Option to hide indicator for audio-only songs
- Different indicator styles per user preference

## Accessibility

The indicator includes several accessibility features:

- **Tooltips**: Descriptive tooltips explain the indicator meaning
- **High Contrast**: Green and gray colors provide sufficient contrast
- **Icon + Text**: Both visual icon and text label for clarity
- **Screen Reader Friendly**: Proper ARIA labels and semantic HTML

## Testing

### Manual Testing Checklist

- [ ] Indicator appears in all listed locations
- [ ] Green badge shows for songs with `lyricsPath`
- [ ] Gray badge shows for songs without `lyricsPath`
- [ ] Tooltips display correct messages
- [ ] Different sizes render correctly
- [ ] Responsive design works on mobile and desktop
- [ ] High contrast mode compatibility

### Test Data

To test the feature:
1. Ensure some songs in your Jellyfin library have lyrics files
2. Ensure some songs do not have lyrics files
3. Search for both types of songs
4. Add both types to the queue
5. Verify indicators appear correctly throughout the interface

## Troubleshooting

### Common Issues

1. **Indicator Not Showing**
   - Check that `lyricsPath` field is properly populated in MediaItem
   - Verify component is imported and used correctly

2. **Wrong State Displayed**
   - Verify lyrics files exist at the specified `lyricsPath`
   - Check file permissions and accessibility

3. **Styling Issues**
   - Ensure Tailwind CSS classes are available
   - Check for CSS conflicts with existing styles

### Debug Information

Add this to component for debugging:
```typescript
console.log('Lyrics check:', {
  title: song.title,
  lyricsPath: song.lyricsPath,
  hasLyrics: Boolean(song.lyricsPath)
});
```
