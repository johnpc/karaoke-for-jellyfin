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
- **Processed**: 2252
- **Last Page Token**: 2050
- **Errors**: 29 errors logged
- **Success Count**: 2219
- **Lyrics Found**: 1835

## Implementation Notes
- Use resumable pagination to handle large libraries
- Track progress in this file for recovery
- Handle SSH operations safely
- Respect API rate limits for LRCLib
- Log all operations for debugging

## Recent Errors
- 2025-07-20 22:45:07: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Kenny Rogers/02 Missing You.lrc: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:52:33: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/30WHma5z5Sty54jbtoxYEy.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/30WHma5z5Sty54jbtoxYEy.lrc"']' timed out after 10 seconds
- 2025-07-20 22:54:13: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Matchbox Twenty/02. She's So Mean.lrc: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 22:59:54: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Miike Snow - The Heart of Me.mp3: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:09:36: SSH write failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Cage the Elephant/3 - Ain't No Rest for the Wicked.lrc: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:12:47: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/music/jellyplist/__jellyplist/5A6OHHy73AR5tLxgTc98zz.mp3: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:14:23: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Jungle - Busy Earnin'.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/spotdl/miike-snow-radio/Jungle - Busy Earnin\'.lrc"']' timed out after 10 seconds
- 2025-07-20 23:14:34: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Train/03 Cab.mp3: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:17:27: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Grouplove/03-grouplove-deadline.flac: ssh: connect to host 192.168.7.211 port 22: Operation timed out

- 2025-07-20 23:26:42: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Colbie Caillat/03 - If You Love Me Let Me Go.flac: Command '['ssh', 'umbrel@192.168.7.211', 'echo "[00:10.93] Waiting here for my phone to ring\n[00:12.79] Phone to ring\n[00:15.49] Wondering are you ever coming back to me again\n[00:22.29] Counting every drop of rain\n[00:24.06] Drop of rain, falling\n[00:26.76] Falling down into the hole you dug for me\n[00:32.13] And you bury me\n[00:36.74] \'Cause you dug so deep\n[00:40.25] But I\'m still within your reach\n[00:48.62] Oh, oh\n[00:52.27] If you really love me\n[00:53.18] You would let me go\n[00:56.70] I\'m tired of always sleeping with your ghost\n[01:02.14] Chasing away the things I need the most\n[01:07.50] If you really love me\n[01:09.37] You would let me go\n[01:14.76] If you love me let me go\n[01:21.97] Every time you come back again, back again\n[01:25.57] The healing ends\n[01:27.33] I push all of my rules aside for you\n[01:32.70] You should see the way authorized, authorized fine for me\n[01:37.33] To get me everything that you never do\n[01:42.70] Still it tears at me\n[01:46.32] \'Cause you cut so deep\n[01:50.83] But I\'m still within your reach\n[01:56.24] Oh, oh\n[01:59.84] If you really love me\n[02:00.71] You would let me go\n[02:05.26] I\'m tired of always sleeping with your ghost\n[02:09.78] Chasing away the things I need the most\n[02:16.26] If you really love me\n[02:17.19] You would let me go\n[02:22.57] If you love me let me go\n[02:24.65] All I need, all I need\n[02:27.38] Wants to be with you\n[02:28.74] But you let me bleed, let me bleed\n[02:34.32] All I need, all I need\n[02:37.93] Wants to be with you\n[02:39.78] But you let me bleed, let me bleed\n[02:45.57] Oh, oh\n[02:48.24] If you really love me\n[02:49.26] You would let me go\n[02:53.75] I\'m tired of always sleeping with your ghost\n[02:58.24] Chasing away the things I need the most\n[03:04.30] If you really love me\n[03:06.16] You would let me go\n[03:16.01] If you love me let me go\n[03:28.37] If you love me let me go\n[03:35.53] " > "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Colbie Caillat/03 - If You Love Me Let Me Go.lrc"']' timed out after 30 seconds

## Next Steps
1. Create the main script
2. Test with a small batch first
3. Run full library processing
