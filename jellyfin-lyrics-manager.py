#!/usr/bin/env python3
"""
Jellyfin Lyrics Manager

This script manages lyrics for all songs in a Jellyfin music library by:
1. Finding the Music library ID
2. Deleting existing lyric files (.lrc, .txt)
3. Searching for new lyrics with timing using LRCLib API
4. Writing updated .lrc files

Configuration is loaded from jellyfin-lyrics-manager.md for progress tracking.
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

# Rate limiting
LRCLIB_RATE_LIMIT = 1.0  # seconds between requests
JELLYFIN_RATE_LIMIT = 0.1  # seconds between requests

class ProgressTracker:
    def __init__(self, progress_file: str):
        self.progress_file = progress_file
        self.data = self.load_progress()
    
    def load_progress(self) -> Dict:
        """Load progress from markdown file"""
        if not os.path.exists(self.progress_file):
            return {
                "status": "not_started",
                "total_songs": 0,
                "processed": 0,
                "last_page_token": None,
                "errors": [],
                "success_count": 0,
                "lyrics_found": 0,
                "current_library_id": None
            }
        
        # Parse the markdown file to extract progress data
        with open(self.progress_file, 'r') as f:
            content = f.read()
        
        # Extract values using regex
        data = {}
        patterns = {
            "status": r"\*\*Status\*\*: (.+)",
            "total_songs": r"\*\*Total Songs\*\*: (\d+|TBD)",
            "processed": r"\*\*Processed\*\*: (\d+)",
            "last_page_token": r"\*\*Last Page Token\*\*: (.+)",
            "success_count": r"\*\*Success Count\*\*: (\d+)",
            "lyrics_found": r"\*\*Lyrics Found\*\*: (\d+)"
        }
        
        for key, pattern in patterns.items():
            match = re.search(pattern, content)
            if match:
                value = match.group(1)
                if key in ["total_songs", "processed", "success_count", "lyrics_found"]:
                    data[key] = int(value) if value != "TBD" else 0
                elif key == "last_page_token":
                    data[key] = None if value == "None" else value
                else:
                    data[key] = value
            else:
                data[key] = 0 if key in ["total_songs", "processed", "success_count", "lyrics_found"] else None
        
        data["errors"] = []  # Will be populated from logs
        return data
    
    def save_progress(self):
        """Save progress back to markdown file"""
        content = f"""# Jellyfin Lyrics Manager

## Objective
Create a script to manage lyrics for all songs in the Jellyfin music library by:
1. Finding the Music library ID in Jellyfin
2. Deleting existing .lrc and .txt lyric files from the file system
3. Searching for new lyrics with timing information using LRCLib API
4. Writing updated .lrc files with proper timing

## Configuration
- **Jellyfin Server**: {JELLYFIN_SERVER}
- **API Key**: {API_KEY}
- **SSH Target**: {SSH_HOST}
- **Path Mapping**: Replace `/downloads/` with `/home/umbrel/umbrel/home/Downloads/`

## Progress Tracking
- **Status**: {self.data.get('status', 'not_started')}
- **Total Songs**: {self.data.get('total_songs', 'TBD')}
- **Processed**: {self.data.get('processed', 0)}
- **Last Page Token**: {self.data.get('last_page_token', 'None')}
- **Errors**: {len(self.data.get('errors', []))} errors logged
- **Success Count**: {self.data.get('success_count', 0)}
- **Lyrics Found**: {self.data.get('lyrics_found', 0)}

## Implementation Notes
- Use resumable pagination to handle large libraries
- Track progress in this file for recovery
- Handle SSH operations safely
- Respect API rate limits for LRCLib
- Log all operations for debugging

## Recent Errors
{chr(10).join(f"- {error}" for error in self.data.get('errors', [])[-10:])}

