#!/usr/bin/env python3
"""
Retry Failed Lyrics Operations

This script retries failed operations from the main lyrics manager run.
It focuses on songs that had SSH timeouts or network issues.
"""

import json
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import requests
from urllib.parse import quote
import argparse

# Configuration
JELLYFIN_SERVER = "https://jellyfin.jpc.io"
API_KEY = "a8e285a3dcda4a2983c4cfa9908632c1"
SSH_HOST = "umbrel@192.168.7.211"
PATH_MAPPING = {"/downloads/": "/home/umbrel/umbrel/home/Downloads/"}
LRCLIB_API = "https://lrclib.net/api"
PROGRESS_FILE = "jellyfin-lyrics-manager.md"

# Increased timeouts for retry
SSH_TIMEOUT = 60  # Increased from 30
LRCLIB_TIMEOUT = 30  # Increased from 10
JELLYFIN_TIMEOUT = 30  # Increased from default

# Rate limiting
LRCLIB_RATE_LIMIT = 2.0  # Slower rate for retries
JELLYFIN_RATE_LIMIT = 0.5  # Slower rate for retries

class RetryLyricsManager:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'X-Emby-Token': API_KEY,
            'User-Agent': 'Jellyfin Lyrics Manager Retry/1.0'
        })
        self.failed_songs = []
        self.retry_stats = {
            'attempted': 0,
            'successful': 0,
            'still_failed': 0,
            'lyrics_found': 0
        }

    def log_message(self, message: str):
        """Log a message with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")

    def convert_jellyfin_path_to_ssh(self, jellyfin_path: str) -> str:
        """Convert Jellyfin internal path to SSH accessible path"""
        ssh_path = jellyfin_path
        for old_path, new_path in PATH_MAPPING.items():
            ssh_path = ssh_path.replace(old_path, new_path)
        return ssh_path

    def run_ssh_command(self, command: str, timeout: int = SSH_TIMEOUT) -> Tuple[bool, str]:
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
            self.log_message(f"SSH command timed out after {timeout}s: {command[:100]}...")
            return False, "Timeout"
        except Exception as e:
            self.log_message(f"SSH command failed: {e}")
            return False, str(e)

    def delete_existing_lyrics(self, audio_path: str) -> bool:
        """Delete existing lyric files for an audio file"""
        ssh_path = self.convert_jellyfin_path_to_ssh(audio_path)
        directory = os.path.dirname(ssh_path)
        filename_without_ext = os.path.splitext(os.path.basename(ssh_path))[0]
        
        # Escape special characters for shell
        escaped_filename = filename_without_ext.replace("'", "'\"'\"'")
        escaped_directory = directory.replace("'", "'\"'\"'")
        
        # Find and delete lyric files
        find_command = f'find "{escaped_directory}" -name "{escaped_filename}.*" \\( -name "*.lrc" -o -name "*.txt" \\) -delete'
        
        success, output = self.run_ssh_command(find_command)
        if success:
            self.log_message(f"Deleted existing lyrics for: {os.path.basename(audio_path)}")
        else:
            self.log_message(f"Failed to delete lyrics for {audio_path}: {output}")
        
        return success

    def search_lrclib(self, artist: str, title: str, album: str = None, duration: int = None) -> Optional[Dict]:
        """Search LRCLib for lyrics with improved error handling"""
        try:
            # Build search URL
            params = {
                'artist_name': artist,
                'track_name': title
            }
            if album:
                params['album_name'] = album
            if duration:
                params['duration'] = duration

            url = f"{LRCLIB_API}/search"
            
            self.log_message(f"Searching LRCLib: {artist} - {title}")
            
            response = self.session.get(url, params=params, timeout=LRCLIB_TIMEOUT)
            response.raise_for_status()
            
            results = response.json()
            
            if results:
                # Return the first result with synchronized lyrics if available
                for result in results:
                    if result.get('syncedLyrics'):
                        self.log_message(f"Found synced lyrics for: {artist} - {title}")
                        return result
                
                # If no synced lyrics, return first result with plain lyrics
                if results[0].get('plainLyrics'):
                    self.log_message(f"Found plain lyrics for: {artist} - {title}")
                    return results[0]
            
            self.log_message(f"No lyrics found for: {artist} - {title}")
            return None
            
        except requests.exceptions.Timeout:
            self.log_message(f"LRCLib search timed out for {artist} - {title}")
            return None
        except requests.exceptions.RequestException as e:
            self.log_message(f"LRCLib search failed for {artist} - {title}: {e}")
            return None
        except Exception as e:
            self.log_message(f"Unexpected error searching LRCLib for {artist} - {title}: {e}")
            return None

    def write_lrc_file(self, audio_path: str, lyrics_data: Dict) -> bool:
        """Write LRC file with improved error handling"""
        ssh_path = self.convert_jellyfin_path_to_ssh(audio_path)
        lrc_path = os.path.splitext(ssh_path)[0] + '.lrc'
        
        # Prepare lyrics content
        lyrics_content = lyrics_data.get('syncedLyrics') or lyrics_data.get('plainLyrics', '')
        
        if not lyrics_content:
            self.log_message(f"No lyrics content to write for: {audio_path}")
            return False
        
        # If we have plain lyrics, convert to basic LRC format
        if not lyrics_data.get('syncedLyrics') and lyrics_data.get('plainLyrics'):
            lines = lyrics_content.split('\n')
            lrc_lines = []
            for i, line in enumerate(lines):
                if line.strip():
                    # Create basic timing (every 4 seconds)
                    minutes = (i * 4) // 60
                    seconds = (i * 4) % 60
                    lrc_lines.append(f"[{minutes:02d}:{seconds:02d}.00]{line}")
            lyrics_content = '\n'.join(lrc_lines)
        
        # Escape content for shell
        escaped_content = lyrics_content.replace("'", "'\"'\"'").replace('"', '\\"')
        escaped_path = lrc_path.replace("'", "'\"'\"'")
        
        # Write file using echo
        write_command = f'echo "{escaped_content}" > "{escaped_path}"'
        
        success, output = self.run_ssh_command(write_command)
        
        if success:
            # Verify file was created and get size
            verify_command = f'ls -la "{escaped_path}"'
            verify_success, verify_output = self.run_ssh_command(verify_command, timeout=10)
            
            if verify_success:
                self.log_message(f"Created LRC file: {lrc_path} ({verify_output.split()[4]} bytes)")
                return True
            else:
                self.log_message(f"Failed to verify LRC file creation: {lrc_path}")
                return False
        else:
            self.log_message(f"Failed to write LRC for {audio_path}: {output}")
            return False

    def get_failed_songs_from_jellyfin(self) -> List[Dict]:
        """Get a fresh list of songs from Jellyfin to retry processing"""
        self.log_message("Fetching songs from Jellyfin for retry...")
        
        # First, get the music library ID
        try:
            response = self.session.get(f"{JELLYFIN_SERVER}/Library/VirtualFolders", timeout=JELLYFIN_TIMEOUT)
            response.raise_for_status()
            libraries = response.json()
            
            music_library_id = None
            for library in libraries:
                if library.get('CollectionType') == 'music':
                    music_library_id = library['ItemId']
                    break
            
            if not music_library_id:
                self.log_message("Could not find music library")
                return []
            
            self.log_message(f"Found music library ID: {music_library_id}")
            
        except Exception as e:
            self.log_message(f"Failed to get library info: {e}")
            return []
        
        # Get all songs - we'll filter for failed ones
        all_songs = []
        start_index = 0
        limit = 100
        
        while True:
            try:
                time.sleep(JELLYFIN_RATE_LIMIT)
                
                params = {
                    'IncludeItemTypes': 'Audio',
                    'Recursive': 'true',
                    'Fields': 'Path,MediaSources,Artists,Album,AlbumArtist',
                    'StartIndex': start_index,
                    'Limit': limit,
                    'SortBy': 'SortName',
                    'SortOrder': 'Ascending',
                    'ParentId': music_library_id
                }
                
                response = self.session.get(f"{JELLYFIN_SERVER}/Items", params=params, timeout=JELLYFIN_TIMEOUT)
                response.raise_for_status()
                data = response.json()
                
                items = data.get('Items', [])
                if not items:
                    break
                
                all_songs.extend(items)
                self.log_message(f"Fetched {len(all_songs)} songs so far...")
                
                start_index += limit
                
                # For retry, let's limit to a reasonable number to test
                if len(all_songs) >= 1000:  # Process first 1000 for retry
                    break
                    
            except Exception as e:
                self.log_message(f"Failed to get songs at index {start_index}: {e}")
                break
        
        self.log_message(f"Total songs fetched for retry: {len(all_songs)}")
        return all_songs

    def find_shaggy_song(self, songs: List[Dict]) -> Optional[Dict]:
        """Find 'It Wasn't Me' by Shaggy in the song list"""
        for song in songs:
            artists = song.get('Artists', [])
            title = song.get('Name', '').lower()
            
            # Check if this is the Shaggy song
            if any('shaggy' in artist.lower() for artist in artists) and 'wasn\'t me' in title:
                return song
        
        return None

    def process_song(self, song: Dict) -> bool:
        """Process a single song - delete old lyrics and search for new ones"""
        try:
            self.retry_stats['attempted'] += 1
            
            # Extract song information
            title = song.get('Name', '')
            artists = song.get('Artists', [])
            album = song.get('Album', '')
            path = song.get('Path', '')
            
            if not path or not title or not artists:
                self.log_message(f"Skipping song with missing info: {title}")
                return False
            
            artist = artists[0] if artists else 'Unknown'
            
            self.log_message(f"Processing: {artist} - {title}")
            
            # Step 1: Delete existing lyrics
            delete_success = self.delete_existing_lyrics(path)
            
            # Step 2: Search for new lyrics
            time.sleep(LRCLIB_RATE_LIMIT)
            lyrics_data = self.search_lrclib(artist, title, album)
            
            if lyrics_data:
                # Step 3: Write new LRC file
                write_success = self.write_lrc_file(path, lyrics_data)
                if write_success:
                    self.retry_stats['successful'] += 1
                    self.retry_stats['lyrics_found'] += 1
                    return True
                else:
                    self.retry_stats['still_failed'] += 1
                    return False
            else:
                # No lyrics found, but deletion might have succeeded
                if delete_success:
                    self.retry_stats['successful'] += 1
                else:
                    self.retry_stats['still_failed'] += 1
                return delete_success
                
        except Exception as e:
            self.log_message(f"Error processing song {title}: {e}")
            self.retry_stats['still_failed'] += 1
            return False

    def run_retry(self, target_song: str = None):
        """Run the retry process"""
        self.log_message("Starting retry process for failed lyrics operations...")
        
        # Get songs from Jellyfin
        songs = self.get_failed_songs_from_jellyfin()
        
        if not songs:
            self.log_message("No songs found to retry")
            return
        
        # If looking for a specific song
        if target_song:
            target_song_lower = target_song.lower()
            matching_songs = []
            
            for song in songs:
                title = song.get('Name', '').lower()
                artists = song.get('Artists', [])
                artist_match = any(target_song_lower in artist.lower() for artist in artists)
                title_match = target_song_lower in title
                
                if artist_match or title_match:
                    matching_songs.append(song)
            
            if matching_songs:
                self.log_message(f"Found {len(matching_songs)} songs matching '{target_song}'")
                songs = matching_songs
            else:
                self.log_message(f"No songs found matching '{target_song}'")
                return
        
        # Process songs
        self.log_message(f"Processing {len(songs)} songs for retry...")
        
        for i, song in enumerate(songs, 1):
            self.log_message(f"Progress: {i}/{len(songs)}")
            self.process_song(song)
            
            # Progress update every 50 songs
            if i % 50 == 0:
                self.log_message(f"Retry progress: {self.retry_stats}")
        
        # Final statistics
        self.log_message("Retry process completed!")
        self.log_message(f"Final retry statistics: {self.retry_stats}")

def main():
    parser = argparse.ArgumentParser(description='Retry failed lyrics operations')
    parser.add_argument('--song', help='Target specific song (artist or title)')
    parser.add_argument('--shaggy', action='store_true', help='Find and process Shaggy - It Wasn\'t Me')
    
    args = parser.parse_args()
    
    manager = RetryLyricsManager()
    
    if args.shaggy:
        manager.run_retry("shaggy wasn't me")
    elif args.song:
        manager.run_retry(args.song)
    else:
        # Run general retry - let's limit to first 500 songs to test
        songs = manager.get_failed_songs_from_jellyfin()
        if songs:
            # Take first 500 for focused retry
            manager.log_message("Running focused retry on first 500 songs...")
            limited_songs = songs[:500]
            
            for i, song in enumerate(limited_songs, 1):
                manager.log_message(f"Progress: {i}/{len(limited_songs)}")
                manager.process_song(song)
                
                if i % 50 == 0:
                    manager.log_message(f"Retry progress: {manager.retry_stats}")
            
            manager.log_message("Focused retry completed!")
            manager.log_message(f"Final retry statistics: {manager.retry_stats}")

if __name__ == "__main__":
    main()
