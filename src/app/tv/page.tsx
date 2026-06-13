"use client";

import { useTVDisplay } from "@/hooks/useTVDisplay";
import { LyricsDisplay } from "@/components/tv/LyricsDisplay";
import { QueuePreview } from "@/components/tv/QueuePreview";
import { HostControls } from "@/components/tv/HostControls";
import { WaitingScreen } from "@/components/tv/WaitingScreen";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { NextUpSidebar } from "@/components/tv/NextUpSidebar";
import { QRCode } from "@/components/tv/QRCode";
import { RatingAnimation } from "@/components/tv/RatingAnimation";
import { NextSongSplash } from "@/components/tv/NextSongSplash";
import { ApplausePlayer } from "@/components/tv/ApplausePlayer";
import { useConfig } from "@/contexts/ConfigContext";
import type { AppConfig } from "@/lib/config";
import type {
  TransitionState,
  QueueItem,
  PlaybackState,
  KaraokeSession,
} from "@/types";

interface ConnectionStatusProps {
  isConnected: boolean;
}

function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
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

interface AutoplayCountdownOverlayProps {
  countdown: number;
}

function AutoplayCountdownOverlay({
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

interface MainContentProps {
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

function MainContent({
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

export default function TVDisplay() {
  const config = useConfig();
  const {
    isClient,
    isConnected,
    error,
    session,
    queue,
    currentSong,
    playbackState,
    showHostControls,
    showQueuePreview,
    autoplayCountdown,
    transitionState,
    setShowHostControls,
    setShowQueuePreview,
    handleRatingComplete,
    handleNextSongComplete,
    handleEmergencyStop,
    handleSongEnded,
    handleTimeUpdate,
    skipSong,
    playbackControl,
    removeSong,
    reorderQueue,
  } = useTVDisplay();

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white text-xl">Loading TV display...</div>
      </div>
    );
  }

  return (
    <div
      data-testid="tv-interface"
      className="min-h-screen bg-black text-white relative overflow-hidden"
    >
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* QR Code */}
      <div className="absolute top-16 right-4 z-40">
        <div className="text-center">
          <QRCode
            url={
              typeof window !== "undefined"
                ? window.location.origin
                : "http://localhost:3000"
            }
            size={80}
            className="opacity-60 hover:opacity-100 transition-opacity duration-300"
          />
          <div className="text-xs text-gray-400 mt-1 opacity-60">
            Scan to join
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Autoplay Countdown */}
      {autoplayCountdown !== null && (
        <AutoplayCountdownOverlay countdown={autoplayCountdown} />
      )}

      {/* Main Content */}
      <MainContent
        transitionState={transitionState}
        currentSong={currentSong}
        playbackState={playbackState}
        isConnected={isConnected}
        queue={queue}
        session={session}
        config={config}
        onRatingComplete={handleRatingComplete}
        onNextSongComplete={handleNextSongComplete}
      />

      {/* Queue Preview Overlay */}
      {showQueuePreview && (
        <QueuePreview
          queue={queue}
          currentSong={currentSong}
          onClose={() => setShowQueuePreview(false)}
        />
      )}

      {/* Host Controls Overlay */}
      {showHostControls && (
        <HostControls
          session={session}
          currentSong={currentSong}
          playbackState={playbackState}
          onClose={() => setShowHostControls(false)}
          onSkip={skipSong}
          onPlaybackControl={playbackControl}
          onRemoveSong={removeSong}
          onReorderQueue={reorderQueue}
          onEmergencyStop={handleEmergencyStop}
        />
      )}

      {/* Audio Player */}
      <AudioPlayer
        song={currentSong}
        playbackState={playbackState}
        onPlaybackControl={playbackControl}
        onSongEnded={handleSongEnded}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Applause Player */}
      <ApplausePlayer
        isPlaying={transitionState.displayState === "applause"}
        volume={60}
      />

      {/* Next Up Sidebar - Always visible */}
      <NextUpSidebar queue={queue} currentSong={currentSong} />

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        <div className="bg-black bg-opacity-50 rounded px-3 py-2">
          Auto-play enabled . H for controls . Q for queue . Space to play/pause
          . S to skip . Transitions: {transitionState.displayState}
        </div>
      </div>
    </div>
  );
}
