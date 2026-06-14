export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallState {
  showInstallPrompt: boolean;
  showUpdatePrompt: boolean;
  isInstalled: boolean;
  isUpdating: boolean;
  hasWaitingWorker: boolean;
}

export interface PWAInstallActions {
  handleInstallClick: () => Promise<void>;
  handleUpdateClick: () => Promise<void>;
  handleDismissInstall: () => void;
  handleDismissUpdate: () => void;
}
