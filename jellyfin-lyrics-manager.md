# Jellyfin Lyrics Manager

## Objective
Create a script to manage lyrics for all songs in the Jellyfin music library by:
1. Finding the Music library ID in Jellyfin
2. Deleting existing .lrc and .txt lyric files from the file system
3. Searching for new lyrics with timing information using LRCLib API
4. Writing updated .lrc files with proper timing

## Configuration
- **Jellyfin Server**: https://jellyfin.jpc.io
- **API Key**: a8e285a3dcda4a2983c4cfa9908632c1
- **SSH Target**: umbrel@192.168.7.211
- **Path Mapping**: Replace `/downloads/` with `/home/umbrel/umbrel/home/Downloads/`

## Progress Tracking
- **Status**: running
- **Total Songs**: 202
- **Processed**: 2040
- **Last Page Token**: 1838
- **Errors**: 27 errors logged
- **Success Count**: 2009
- **Lyrics Found**: 1653

## Implementation Notes
- Use resumable pagination to handle large libraries
- Track progress in this file for recovery
- Handle SSH operations safely
- Respect API rate limits for LRCLib
- Log all operations for debugging

## Recent Errors
- 2025-07-20 22:30:37: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/top-songs-2022/Aer - Floats My Boat.lrc: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:40:53: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/top-songs-2020/Bryce Vine - La La Land (feat. YG).mp3: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:45:07: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Kenny Rogers/02 Missing You.lrc: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:52:33: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/30WHma5z5Sty54jbtoxYEy.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/30WHma5z5Sty54jbtoxYEy.lrc"']' timed out after 10 seconds
- 2025-07-20 22:54:13: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Matchbox Twenty/02. She's So Mean.lrc: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:59:54: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Miike Snow - The Heart of Me.mp3: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:09:36: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Cage the Elephant/3 - Ain't No Rest for the Wicked.lrc: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:12:47: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/5A6OHHy73AR5tLxgTc98zz.mp3: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:14:23: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Jungle - Busy Earnin'.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Jungle - Busy Earnin\'.lrc"']' timed out after 10 seconds
- 2025-07-20 23:14:34: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Train/03 Cab.mp3: ssh: connect to host 192.168.7.211 port 22: Operation timed out


## Next Steps
1. Create the main script
2. Test with a small batch first
3. Run full library processing
