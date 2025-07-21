# Jellyfin Lyrics Manager

This collection of scripts manages lyrics for your Jellyfin music library by automatically finding and downloading synchronized lyrics from LRCLib.

## What it does

1. **Connects to your Jellyfin server** to get all songs in your music library
2. **Deletes existing lyric files** (.lrc and .txt) from your file system via SSH
3. **Searches LRCLib** for synchronized lyrics with timing information
4. **Downloads and saves** new .lrc files with proper timing
5. **Tracks progress** so you can resume if interrupted

## Files

- `jellyfin-lyrics-manager.py` - Main script that does all the work
- `test-jellyfin-connection.py` - Test script to verify your setup
- `run-lyrics-manager.sh` - Convenient wrapper script
- `jellyfin-lyrics-manager.md` - Progress tracking file (auto-generated)
- `requirements.txt` - Python dependencies

## Configuration

The scripts are pre-configured with your settings:
- **Jellyfin Server**: https://jellyfin.jpc.io
- **API Key**: a8e285a3dcda4a2983c4cfa9908632c1
- **SSH Target**: umbrel@192.168.7.211
- **Path Mapping**: `/downloads/` → `/home/umbrel/umbrel/home/Downloads/`

## Prerequisites

1. **Python 3** installed on your system
2. **SSH access** to umbrel@192.168.7.211 (preferably with key-based auth)
3. **Internet connection** for LRCLib API access

## Quick Start

### 1. Test Your Setup

First, verify everything is working:

```bash
# Test Jellyfin connection and find your music library
python3 test-jellyfin-connection.py
```

This will show you:
- If the Jellyfin connection works
- How many music libraries you have
- How many songs are in your library
- Sample song information

### 2. Run a Small Test

Before processing your entire library, test with a few songs:

```bash
# Process only 5 songs as a test
./run-lyrics-manager.sh --dry-run --limit 5
```

The `--dry-run` flag shows what would happen without making changes.

### 3. Process Your Library

Once you're confident it's working:

```bash
# Process all songs (resumable)
./run-lyrics-manager.sh
```

## Command Line Options

```bash
./run-lyrics-manager.sh [options]

Options:
  --dry-run          Show what would be done without making changes
  --limit N          Process only N songs (useful for testing)
  --library NAME     Process specific library by name
  --no-resume       Start from beginning instead of resuming
```

## Examples

```bash
# Test run with first 10 songs
./run-lyrics-manager.sh --dry-run --limit 10

# Process only 50 songs for testing
./run-lyrics-manager.sh --limit 50

# Process specific library
./run-lyrics-manager.sh --library "Music"

# Start over from the beginning
./run-lyrics-manager.sh --no-resume

# Full run (resumable)
./run-lyrics-manager.sh
```

## Progress Tracking

The script automatically tracks progress in `jellyfin-lyrics-manager.md`. This file shows:
- How many songs have been processed
- How many lyrics were found
- Any errors that occurred
- Where to resume from if interrupted

If the script is interrupted (Ctrl+C), you can resume by running it again - it will pick up where it left off.

## How It Works

### 1. Library Discovery
- Connects to Jellyfin and finds all music libraries
- Gets a list of all audio files with metadata

### 2. Cleanup
- For each song, deletes any existing .lrc or .txt files in the same directory
- Uses SSH to perform file operations on the remote server

### 3. Lyrics Search
- Searches LRCLib using artist name, song title, and album
- Prefers synchronized lyrics with timing information
- Falls back to plain lyrics with basic timing if needed

### 4. File Creation
- Creates new .lrc files with the same name as the audio file
- Uses SSH to write files to the remote server
- Handles special characters and escaping properly

## Rate Limiting

The script includes rate limiting to be respectful:
- **LRCLib API**: 1 second between requests
- **Jellyfin API**: 0.1 seconds between requests

## Error Handling

- All errors are logged to the progress file
- Network timeouts are handled gracefully
- SSH connection issues are reported
- The script can be safely interrupted and resumed

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection manually
ssh umbrel@192.168.7.211 "echo 'SSH works'"
```

### Jellyfin Connection Issues
```bash
# Run the connection test
python3 test-jellyfin-connection.py
```

### Permission Issues
Make sure the SSH user has write permissions to the music directories.

### Path Mapping Issues
The script maps `/downloads/` to `/home/umbrel/umbrel/home/Downloads/`. If your paths are different, you'll need to update the `PATH_MAPPING` in the script.

## Monitoring Progress

You can monitor progress in several ways:

1. **Watch the console output** - shows each song being processed
2. **Check the progress file** - `jellyfin-lyrics-manager.md` is updated regularly
3. **Look at the file system** - new .lrc files will appear in your music directories

## Safety Features

- **Dry run mode** - test without making changes
- **Progress tracking** - resume from interruptions
- **Error logging** - all issues are recorded
- **Rate limiting** - respectful API usage
- **Path validation** - prevents accidental file operations

## Expected Results

For a typical music library:
- **60-80%** of songs will have lyrics found
- **Popular songs** are more likely to have synchronized lyrics
- **Obscure or very new songs** may not have lyrics available
- **Non-English songs** may have limited availability

The script will report final statistics when complete.
