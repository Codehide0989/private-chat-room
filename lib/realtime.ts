import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import z from "zod";
import { redis } from "./redis";

const messageStatus = z.enum(["pending", "sent", "delivered", "failed"]);

const message = z.object({
  id: z.string(),
  sender: z.string(),
  text: z.string(),
  timeStamp: z.number(),
  roomId: z.string(),
  token: z.string().optional(),
  status: messageStatus.default("sent"),
  sequence: z.number().optional(),
  retryCount: z.number().default(0),
  deliveredAt: z.number().optional(),
});

const schema = {
  chat: {
    message,
    presence: z.object({
      roomId: z.string(),
      participants: z.number(),
      maxParticipants: z.number(),
    }),
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
  },
};

export const realtime = new Realtime({ schema, redis });

export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
export type Message = z.infer<typeof message>;
export type MessageStatus = z.infer<typeof messageStatus>;
