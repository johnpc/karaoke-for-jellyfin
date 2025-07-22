// Server-side configuration
export interface AppConfig {
  autoplayDelay: number;
  queueAutoplayDelay: number;
  controlsAutoHideDelay: number;
  timeUpdateInterval: number;
  ratingAnimationDuration: number;
  nextSongDuration: number;
}

export function getServerConfig(): AppConfig {
  return {
    autoplayDelay: parseInt(process.env.AUTOPLAY_DELAY || "500"),
    queueAutoplayDelay: parseInt(process.env.QUEUE_AUTOPLAY_DELAY || "1000"),
    controlsAutoHideDelay: parseInt(
      process.env.CONTROLS_AUTO_HIDE_DELAY || "10000",
    ),
    timeUpdateInterval: parseInt(process.env.TIME_UPDATE_INTERVAL || "2000"),
    ratingAnimationDuration: parseInt(
      process.env.RATING_ANIMATION_DURATION || "15000",
    ),
    nextSongDuration: parseInt(process.env.NEXT_SONG_DURATION || "15000"),
  };
}
