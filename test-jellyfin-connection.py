#!/usr/bin/env python3
"""
Test script to verify Jellyfin connection and find music libraries
"""

import requests
import json

# Configuration
JELLYFIN_SERVER = "https://jellyfin.jpc.io"
API_KEY = "a8e285a3dcda4a2983c4cfa9908632c1"

def test_connection():
    """Test basic connection to Jellyfin server"""
    session = requests.Session()
    session.headers.update({
        'X-Emby-Token': API_KEY,
        'Content-Type': 'application/json'
    })
    
    try:
        print("Testing Jellyfin connection...")
        response = session.get(f"{JELLYFIN_SERVER}/System/Info")
        response.raise_for_status()
        
        info = response.json()
        print(f"✓ Connected to Jellyfin server: {info.get('ServerName', 'Unknown')}")
        print(f"  Version: {info.get('Version', 'Unknown')}")
        print(f"  OS: {info.get('OperatingSystem', 'Unknown')}")
        
        return session
    except Exception as e:
        print(f"✗ Failed to connect to Jellyfin: {e}")
        return None

def get_libraries(session):
    """Get all libraries from Jellyfin"""
    try:
        print("\nFetching libraries...")
        
        # Try different approaches to get libraries
        endpoints_to_try = [
            ("/Items", {'Recursive': 'false', 'IncludeItemTypes': 'CollectionFolder'}),
            ("/Library/VirtualFolders", {}),
            ("/Items", {'Recursive': 'false'}),
        ]
        
        for endpoint, params in endpoints_to_try:
            print(f"Trying endpoint: {endpoint}")
            try:
                response = session.get(f"{JELLYFIN_SERVER}{endpoint}", params=params)
                response.raise_for_status()
                
                data = response.json()
                print(f"Response keys: {list(data.keys())}")
                
                if endpoint == "/Library/VirtualFolders":
                    libraries = data if isinstance(data, list) else []
                else:
                    libraries = data.get('Items', [])
                
                print(f"Found {len(libraries)} items")
                
                if libraries:
                    print("Items found:")
                    for i, lib in enumerate(libraries[:5]):  # Show first 5
                        print(f"  {i+1}. {json.dumps(lib, indent=2)[:200]}...")
                    
                    # Look for music libraries
                    music_libraries = []
                    for lib in libraries:
                        lib_type = lib.get('CollectionType', lib.get('Type', 'unknown'))
                        name = lib.get('Name', lib.get('name', 'Unknown'))
                        lib_id = lib.get('Id', lib.get('id', 'Unknown'))
                        
                        print(f"  - {name} (Type: {lib_type}, ID: {lib_id})")
                        
                        if lib_type == 'music' or 'music' in name.lower():
                            music_libraries.append(lib)
                    
                    if music_libraries:
                        print(f"\nMusic libraries found: {len(music_libraries)}")
                        return music_libraries
                
            except Exception as e:
                print(f"  Failed: {e}")
                continue
        
        print("No libraries found with any method")
        return []
        
    except Exception as e:
        print(f"✗ Failed to get libraries: {e}")
        return []

def get_all_items(session):
    """Get all items to see what's available"""
    try:
        print("\nFetching all items...")
        response = session.get(f"{JELLYFIN_SERVER}/Items", params={
            'Recursive': 'true',
            'StartIndex': 0,
            'Limit': 20
        })
        response.raise_for_status()
        
        data = response.json()
        total_items = data.get('TotalRecordCount', 0)
        items = data.get('Items', [])
        
        print(f"Total items in server: {total_items}")
        print("Sample items:")
        
        for item in items[:10]:
            item_type = item.get('Type', 'Unknown')
            name = item.get('Name', 'Unknown')
            collection_type = item.get('CollectionType', 'None')
            print(f"  - {name} (Type: {item_type}, CollectionType: {collection_type})")
        
        return items
    except Exception as e:
        print(f"✗ Failed to get all items: {e}")
        return []

def test_music_search(session):
    """Try to find music items directly"""
    try:
        print("\nSearching for music items...")
        response = session.get(f"{JELLYFIN_SERVER}/Items", params={
            'IncludeItemTypes': 'Audio',
            'Recursive': 'true',
            'StartIndex': 0,
            'Limit': 10
        })
        response.raise_for_status()
        
        data = response.json()
        total_songs = data.get('TotalRecordCount', 0)
        songs = data.get('Items', [])
        
        print(f"Found {total_songs} audio items")
        
        if songs:
            print("Sample songs:")
            for song in songs[:5]:
                artist = song.get('Artists', ['Unknown'])[0] if song.get('Artists') else 'Unknown'
                title = song.get('Name', 'Unknown')
                path = song.get('Path', 'No path')
                parent_id = song.get('ParentId', 'No parent')
                print(f"  - {artist} - {title}")
                print(f"    Path: {path}")
                print(f"    Parent ID: {parent_id}")
        
        return total_songs
    except Exception as e:
        print(f"✗ Failed to search for music: {e}")
        return 0

def main():
    print("Jellyfin Connection Test")
    print("========================")
    
    # Test connection
    session = test_connection()
    if not session:
        return
    
    # Get libraries
    music_libraries = get_libraries(session)
    
    # Get all items to see what's available
    all_items = get_all_items(session)
    
    # Try to find music directly
    total_songs = test_music_search(session)
    
    print(f"\n{'='*50}")
    print("SUMMARY:")
    print(f"Music libraries found: {len(music_libraries)}")
    print(f"Total songs found: {total_songs}")
    
    if total_songs > 0:
        print("✓ Music found! The script should work.")
        if not music_libraries:
            print("Note: No music libraries found, but songs exist.")
            print("The script may need to search all items instead of using a specific library.")
    else:
        print("✗ No music found. Check your Jellyfin setup.")

if __name__ == "__main__":
    main()
