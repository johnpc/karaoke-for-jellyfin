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
- **Status**: completed
- **Total Songs**: 14302
- **Processed**: 14302
- **Last Page Token**: None
- **Errors**: 377 errors logged
- **Success Count**: 13951
- **Lyrics Found**: 11916

## Implementation Notes
- Use resumable pagination to handle large libraries
- Track progress in this file for recovery
- Handle SSH operations safely
- Respect API rate limits for LRCLib
- Log all operations for debugging

## Recent Errors
- 2025-07-21 15:11:37: Failed to delete lyrics for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/John Denver/10-john_denver-trail_of_tears_(remastered)-f9d7b246.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'find "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/John Denver" -name "10-john_denver-trail_of_tears_(remastered)-f9d7b246.*" \\( -name "*.lrc" -o -name "*.txt" \\) -type f']' timed out after 30 seconds
- 2025-07-21 15:12:11: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Old Crow Medicine Show/10 - Trouble That I'm In.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Old Crow Medicine Show/10 - Trouble That I\'m In.lrc"']' timed out after 10 seconds
- 2025-07-21 15:12:46: Failed to delete lyrics for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Kid Cudi/10-kid_cudi-troubled_boy-spank.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'find "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Kid Cudi" -name "10-kid_cudi-troubled_boy-spank.*" \\( -name "*.lrc" -o -name "*.txt" \\) -delete']' timed out after 30 seconds
- 2025-07-21 15:13:45: LRCLib search failed for Bright Eyes - Waste of Paint: HTTPSConnectionPool(host='lrclib.net', port=443): Read timed out. (read timeout=10)
- 2025-07-21 15:14:48: LRCLib search failed for Modern Baseball - What If: HTTPSConnectionPool(host='lrclib.net', port=443): Read timed out. (read timeout=10)
- 2025-07-21 15:15:33: SSH delete failed for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Motion City Soundtrack/10 Where I Belong.mp3: ssh_dispatch_run_fatal: Connection to 192.168.7.211 port 22: Operation timed out

- 2025-07-21 15:16:41: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Say Anything/10-say_anything-wire_mom.flac: Command '['ssh', 'umbrel@192.168.7.211', 'echo "[00:02.79] You are a flawed machine,\\" she said. \\"\n[00:05.47] Hope that\'s worth something.\\" We always clashed, even when we wore nothing.\n[00:17.29] I said, \\"\n[00:18.14] Hell yeah, you look so good when you\'re crumbling.\\" The gloss and grandeur of molding tangerines and trashy magazines.\n[00:34.30] You\'re fake, baby, so he can just take you home.\n[00:42.51] Fake, baby.\n[00:51.59] Blood crazy.\n[00:53.31] Pinprick wire mom.\n[00:56.02] Dead daisy.\n[01:08.01] Where do you get off upstaging and replacing me?\n[01:10.73] My eyes are crossed, my will is lost and I\'m wasted.\n[01:15.35] Every queasy thought I\'ve had is inflated.\n[01:23.40] I puke onstage and slip, face plant and I\'m faced with the acid reflux remains of subjective truth.\n[01:36.02] Still, I always knew.\n[02:15.42] Beneath your bombast and the humor of syntax, in carbonite, a human being.\n[02:30.85] Once you saw through me, but now I\'m an employee.\n[02:39.82] So sick of it, tired and wizened and free.\n[02:48.86] " > "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Say Anything/10-say_anything-wire_mom.lrc"']' timed out after 30 seconds
- 2025-07-21 15:19:35: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Milky Chance/11 Addicted_demo.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Milky Chance/11 Addicted_demo.lrc"']' timed out after 10 seconds
- 2025-07-21 15:20:11: Failed to write LRC for /home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Toby Keith/11-toby_keith-all_i_want_for_christmas-333c1303.mp3: Command '['ssh', 'umbrel@192.168.7.211', 'ls -la "/home/umbrel/umbrel/home/Downloads/drive2/lidarr/music/Toby Keith/11-toby_keith-all_i_want_for_christmas-333c1303.lrc"']' timed out after 10 seconds
- 2025-07-21 15:21:47: Failed to get songs: HTTPSConnectionPool(host='jellyfin.jpc.io', port=443): Max retries exceeded with url: /Items?IncludeItemTypes=Audio&Recursive=true&Fields=Path%2CMediaSources%2CArtists%2CAlbum%2CAlbumArtist&StartIndex=14100&Limit=50&SortBy=SortName&SortOrder=Ascending&ParentId=7e64e319657a9516ec78490da03edccb (Caused by NewConnectionError('<urllib3.connection.HTTPSConnection object at 0x103e8aa60>: Failed to establish a new connection: [Errno 60] Operation timed out'))

## Next Steps
1. Create the main script
2. Test with a small batch first
3. Run full library processing
