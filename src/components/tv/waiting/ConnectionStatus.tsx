"use client";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <div
      className={`inline-flex items-center px-4 py-2 rounded-full text-lg ${
        isConnected ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full mr-2 ${
          isConnected ? "bg-green-400" : "bg-red-400"
        }`}
      />
      {isConnected ? "Connected & Ready" : "Connecting..."}
    </div>
  );
}
