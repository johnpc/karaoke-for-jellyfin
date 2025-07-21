#!/usr/bin/env python3
"""
Process Shaggy Song

Specifically process the "It Wasn't Me" song by Shaggy
"""

import json
import os
import subprocess
import time
import requests

# Configuration
JELLYFIN_SERVER = "https://jellyfin.jpc.io"
API_KEY = "a8e285a3dcda4a2983c4cfa9908632c1"
SSH_HOST = "umbrel@192.168.7.211"
PATH_MAPPING = {"/downloads/": "/home/umbrel/umbrel/home/Downloads/"}
LRCLIB_API = "https://lrclib.net/api"

# Song details from our search
SHAGGY_SONG = {
    'title': "It Wasn't Me",
    'artists': ['Shaggy/Rik Rok'],
    'album': 'Hot Shot',
    'path': '/downloads/drive2/music/jellyplist/__jellyplist/3WkibOpDF7cQ5xntM1epyf.mp3',
    'id': '6bc80bb93e636ddb8c76d9c43311bc6c'
}

def log_message(message: str):
    """Log a message with timestamp"""
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def convert_jellyfin_path_to_ssh(jellyfin_path: str) -> str:
    """Convert Jellyfin internal path to SSH accessible path"""
    ssh_path = jellyfin_path
    for old_path, new_path in PATH_MAPPING.items():
        ssh_path = ssh_path.replace(old_path, new_path)
    return ssh_path

def run_ssh_command(command: str, timeout: int = 60) -> tuple:
    """Run SSH command with improved error handling"""
    try:
        full_command = ['ssh', SSH_HOST, command]
        result = subprocess.run(
            full_command,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.returncode == 0, result.stdout.strip()
    except subprocess.TimeoutExpired:
        log_message(f"SSH command timed out after {timeout}s")
        return False, "Timeout"
    except Exception as e:
        log_message(f"SSH command failed: {e}")
        return False, str(e)

def delete_existing_lyrics(audio_path: str) -> bool:
    """Delete existing lyric files for an audio file"""
    ssh_path = convert_jellyfin_path_to_ssh(audio_path)
    directory = os.path.dirname(ssh_path)
    filename_without_ext = os.path.splitext(os.path.basename(ssh_path))[0]
    
    log_message(f"SSH path: {ssh_path}")
    log_message(f"Directory: {directory}")
    log_message(f"Filename: {filename_without_ext}")
    
    # Escape special characters for shell
    escaped_filename = filename_without_ext.replace("'", "'\"'\"'")
    escaped_directory = directory.replace("'", "'\"'\"'")
    
    # Find existing lyric files first
    find_command = f'find "{escaped_directory}" -name "{escaped_filename}.*" \\( -name "*.lrc" -o -name "*.txt" \\) -type f'
    
    success, output = run_ssh_command(find_command)
    if success and output:
        log_message(f"Found existing lyric files: {output}")
        
        # Delete them
        delete_command = f'find "{escaped_directory}" -name "{escaped_filename}.*" \\( -name "*.lrc" -o -name "*.txt" \\) -delete'
        success, output = run_ssh_command(delete_command)
        if success:
            log_message(f"Deleted existing lyrics for: {os.path.basename(audio_path)}")
        else:
            log_message(f"Failed to delete lyrics: {output}")
    else:
        log_message(f"No existing lyric files found (or search failed): {output}")
    
    return success

def search_lrclib(artist: str, title: str, album: str = None) -> dict:
    """Search LRCLib for lyrics"""
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Shaggy Lyrics Processor/1.0'
        })
        
        # Build search URL
        params = {
            'artist_name': artist,
            'track_name': title
        }
        if album:
            params['album_name'] = album

        url = f"{LRCLIB_API}/search"
        
        log_message(f"Searching LRCLib: {artist} - {title}")
        log_message(f"Search URL: {url}?{requests.compat.urlencode(params)}")
        
        response = session.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        results = response.json()
        log_message(f"LRCLib returned {len(results)} results")
        
        if results:
            # Show all results
            for i, result in enumerate(results):
                log_message(f"Result {i+1}: {result.get('artistName', 'Unknown')} - {result.get('trackName', 'Unknown')}")
                log_message(f"  Album: {result.get('albumName', 'Unknown')}")
                log_message(f"  Duration: {result.get('duration', 'Unknown')}s")
                log_message(f"  Has synced lyrics: {bool(result.get('syncedLyrics'))}")
                log_message(f"  Has plain lyrics: {bool(result.get('plainLyrics'))}")
            
            # Return the first result with synchronized lyrics if available
            for result in results:
                if result.get('syncedLyrics'):
                    log_message(f"Using synced lyrics from result")
                    return result
            
            # If no synced lyrics, return first result with plain lyrics
            if results[0].get('plainLyrics'):
                log_message(f"Using plain lyrics from first result")
                return results[0]
        
        log_message(f"No usable lyrics found")
        return None
        
    except Exception as e:
        log_message(f"LRCLib search failed: {e}")
        return None

