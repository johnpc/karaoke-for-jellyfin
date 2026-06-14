import React from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  activeColor: "purple" | "red";
  children: React.ReactNode;
}

export function TabButton({
  active,
  onClick,
  activeColor,
  children,
}: TabButtonProps) {
  const activeClass =
    activeColor === "red"
      ? "border-red-500 text-red-600 bg-red-50"
      : "border-purple-500 text-purple-600 bg-purple-50";
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
        active
          ? activeClass
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
