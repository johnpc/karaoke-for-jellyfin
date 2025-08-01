"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface BackButtonProps {
  onBack: () => void;
  label?: string;
}

export function BackButton({
  onBack,
  label = "Back to Search",
}: BackButtonProps) {
  return (
    <div className="flex items-center mb-3">
      <button
        data-testid="back-button"
        onClick={onBack}
        className="flex items-center text-purple-600 hover:text-purple-700 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </button>
    </div>
  );
}
