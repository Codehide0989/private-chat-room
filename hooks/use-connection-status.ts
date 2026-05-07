"use client";

import { useEffect, useState } from "react";

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [lastConnectedAt, setLastConnectedAt] = useState<number>(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatus("reconnecting");
      // Simulate reconnection delay
      setTimeout(() => {
        setStatus("connected");
        setLastConnectedAt(Date.now());
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    status,
    isOnline,
    lastConnectedAt,
  };
};
