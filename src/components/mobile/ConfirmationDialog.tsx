"use client";

import { useEffect } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseDelay?: number; // Auto-close after this many milliseconds
  type?: "success" | "info" | "warning" | "error";
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  onClose,
  autoCloseDelay = 2000,
  type = "success",
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircleIcon className="w-8 h-8 text-green-500" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
        };
      case "error":
        return {
          icon: <XMarkIcon className="w-8 h-8 text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
        };
      case "warning":
        return {
          icon: <XMarkIcon className="w-8 h-8 text-yellow-500" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
        };
      default: // info
        return {
          icon: <CheckCircleIcon className="w-8 h-8 text-blue-500" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700",
        };
    }
  };

  const { icon, bgColor, borderColor, titleColor, messageColor } = getIconAndColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${bgColor} ${borderColor} border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg animate-in fade-in-0 zoom-in-95 duration-200`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${titleColor}`}>{title}</h3>
            <p className={`text-sm mt-1 ${messageColor} break-words`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {autoCloseDelay > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-purple-600 h-1 rounded-full"
                style={{
                  animation: `shrink ${autoCloseDelay}ms linear forwards`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
