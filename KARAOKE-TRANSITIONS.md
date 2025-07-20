# Karaoke Transitions Feature

This document describes the new karaoke transitions feature that adds applause tracks, rating animations, and splash screens between songs on the TV display.

## Overview

The TV display now includes enhanced transitions between songs to create a more engaging karaoke experience:

1. **Applause & Rating Animation** - After each song ends, shows applause with a spinning rating animation
2. **Next Song Splash Screen** - Shows information about the upcoming song with a countdown
3. **Smooth Transitions** - Seamless flow between different display states

## Features

### 🎉 Applause & Rating System

- **Automatic Applause**: Plays applause sound effects after each song
- **Rating Animation**: Shows a spinning wheel that reveals a letter grade (A+ to F)
- **Random Ratings**: Weighted random system favoring higher grades
- **Performance Messages**: Encouraging messages based on the grade received
- **Visual Effects**: Confetti and animations for high grades

### 🎤 Next Song Splash Screen

- **Song Information**: Displays title, artist, album, and duration
- **Singer Information**: Shows who requested the song
- **Countdown Timer**: 3-second countdown before the song starts
- **Microphone Reminder**: Prompts the next singer to grab the mic
- **Visual Design**: Attractive gradient background with animations

### 🎵 Enhanced Audio Experience

- **Applause Sounds**: Multiple applause variations (requires sound files)
- **Fallback Audio**: Synthetic applause generation if no sound files present
- **Volume Control**: Configurable applause volume

## Display States

The TV display now has several states:

- `waiting` - No songs in queue, showing waiting screen
- `playing` - Song is currently playing with lyrics
- `applause` - Showing applause and rating animation
- `next-up` - Showing next song splash screen
- `transitioning` - Brief transition between states

## Controls

### Keyboard Shortcuts

- **Space** - Skip current transition or play/pause during song
- **S** - Skip current transition or skip current song
- **H** - Show/hide host controls
- **Q** - Show/hide queue preview
- **Escape** - Hide overlays

### Transition Timing

- **Rating Animation**: 4 seconds (1.5s spinning + 2.5s celebrating)
- **Next Song Splash**: 3 seconds countdown
- **Auto-advance**: Automatically proceeds through transitions

## Technical Implementation

### New Components

1. **RatingAnimation** (`/components/tv/RatingAnimation.tsx`)
   - Spinning wheel animation
   - Grade reveal with colors and effects
   - Celebration animations for high grades

2. **NextSongSplash** (`/components/tv/NextSongSplash.tsx`)
   - Song information display
   - Countdown timer
   - Animated background elements

3. **ApplausePlayer** (`/components/tv/ApplausePlayer.tsx`)
   - Audio playback for applause sounds
   - Fallback synthetic audio generation
   - Volume control

### New Utilities

1. **Rating Generator** (`/lib/ratingGenerator.ts`)
   - Weighted random grade generation
   - Score calculation within grade ranges
   - Contextual messages for each grade
   - Bonus system for longer songs

### Updated Types

- Added `TVDisplayState` enum for different display modes
- Added `SongRating` interface for rating data
- Added `TransitionState` interface for managing transitions

## Configuration

### Applause Sounds

Place applause sound files in `/public/sounds/`:
- `applause-1.mp3` - General applause
- `applause-2.mp3` - Enthusiastic applause
- `applause-3.mp3` - Crowd cheering
- `applause-crowd.mp3` - Large crowd applause

### Rating System

The rating system uses weighted probabilities:
- A+ (5% chance) - Perfect performance
- A (15% chance) - Excellent
- A- (20% chance) - Very good
- B+ (25% chance) - Good (most common)
- B (20% chance) - Above average
- B- (10% chance) - Average
- C+ and below (5% total) - Below average

### Timing Customization

You can adjust timing in the component props:
```tsx
<RatingAnimation duration={4000} /> // 4 seconds
<NextSongSplash duration={3000} />  // 3 seconds
```

## Usage

The transitions are automatically handled by the TV display. When a song ends:

1. The system detects song completion
2. Generates a random rating for the performance
3. Shows applause animation with rating
4. If there's a next song, shows the splash screen
5. Automatically starts the next song
6. If no next song, returns to waiting screen

## Development

### Testing Transitions

You can test transitions by:
1. Adding songs to the queue
2. Playing a song and letting it complete naturally
3. Or using keyboard shortcuts to skip through transitions

### Adding New Rating Messages

Edit `/lib/ratingGenerator.ts` to add new messages:
```typescript
const gradeMessages = {
  'A+': [
    'Absolutely phenomenal!',
    'Your new message here!',
    // ...
  ]
};
```

### Customizing Animations

The components use Tailwind CSS classes for animations. You can modify:
- Spin duration: `animate-spin`
- Fade effects: `transition-opacity duration-300`
- Scale effects: `transform scale-110`
- Color schemes: Grade-based color functions

## Future Enhancements

Potential improvements:
- User-customizable rating messages
- Different rating systems (stars, numbers, etc.)
- Sound effect variations based on grade
- Audience participation features
- Performance statistics tracking
- Custom transition themes
