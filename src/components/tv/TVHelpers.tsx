import { LyricsDisplay } from "@/components/tv/LyricsDisplay";
import { WaitingScreen } from "@/components/tv/WaitingScreen";
import { RatingAnimation } from "@/components/tv/RatingAnimation";
import { NextSongSplash } from "@/components/tv/NextSongSplash";
import type { AppConfig } from "@/lib/config";
import type {
  TransitionState,
  QueueItem,
  PlaybackState,
  KaraokeSession,
} from "@/types";

export interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div className="absolute top-4 right-4 z-50 space-y-2">
      <div
        data-testid="connection-status"
        className={`flex items-center px-3 py-1 rounded-full text-sm ${
          isConnected
            ? "bg-green-900 text-green-300"
            : "bg-red-900 text-red-300"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? "bg-green-400" : "bg-red-400"
          }`}
        />
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      <div className="flex items-center px-3 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
        <div className="w-2 h-2 rounded-full mr-2 bg-blue-400" />
        Audio Ready
      </div>
    </div>
  );
}

export interface AutoplayCountdownOverlayProps {
  countdown: number;
}

export function AutoplayCountdownOverlay({
  countdown,
}: AutoplayCountdownOverlayProps) {
  return (
    <div
      data-testid="autoplay-countdown"
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-purple-500/50"
    >
      <div className="text-6xl font-bold text-white mb-4 tabular-nums">
        {countdown}
      </div>
      <div className="text-xl text-purple-300">
        Starting in {countdown} second
        {countdown !== 1 ? "s" : ""}...
      </div>
      <div className="text-sm text-gray-400 mt-2">Press Space to start now</div>
    </div>
  );
}

export interface MainContentProps {
  transitionState: TransitionState;
  currentSong: QueueItem | null;
  playbackState: PlaybackState | null;
  isConnected: boolean;
  queue: QueueItem[];
  session: KaraokeSession | null;
  config: AppConfig;
  onRatingComplete: () => void;
  onNextSongComplete: () => void;
}

export function MainContent({
  transitionState,
  currentSong,
  playbackState,
  isConnected,
  queue,
  session,
  config,
  onRatingComplete,
  onNextSongComplete,
}: MainContentProps) {
  if (transitionState.displayState === "playing" && currentSong) {
    return (
      <LyricsDisplay
        song={currentSong}
        playbackState={playbackState}
        isConnected={isConnected}
      />
    );
  }

  if (
    transitionState.displayState === "applause" &&
    transitionState.completedSong &&
    transitionState.rating
  ) {
    return (
      <RatingAnimation
        song={transitionState.completedSong}
        rating={transitionState.rating}
        nextSong={transitionState.nextSong}
        onComplete={onRatingComplete}
        duration={config.ratingAnimationDuration}
      />
    );
  }

  if (transitionState.displayState === "next-up" && transitionState.nextSong) {
    return (
      <NextSongSplash
        nextSong={transitionState.nextSong}
        onComplete={onNextSongComplete}
        duration={config.nextSongDuration}
      />
    );
  }

  return (
    <WaitingScreen queue={queue} session={session} isConnected={isConnected} />
  );
}
