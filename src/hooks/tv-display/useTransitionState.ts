import { useState, useEffect, useRef, useCallback } from "react";
import { TransitionState, QueueItem, SongRating } from "@/types";

interface UseTransitionStateParams {
  currentSong: QueueItem | null;
  queue: QueueItem[];
  startNextSong: () => void;
  autoplayDelay: number;
  setSongCompletedHandler: (
    handler: (data: { song: QueueItem; rating: unknown }) => void
  ) => void;
}

interface UseTransitionStateReturn {
  transitionState: TransitionState;
  setTransitionState: React.Dispatch<React.SetStateAction<TransitionState>>;
  handleRatingComplete: () => void;
  handleNextSongComplete: () => void;
}

export function useTransitionState(
  params: UseTransitionStateParams
): UseTransitionStateReturn {
  const {
    currentSong,
    queue,
    startNextSong,
    autoplayDelay,
    setSongCompletedHandler,
  } = params;

  const [transitionState, setTransitionState] = useState<TransitionState>({
    displayState: "waiting",
  });
  const lastSongIdRef = useRef<string | null>(null);

  // Handle song completion from socket events
  const handleSongCompleted = useCallback(
    (data: { song: QueueItem; rating: unknown }) => {
      console.log(
        "Song completed via socket, starting transition sequence",
        data
      );

      const nextSong = queue.find(song => song.status === "pending");
      const rating = data.rating as SongRating;

      setTransitionState({
        displayState: "applause",
        completedSong: data.song,
        nextSong,
        rating,
        transitionStartTime: Date.now(),
      });
    },
    [queue]
  );

  // Set up song completion handler
  useEffect(() => {
    setSongCompletedHandler(handleSongCompleted);
  }, [setSongCompletedHandler, handleSongCompleted]);

  // Handle display state transitions based on current song
  useEffect(() => {
    const currentSongId = currentSong?.id || null;

    if (currentSong && currentSongId !== lastSongIdRef.current) {
      setTransitionState({ displayState: "playing" });
      lastSongIdRef.current = currentSongId;
    } else if (!currentSong) {
      setTransitionState({ displayState: "waiting" });
      lastSongIdRef.current = null;
    }
  }, [currentSong, queue]);

  // Handle rating animation completion
  const handleRatingComplete = useCallback(() => {
    if (transitionState.nextSong) {
      setTransitionState(prev => ({
        ...prev,
        displayState: "next-up",
      }));
    } else {
      setTransitionState({ displayState: "waiting" });
    }
  }, [transitionState.nextSong]);

  // Handle next song splash completion
  const handleNextSongComplete = useCallback(() => {
    console.log("Next song splash complete, requesting next song from server");

    setTransitionState({
      displayState: "transitioning",
    });

    setTimeout(() => {
      startNextSong();
    }, autoplayDelay);
  }, [startNextSong, autoplayDelay]);

  return {
    transitionState,
    setTransitionState,
    handleRatingComplete,
    handleNextSongComplete,
  };
}
