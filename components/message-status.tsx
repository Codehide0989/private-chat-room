"use client";

import type { MessageStatus } from "@/lib/realtime";

interface MessageStatusProps {
  status: MessageStatus;
  retryCount?: number;
  onRetry?: () => void;
  onDelete?: () => void;
}

export const MessageStatusBadge = ({
  status,
  retryCount,
  onRetry,
  onDelete,
}: MessageStatusProps) => {
  const statusConfig = {
    pending: {
      label: "Sending...",
      icon: "⏳",
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    sent: {
      label: "Sent",
      icon: "✓",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20",
    },
    delivered: {
      label: "Delivered",
      icon: "✓✓",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    failed: {
      label: "Failed",
      icon: "✕",
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
    },
  };

  const config = statusConfig[status];

  if (status === "sent" || status === "delivered") {
    return (
      <div
        className={`flex items-center gap-1 text-xs ${config.color} opacity-60`}
      >
        <span>{config.icon}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${config.color} ${config.bgColor} border ${config.borderColor}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {status === "failed" && (
        <div className="flex gap-1 ml-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="hover:underline font-semibold"
              title="Retry sending"
            >
              Retry
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="hover:underline font-semibold text-red-300"
              title="Delete message"
            >
              Delete
            </button>
          )}
        </div>
      )}
      {status === "pending" && retryCount !== undefined && retryCount > 0 && (
        <span className="text-xs opacity-70">
          (Attempt {retryCount + 1})
        </span>
      )}
    </div>
  );
};