def write_lrc_file(audio_path: str, lyrics_data: dict) -> bool:
    """Write LRC file"""
    ssh_path = convert_jellyfin_path_to_ssh(audio_path)
    lrc_path = os.path.splitext(ssh_path)[0] + '.lrc'
    
    log_message(f"Writing LRC to: {lrc_path}")
    
    # Prepare lyrics content
    lyrics_content = lyrics_data.get('syncedLyrics') or lyrics_data.get('plainLyrics', '')
    
    if not lyrics_content:
        log_message(f"No lyrics content to write")
        return False
    
    log_message(f"Lyrics content length: {len(lyrics_content)} characters")
    log_message(f"First 200 chars: {lyrics_content[:200]}...")
    
    # If we have plain lyrics, convert to basic LRC format
    if not lyrics_data.get('syncedLyrics') and lyrics_data.get('plainLyrics'):
        log_message("Converting plain lyrics to LRC format")
        lines = lyrics_content.split('\n')
        lrc_lines = []
        for i, line in enumerate(lines):
            if line.strip():
                # Create basic timing (every 4 seconds)
                minutes = (i * 4) // 60
                seconds = (i * 4) % 60
                lrc_lines.append(f"[{minutes:02d}:{seconds:02d}.00]{line}")
        lyrics_content = '\n'.join(lrc_lines)
        log_message(f"Converted to LRC format, new length: {len(lyrics_content)} characters")
    
    # Write to a temporary file first, then copy via SSH
    temp_file = "/tmp/shaggy_lyrics.lrc"
    try:
        with open(temp_file, 'w', encoding='utf-8') as f:
            f.write(lyrics_content)
        
        log_message(f"Wrote lyrics to temporary file: {temp_file}")
        
        # Copy file via SCP
        escaped_lrc_path = lrc_path.replace("'", "'\"'\"'")
        scp_command = f'scp "{temp_file}" "{SSH_HOST}:{escaped_lrc_path}"'
        
        result = subprocess.run(scp_command, shell=True, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            log_message(f"Successfully copied LRC file via SCP")
            
            # Verify file was created and get size
            verify_command = f'ls -la "{escaped_lrc_path}"'
            verify_success, verify_output = run_ssh_command(verify_command, timeout=10)
            
            if verify_success:
                log_message(f"Verified LRC file: {verify_output}")
                return True
            else:
                log_message(f"Failed to verify LRC file: {verify_output}")
                return False
        else:
            log_message(f"SCP failed: {result.stderr}")
            return False
            
    except Exception as e:
        log_message(f"Failed to write LRC file: {e}")
        return False
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.remove(temp_file)

def process_shaggy_song():
    """Process the Shaggy song"""
    log_message("Processing Shaggy - It Wasn't Me")
    
    song = SHAGGY_SONG
    
    log_message(f"Song details:")
    log_message(f"  Title: {song['title']}")
    log_message(f"  Artists: {song['artists']}")
    log_message(f"  Album: {song['album']}")
    log_message(f"  Path: {song['path']}")
    
    # Step 1: Delete existing lyrics
    log_message("Step 1: Deleting existing lyrics...")
    delete_success = delete_existing_lyrics(song['path'])
    
    # Step 2: Search for new lyrics
    log_message("Step 2: Searching for lyrics...")
    artist = song['artists'][0].split('/')[0]  # Use just "Shaggy" part
    lyrics_data = search_lrclib(artist, song['title'], song['album'])
    
    if lyrics_data:
        log_message("Step 3: Writing new LRC file...")
        write_success = write_lrc_file(song['path'], lyrics_data)
        
        if write_success:
            log_message("✅ Successfully processed Shaggy song!")
            return True
        else:
            log_message("❌ Failed to write LRC file")
            return False
    else:
        log_message("❌ No lyrics found for Shaggy song")
        return False

if __name__ == "__main__":
    process_shaggy_song()
