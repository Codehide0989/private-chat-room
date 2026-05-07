"use client";

import { useEffect, useRef, useState } from "react";

interface QueuedMessage {
  text: string;
  timestamp: number;
}

export const useOfflineQueue = (isOnline: boolean) => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const queueRef = useRef<QueuedMessage[]>([]);

  // Initialize queue from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("message_queue");
        if (stored) {
          const parsed = JSON.parse(stored);
          queueRef.current = parsed;
          setQueue(parsed);
        }
      } catch (error) {
        console.error("[v0] Failed to parse stored queue:", error);
      }
    }
  }, []);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (queueRef.current.length > 0) {
          localStorage.setItem(
            "message_queue",
            JSON.stringify(queueRef.current),
          );
        } else {
          localStorage.removeItem("message_queue");
        }
      } catch (error) {
        console.error("[v0] Failed to persist queue:", error);
      }
    }
  }, [queue]);

  const addToQueue = (text: string) => {
    const message: QueuedMessage = {
      text,
      timestamp: Date.now(),
    };
    queueRef.current.push(message);
    setQueue([...queueRef.current]);
  };

  const getQueue = (): QueuedMessage[] => {
    return [...queueRef.current];
  };

  const clearQueue = () => {
    queueRef.current = [];
    setQueue([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("message_queue");
      } catch (error) {
        console.error("[v0] Failed to clear queue from storage:", error);
      }
    }
  };

  const removeFromQueue = (index: number) => {
    queueRef.current.splice(index, 1);
    setQueue([...queueRef.current]);
  };

  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getQueue,
  };
};
