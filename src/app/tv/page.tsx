"use client";

import { useTVDisplay } from "@/hooks/useTVDisplay";
import { QueuePreview } from "@/components/tv/QueuePreview";
import { HostControls } from "@/components/tv/HostControls";
import { AudioPlayer } from "@/components/tv/AudioPlayer";
import { NextUpSidebar } from "@/components/tv/NextUpSidebar";
import { QRCode } from "@/components/tv/QRCode";
import { ApplausePlayer } from "@/components/tv/ApplausePlayer";
import { FloatingReactions } from "@/components/tv/FloatingReactions";
import {
  ConnectionStatus,
  AutoplayCountdownOverlay,
  MainContent,
} from "@/components/tv/TVHelpers";
import { useConfig } from "@/contexts/ConfigContext";

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
    reactions,
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
      <ConnectionStatus isConnected={isConnected} />

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

      {error && (
        <div className="absolute top-4 left-4 right-4 z-50">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {autoplayCountdown !== null && (
        <AutoplayCountdownOverlay countdown={autoplayCountdown} />
      )}

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

      {showQueuePreview && (
        <QueuePreview
          queue={queue}
          currentSong={currentSong}
          onClose={() => setShowQueuePreview(false)}
        />
      )}

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

      <AudioPlayer
        song={currentSong}
        playbackState={playbackState}
        onPlaybackControl={playbackControl}
        onSongEnded={handleSongEnded}
        onTimeUpdate={handleTimeUpdate}
      />

      <ApplausePlayer
        isPlaying={transitionState.displayState === "applause"}
        volume={60}
      />

      <NextUpSidebar queue={queue} currentSong={currentSong} />

      <FloatingReactions reactions={reactions} />

      <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
        <div className="bg-black bg-opacity-50 rounded px-3 py-2">
          Auto-play enabled . H for controls . Q for queue . Space to play/pause
          . S to skip . Transitions: {transitionState.displayState}
        </div>
      </div>
    </div>
  );
}
