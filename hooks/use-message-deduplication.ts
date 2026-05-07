"use client";

import type { Message } from "@/lib/realtime";
import { useRef } from "react";

interface DeduplicationEntry {
  messageId: string;
  sequence: number;
  timestamp: number;
}

export const useMessageDeduplication = () => {
  const seenMessagesRef = useRef<Map<string, DeduplicationEntry>>(new Map());
  const sequenceTrackingRef = useRef<number>(-1);

  const addMessage = (message: Message): boolean => {
    // Check if we've seen this message ID before
    const existing = seenMessagesRef.current.get(message.id);

    if (existing) {
      return false; // Duplicate
    }

    // Add to seen set
    seenMessagesRef.current.set(message.id, {
      messageId: message.id,
      sequence: message.sequence ?? -1,
      timestamp: message.timeStamp,
    });

    // Clean up old entries (older than 1 minute)
    const cutoff = Date.now() - 60000;
    for (const [id, entry] of seenMessagesRef.current.entries()) {
      if (entry.timestamp < cutoff) {
        seenMessagesRef.current.delete(id);
      }
    }

    return true; // Not a duplicate
  };

  const validateSequence = (
    message: Message,
  ): { isValid: boolean; outOfOrder: boolean } => {
    if (!message.sequence || message.sequence === -1) {
      return { isValid: true, outOfOrder: false };
    }

    const lastSequence = sequenceTrackingRef.current;
    const isValid = message.sequence > lastSequence;
    const outOfOrder = message.sequence <= lastSequence;

    if (isValid) {
      sequenceTrackingRef.current = message.sequence;
    }

    return { isValid, outOfOrder };
  };

  const isDuplicate = (messageId: string): boolean => {
    return seenMessagesRef.current.has(messageId);
  };

  const getLastSequence = (): number => {
    return sequenceTrackingRef.current;
  };

  const reset = () => {
    seenMessagesRef.current.clear();
    sequenceTrackingRef.current = -1;
  };

  return {
    addMessage,
    validateSequence,
    isDuplicate,
    getLastSequence,
    reset,
  };
};