## Next Steps
1. Create the main script
2. Test with a small batch first
3. Run full library processing
"""
        
        with open(self.progress_file, 'w') as f:
            f.write(content)
    
    def update(self, **kwargs):
        """Update progress data"""
        self.data.update(kwargs)
        self.save_progress()
    
    def add_error(self, error: str):
        """Add an error to the tracking"""
        if 'errors' not in self.data:
            self.data['errors'] = []
        self.data['errors'].append(f"{time.strftime('%Y-%m-%d %H:%M:%S')}: {error}")
        self.save_progress()

class JellyfinLyricsManager:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'X-Emby-Token': API_KEY,
            'Content-Type': 'application/json'
        })
        self.progress = ProgressTracker(PROGRESS_FILE)
        
    def get_music_libraries(self) -> List[Dict]:
        """Get all music libraries from Jellyfin"""
        try:
            # Try to get collection folders first
            response = self.session.get(f"{JELLYFIN_SERVER}/Items", params={
                'Recursive': 'false',
                'IncludeItemTypes': 'CollectionFolder'
            })
            response.raise_for_status()
            
            libraries = []
            for item in response.json().get('Items', []):
                if item.get('CollectionType') == 'music':
                    libraries.append({
                        'id': item['Id'],
                        'name': item['Name'],
                        'path': item.get('Path', '')
                    })
            
            # If no collection folders found, try regular folders that might contain music
            if not libraries:
                response = self.session.get(f"{JELLYFIN_SERVER}/Items", params={
                    'Recursive': 'false'
                })
                response.raise_for_status()
                
                for item in response.json().get('Items', []):
                    name = item.get('Name', '').lower()
                    item_type = item.get('Type', '')
                    
                    # Look for folders that might contain music
                    if (item_type == 'Folder' and 
                        ('music' in name or 'lidarr' in name or 'audio' in name)):
                        libraries.append({
                            'id': item['Id'],
                            'name': item['Name'],
                            'path': item.get('Path', '')
                        })
            
            return libraries
        except Exception as e:
            self.progress.add_error(f"Failed to get music libraries: {e}")
            return []
    
    def get_all_songs(self, library_id: str = None, start_index: int = 0, limit: int = 100) -> Tuple[List[Dict], bool]:
        """Get all songs from a music library with pagination"""
        try:
            params = {
                'IncludeItemTypes': 'Audio',
                'Recursive': 'true',
                'Fields': 'Path,MediaSources,Artists,Album,AlbumArtist',
                'StartIndex': start_index,
                'Limit': limit,
                'SortBy': 'SortName',
                'SortOrder': 'Ascending'
            }
            
            # If we have a specific library, use it
            if library_id:
                params['ParentId'] = library_id
            
            response = self.session.get(f"{JELLYFIN_SERVER}/Items", params=params)
            response.raise_for_status()
            
            data = response.json()
            items = data.get('Items', [])
            total_count = data.get('TotalRecordCount', 0)
            has_more = (start_index + len(items)) < total_count
            
            return items, has_more
        except Exception as e:
            self.progress.add_error(f"Failed to get songs: {e}")
            return [], False
    
    def map_jellyfin_path(self, jellyfin_path: str) -> str:
        """Map Jellyfin path to actual filesystem path"""
        mapped_path = jellyfin_path
        for old_path, new_path in PATH_MAPPING.items():
            mapped_path = mapped_path.replace(old_path, new_path)
        return mapped_path
    
    def delete_existing_lyrics(self, song_path: str) -> bool:
        """Delete existing .lrc and .txt files via SSH"""
        try:
            # Get directory of the song file
            song_dir = os.path.dirname(song_path)
            song_name = os.path.splitext(os.path.basename(song_path))[0]
            
            # First, find existing lyric files to log what we're deleting
            find_cmd = [
                'ssh', SSH_HOST,
                f'find "{song_dir}" -name "{song_name}.*" \\( -name "*.lrc" -o -name "*.txt" \\) -type f'
            ]
            
            find_result = subprocess.run(find_cmd, capture_output=True, text=True, timeout=30)
            if find_result.returncode == 0 and find_result.stdout.strip():
                existing_files = find_result.stdout.strip().split('\n')
                print(f"    Found existing lyric files to delete:")
                for file_path in existing_files:
                    if file_path.strip():
                        print(f"      - {file_path.strip()}")
            else:
                print(f"    No existing lyric files found")
            
            # Now delete the files
            delete_cmd = [
                'ssh', SSH_HOST,
                f'find "{song_dir}" -name "{song_name}.*" \\( -name "*.lrc" -o -name "*.txt" \\) -delete'
            ]
            
            result = subprocess.run(delete_cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print(f"    ✗ SSH delete failed: {result.stderr}")
                self.progress.add_error(f"SSH delete failed for {song_path}: {result.stderr}")
                return False
            
            if find_result.returncode == 0 and find_result.stdout.strip():
                print(f"    ✓ Deleted existing lyric files")
            
            return True
        except Exception as e:
            print(f"    ✗ Exception during delete: {e}")
            self.progress.add_error(f"Failed to delete lyrics for {song_path}: {e}")
            return False
    
    def search_lrclib(self, artist: str, title: str, album: str = None, duration: int = None) -> Optional[str]:
        """Search LRCLib for lyrics with timing"""
        try:
            # Clean up search terms
            artist = re.sub(r'[^\w\s-]', '', artist).strip()
            title = re.sub(r'[^\w\s-]', '', title).strip()
            
            params = {
                'artist_name': artist,
                'track_name': title
            }
            
            if album:
                album = re.sub(r'[^\w\s-]', '', album).strip()
                params['album_name'] = album
            
            if duration:
                params['duration'] = duration
            
            # Build and log the search URL
            search_url = f"{LRCLIB_API}/search"
            param_string = "&".join([f"{k}={quote(str(v))}" for k, v in params.items()])
            full_url = f"{search_url}?{param_string}"
            print(f"    LRCLib search URL: {full_url}")
            
            response = requests.get(search_url, params=params, timeout=10)
            
            if response.status_code == 200:
                results = response.json()
                print(f"    LRCLib returned {len(results)} results")
                
                if results:
                    # Get the first result with synced lyrics
                    for i, result in enumerate(results):
                        if result.get('syncedLyrics'):
                            print(f"    ✓ Using result #{i+1} with synced lyrics")
                            return result['syncedLyrics']
                    
                    # If no synced lyrics, try plain lyrics
                    for i, result in enumerate(results):
                        if result.get('plainLyrics'):
                            print(f"    ✓ Using result #{i+1} with plain lyrics (converting to LRC)")
                            # Convert plain lyrics to basic LRC format
                            plain_lyrics = result['plainLyrics']
                            lrc_content = ""
                            for j, line in enumerate(plain_lyrics.split('\n')):
                                if line.strip():
                                    # Add basic timing (every 4 seconds)
                                    minutes = (j * 4) // 60
                                    seconds = (j * 4) % 60
                                    lrc_content += f"[{minutes:02d}:{seconds:02d}.00]{line}\n"
                            return lrc_content
                
                print(f"    - No usable lyrics found in results")
            else:
                print(f"    - LRCLib API returned status {response.status_code}")
            
            return None
        except Exception as e:
            print(f"    ✗ LRCLib search exception: {e}")
            self.progress.add_error(f"LRCLib search failed for {artist} - {title}: {e}")
            return None
    
    def write_lrc_file(self, song_path: str, lrc_content: str) -> bool:
        """Write LRC content to file via SSH"""
        try:
            song_dir = os.path.dirname(song_path)
            song_name = os.path.splitext(os.path.basename(song_path))[0]
            lrc_path = os.path.join(song_dir, f"{song_name}.lrc")
            
            print(f"    Writing LRC file to: {lrc_path}")
            
            # Escape content for SSH
            escaped_content = lrc_content.replace('"', '\\"').replace('$', '\\$').replace('`', '\\`')
            
            ssh_cmd = [
                'ssh', SSH_HOST,
                f'echo "{escaped_content}" > "{lrc_path}"'
            ]
            
            result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print(f"    ✗ SSH write failed: {result.stderr}")
                self.progress.add_error(f"SSH write failed for {lrc_path}: {result.stderr}")
                return False
            
            # Verify the file was created
            verify_cmd = [
                'ssh', SSH_HOST,
                f'ls -la "{lrc_path}"'
            ]
            
            verify_result = subprocess.run(verify_cmd, capture_output=True, text=True, timeout=10)
            if verify_result.returncode == 0:
                file_info = verify_result.stdout.strip()
                print(f"    ✓ LRC file created: {file_info}")
            else:
                print(f"    ✓ LRC file written (verification failed, but write succeeded)")
            
            return True
        except Exception as e:
            print(f"    ✗ Exception during write: {e}")
            self.progress.add_error(f"Failed to write LRC for {song_path}: {e}")
            return False
    
    def process_song(self, song: Dict) -> bool:
        """Process a single song"""
        try:
            # Extract song information
            title = song.get('Name', '')
            artists = song.get('Artists', [])
            artist = artists[0] if artists else song.get('AlbumArtist', '')
            album = song.get('Album', '')
            path = song.get('Path', '')
            
            if not all([title, artist, path]):
                print(f"  ✗ Missing required info for song: {song.get('Id', 'unknown')}")
                self.progress.add_error(f"Missing required info for song: {song.get('Id', 'unknown')}")
                return False
            
            # Map path
            mapped_path = self.map_jellyfin_path(path)
            
            print(f"Processing: {artist} - {title}")
            print(f"  Original path: {path}")
            print(f"  Mapped path: {mapped_path}")
            
            # Delete existing lyrics
            print(f"  Deleting existing lyrics...")
            if not self.delete_existing_lyrics(mapped_path):
                print(f"  ✗ Failed to delete existing lyrics")
                return False
            
            # Search for new lyrics
            print(f"  Searching for lyrics...")
            time.sleep(LRCLIB_RATE_LIMIT)  # Rate limiting
            lrc_content = self.search_lrclib(artist, title, album)
            
            if lrc_content:
                # Write new LRC file
                print(f"  Writing lyrics...")
                if self.write_lrc_file(mapped_path, lrc_content):
                    print(f"  ✓ Lyrics found and written")
                    self.progress.data['lyrics_found'] = self.progress.data.get('lyrics_found', 0) + 1
                    return True
                else:
                    print(f"  ✗ Failed to write lyrics")
                    return False
            else:
                print(f"  - No lyrics found")
                return True  # Not an error, just no lyrics available
                
        except Exception as e:
            print(f"  ✗ Exception: {e}")
            self.progress.add_error(f"Failed to process song {song.get('Id', 'unknown')}: {e}")
            return False
    
    def run(self, library_name: str = None, resume: bool = True, dry_run: bool = False, limit: int = None):
        """Main execution function"""
        print("Jellyfin Lyrics Manager Starting...")
        
        # Use the correct music library ID from the Jellyfin URL
        MUSIC_LIBRARY_ID = "7e64e319657a9516ec78490da03edccb"
        
        # Get music libraries for informational purposes
        libraries = self.get_music_libraries()
        
        print(f"Found {len(libraries)} music libraries:")
        for lib in libraries:
            print(f"  - {lib['name']} (ID: {lib['id']})")
        
        # Use the specified library ID
        selected_lib = {'id': MUSIC_LIBRARY_ID, 'name': 'music'}
        
        # Check if the specified library exists in our list
        matching_lib = next((lib for lib in libraries if lib['id'] == MUSIC_LIBRARY_ID), None)
        if matching_lib:
            selected_lib['name'] = matching_lib['name']
            print(f"Using specified library: {selected_lib['name']} (ID: {MUSIC_LIBRARY_ID})")
        else:
            print(f"Using specified library ID: {MUSIC_LIBRARY_ID} (not found in library list, but proceeding)")
        
        # Initialize or resume progress
        start_index = 0
        if resume and self.progress.data.get('last_page_token'):
            try:
                start_index = int(self.progress.data['last_page_token'])
                print(f"Resuming from index {start_index}")
            except:
                start_index = 0
        
        self.progress.update(
            status="running",
            current_library_id=selected_lib['id']
        )
        
        # Process songs in batches
        batch_size = 50
        processed_count = self.progress.data.get('processed', 0) if resume else 0
        success_count = self.progress.data.get('success_count', 0) if resume else 0
        
        # Reset counts if not resuming
        if not resume:
            processed_count = 0
            success_count = 0
            self.progress.data['lyrics_found'] = 0
        
        try:
            while True:
                print(f"\nFetching songs starting from index {start_index}...")
                songs, has_more = self.get_all_songs(selected_lib['id'], start_index, batch_size)
                
                if not songs:
                    break
                
                print(f"Processing batch of {len(songs)} songs...")
                
                for i, song in enumerate(songs):
                    if limit and processed_count >= limit:
                        print(f"Reached limit of {limit} songs")
                        break
                    
                    if dry_run:
                        artist = song.get('Artists', ['Unknown'])[0] if song.get('Artists') else 'Unknown'
                        title = song.get('Name', 'Unknown')
                        path = song.get('Path', 'No path')
                        print(f"[DRY RUN] Would process: {artist} - {title}")
                        print(f"  Path: {path}")
                    else:
                        if self.process_song(song):
                            success_count += 1
                    
                    processed_count += 1
                    
                    # Update progress every 10 songs
                    if processed_count % 10 == 0:
                        self.progress.update(
                            processed=processed_count,
                            success_count=success_count,
                            last_page_token=str(start_index + i + 1)
                        )
                    
                    time.sleep(JELLYFIN_RATE_LIMIT)  # Rate limiting
                
                if limit and processed_count >= limit:
                    break
                
                if not has_more:
                    break
                
                start_index += len(songs)
                self.progress.update(
                    processed=processed_count,
                    success_count=success_count,
                    last_page_token=str(start_index)
                )
        
        except KeyboardInterrupt:
            print("\nInterrupted by user. Progress saved.")
            self.progress.update(
                status="interrupted",
                processed=processed_count,
                success_count=success_count,
                last_page_token=str(start_index)
            )
            return
        
        # Final update
        self.progress.update(
            status="completed",
            processed=processed_count,
            success_count=success_count,
            total_songs=processed_count,
            last_page_token=None
        )
        
        print(f"\nCompleted! Processed {processed_count} songs, {success_count} successful, {self.progress.data.get('lyrics_found', 0)} lyrics found.")

def main():
    parser = argparse.ArgumentParser(description='Jellyfin Lyrics Manager')
    parser.add_argument('--library', help='Specific library name to process')
    parser.add_argument('--no-resume', action='store_true', help='Start from beginning instead of resuming')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--limit', type=int, help='Limit number of songs to process (for testing)')
    
    args = parser.parse_args()
    
    manager = JellyfinLyricsManager()
    manager.run(
        library_name=args.library,
        resume=not args.no_resume,
        dry_run=args.dry_run,
        limit=args.limit
    )

if __name__ == "__main__":
    main()
