#!/usr/bin/env python3
"""
Find Shaggy Song

Quick script to find the Shaggy "It Wasn't Me" song in the Jellyfin library
"""

import requests
import time

# Configuration
JELLYFIN_SERVER = "https://jellyfin.jpc.io"
API_KEY = "a8e285a3dcda4a2983c4cfa9908632c1"
JELLYFIN_RATE_LIMIT = 0.1

def find_shaggy_song():
    session = requests.Session()
    session.headers.update({
        'X-Emby-Token': API_KEY,
        'User-Agent': 'Shaggy Song Finder/1.0'
    })
    
    print("Finding Shaggy song in Jellyfin library...")
    
    # Get music library ID
    try:
        response = session.get(f"{JELLYFIN_SERVER}/Library/VirtualFolders", timeout=30)
        response.raise_for_status()
        libraries = response.json()
        
        music_library_id = None
        for library in libraries:
            if library.get('CollectionType') == 'music':
                music_library_id = library['ItemId']
                break
        
        if not music_library_id:
            print("Could not find music library")
            return
        
        print(f"Found music library ID: {music_library_id}")
        
    except Exception as e:
        print(f"Failed to get library info: {e}")
        return
    
    # Search for Shaggy songs
    shaggy_songs = []
    start_index = 0
    limit = 200
    total_checked = 0
    
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
            
            response = session.get(f"{JELLYFIN_SERVER}/Items", params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            items = data.get('Items', [])
            if not items:
                break
            
            total_checked += len(items)
            
            # Look for Shaggy songs
            for song in items:
                artists = song.get('Artists', [])
                title = song.get('Name', '').lower()
                
                # Check for Shaggy
                if any('shaggy' in artist.lower() for artist in artists):
                    shaggy_songs.append({
                        'title': song.get('Name', ''),
                        'artists': artists,
                        'album': song.get('Album', ''),
                        'path': song.get('Path', ''),
                        'id': song.get('Id', '')
                    })
                    print(f"Found Shaggy song: {artists[0] if artists else 'Unknown'} - {song.get('Name', '')}")
            
            print(f"Checked {total_checked} songs so far, found {len(shaggy_songs)} Shaggy songs...")
            
            start_index += limit
            
            # Stop after checking a reasonable amount
            if total_checked >= 5000:
                print("Checked 5000 songs, stopping search")
                break
                
        except Exception as e:
            print(f"Failed to get songs at index {start_index}: {e}")
            break
    
    print(f"\nTotal songs checked: {total_checked}")
    print(f"Total Shaggy songs found: {len(shaggy_songs)}")
    
    if shaggy_songs:
        print("\nAll Shaggy songs found:")
        for i, song in enumerate(shaggy_songs, 1):
            print(f"{i}. {song['artists'][0] if song['artists'] else 'Unknown'} - {song['title']}")
            print(f"   Album: {song['album']}")
            print(f"   Path: {song['path']}")
            print(f"   ID: {song['id']}")
            print()
        
        # Look specifically for "It Wasn't Me"
        wasnt_me_songs = [s for s in shaggy_songs if "wasn't me" in s['title'].lower() or "wasnt me" in s['title'].lower()]
        if wasnt_me_songs:
            print("Found 'It Wasn't Me' songs:")
            for song in wasnt_me_songs:
                print(f"- {song['artists'][0] if song['artists'] else 'Unknown'} - {song['title']}")
        else:
            print("No 'It Wasn't Me' songs found among Shaggy tracks")
    else:
        print("No Shaggy songs found in the library")

if __name__ == "__main__":
    find_shaggy_song()
