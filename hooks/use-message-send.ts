"use client";

import { client } from "@/lib/client";
import type { Message } from "@/lib/realtime";
import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useCallback, useRef, useState } from "react";

interface SendMessageOptions {
  roomId: string;
  username: string;
}

interface PendingMessage extends Message {
  optimistic: true;
}

export const useMessageSend = ({ roomId, username }: SendMessageOptions) => {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(
    new Set(),
  );
  const pendingMessagesRef = useRef<Map<string, PendingMessage>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const MAX_RETRIES = 3;
  const BASE_RETRY_DELAY = 1000;

  const getExponentialBackoff = (retryCount: number): number => {
    return Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), 10000);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const messageId = nanoid();
      const idempotencyKey = nanoid();
      const now = Date.now();

      // Create optimistic message
      const optimisticMessage: PendingMessage = {
        id: messageId,
        sender: username,
        text: text.trim(),
        timeStamp: now,
        roomId,
        status: "pending",
        sequence: undefined,
        retryCount: 0,
        optimistic: true,
      };

      // Store pending message
      pendingMessagesRef.current.set(messageId, optimisticMessage);
      retryCountRef.current.set(messageId, 0);

      // Optimistically add to UI
      setIsPending(true);
      queryClient.setQueryData(
        ["messages", roomId],
        (old: Message[] = []) => [...old, optimisticMessage],
      );

      try {
        // Send to server
        const res = await client.message.post(
          {
            sender: username,
            text: text.trim(),
            idempotencyKey,
          },
          { query: { roomId } },
        );

        if (res.error) {
          throw new Error(res.error.value.summary ?? "Failed to send message");
        }

        const serverMessage = res.data as Message;

        // Update with server response
        queryClient.setQueryData(
          ["messages", roomId],
          (old: Message[] = []) => {
            return old.map((msg) =>
              msg.id === messageId ? serverMessage : msg,
            );
          },
        );

        // Clean up
        pendingMessagesRef.current.delete(messageId);
        retryCountRef.current.delete(messageId);
        setFailedMessages((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      } catch (error) {
        console.error("[v0] Message send failed:", error);

        const retryCount = retryCountRef.current.get(messageId) ?? 0;

        if (retryCount < MAX_RETRIES) {
          // Schedule retry with exponential backoff
          const delay = getExponentialBackoff(retryCount);
          retryCountRef.current.set(messageId, retryCount + 1);

          setTimeout(() => {
            sendMessage(text);
          }, delay);
        } else {
          // Mark as failed after max retries
          setFailedMessages((prev) => new Set(prev).add(messageId));

          // Update message status to failed
          queryClient.setQueryData(
            ["messages", roomId],
            (old: Message[] = []) => {
              return old.map((msg) =>
                msg.id === messageId
                  ? {
                      ...msg,
                      status: "failed" as const,
                      retryCount: MAX_RETRIES,
                    }
                  : msg,
              );
            },
          );
        }
      } finally {
        setIsPending(false);
      }
    },
    [roomId, username, queryClient],
  );

  const retryFailedMessage = useCallback(
    (messageId: string) => {
      const failedMsg = queryClient.getQueryData<Message[]>(
        ["messages", roomId],
      )?.find((m) => m.id === messageId);

      if (failedMsg) {
        // Reset retry count
        retryCountRef.current.set(messageId, 0);
        setFailedMessages((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });

        // Retry sending
        sendMessage(failedMsg.text);
      }
    },
    [roomId, queryClient, sendMessage],
  );

  const deleteFailedMessage = useCallback(
    (messageId: string) => {
      queryClient.setQueryData(
        ["messages", roomId],
        (old: Message[] = []) => old.filter((msg) => msg.id !== messageId),
      );
      pendingMessagesRef.current.delete(messageId);
      retryCountRef.current.delete(messageId);
      setFailedMessages((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    },
    [roomId, queryClient],
  );

  return {
    sendMessage,
    isPending,
    failedMessages,
    retryFailedMessage,
    deleteFailedMessage,
  };
};
