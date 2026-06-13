"use client";

import { MediaItem } from "@/types";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { SearchContent } from "./search-interface-components";
import { useSearchInterface } from "@/hooks/useSearchInterface";

interface SearchInterfaceProps {
  onAddSong: (mediaItem: MediaItem) => Promise<void>;
  isConnected: boolean;
}

export function SearchInterface({
  onAddSong,
  isConnected,
}: SearchInterfaceProps) {
  const {
    showConfirmation,
    confirmationTitle,
    confirmationMessage,
    confirmationType,
    handleCloseConfirmation,
    ...searchContentProps
  } = useSearchInterface(onAddSong, isConnected);

  return (
    <div className="flex flex-col h-full">
      <SearchContent {...searchContentProps} />

      <ConfirmationDialog
        isOpen={showConfirmation}
        title={confirmationTitle}
        message={confirmationMessage}
        onClose={handleCloseConfirmation}
        type={confirmationType}
        autoCloseDelay={2500}
      />
    </div>
  );
}
