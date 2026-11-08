"use client";

import {
  AudioPlayer,
  type AudioPlayerProps,
} from "@/components/tv/AudioPlayer";
import { VideoPlayer } from "@/components/tv/VideoPlayer";
import { isVideoMediaItem } from "@/lib/mediaType";

/**
 * Picks the player for the current queue entry: hidden <audio> for songs
 * (unchanged behaviour) or a full-screen <video> for karaoke videos.
 */
export function MediaPlayer(props: AudioPlayerProps) {
  if (props.song && isVideoMediaItem(props.song.mediaItem)) {
    return <VideoPlayer {...props} />;
  }
  return <AudioPlayer {...props} />;
}
