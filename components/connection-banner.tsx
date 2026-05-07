"use client";

interface ConnectionBannerProps {
  isOnline: boolean;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
}

export const ConnectionBanner = ({
  isOnline,
  connectionStatus,
}: ConnectionBannerProps) => {
  if (isOnline && connectionStatus === "connected") {
    return null;
  }

  const statusConfig = {
    connected: {
      label: "Connected",
      icon: "✓",
      color: "bg-green-500/20",
      textColor: "text-green-300",
      borderColor: "border-green-500/30",
    },
    disconnected: {
      label: "Offline - Messages will sync when online",
      icon: "⚠",
      color: "bg-red-500/20",
      textColor: "text-red-300",
      borderColor: "border-red-500/30",
    },
    reconnecting: {
      label: "Reconnecting...",
      icon: "↻",
      color: "bg-amber-500/20",
      textColor: "text-amber-300",
      borderColor: "border-amber-500/30",
    },
  };

  const config = statusConfig[connectionStatus];

  return (
    <div
      className={`px-4 py-2 border-b ${config.color} ${config.borderColor} flex items-center gap-2 ${config.textColor} text-sm font-medium`}
    >
      <span
        className={
          connectionStatus === "reconnecting" ? "inline-block animate-spin" : ""
        }
      >
        {config.icon}
      </span>
      <span>{config.label}</span>
    </div>
  );
};
