export function getConnectionStatusColor(
  isConnected: boolean,
  error: string | null
): string {
  if (isConnected) return "bg-green-500";
  if (error?.includes("Reconnecting") || error?.includes("attempt")) {
    return "bg-yellow-500 animate-pulse";
  }
  return "bg-red-500";
}

export function getConnectionStatusText(
  isConnected: boolean,
  userName: string,
  error: string | null
): string {
  if (isConnected) return `Connected as ${userName}`;
  if (error?.includes("Reconnecting") || error?.includes("attempt")) {
    return "Reconnecting...";
  }
  return "Connecting...";
}
