# Applause Sound Files

This directory contains applause sound effects that play between karaoke songs.

## Required Files

The following files should be added to this directory:

- `applause-1.mp3` - General applause sound
- `applause-2.mp3` - Enthusiastic applause 
- `applause-3.mp3` - Crowd cheering
- `applause-crowd.mp3` - Large crowd applause

## File Requirements

- Format: MP3 or WAV
- Duration: 3-5 seconds recommended
- Volume: Normalized to prevent sudden loud sounds
- Quality: 44.1kHz, 16-bit minimum

## Sources

You can find royalty-free applause sounds from:
- Freesound.org
- Zapsplat.com
- Adobe Stock Audio
- YouTube Audio Library

## Fallback

If no sound files are present, the ApplausePlayer component will generate a synthetic applause-like sound using the Web Audio API.
