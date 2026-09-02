"use client";

import { useEffect } from "react";
import { RoomEvent, type RemoteParticipant } from "livekit-client";
import { useLiveStream } from "../Context/Home_context";

export function useCommentListener() {
  const { room, setComments } = useLiveStream();

  useEffect(() => {
    console.log("Comment listener effect ran");
    console.log("Current room:", room);

    if (!room) {
      console.log("❌ No room, listener NOT attached");
      return;
    }

    console.log("✅ Attaching DataReceived listener");

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      console.log("🔥 DATA RECEIVED!");
      console.log("Payload:", payload);
      console.log("Participant:", participant);

      try {
        const message = JSON.parse(
          new TextDecoder().decode(payload)
        );

        console.log("Received message:", message);

        if (message.type !== "comment") return;

        const comment = message.comment;

        setComments((prev) => {
          if (prev.some((item) => item.id === comment.id)) {
            return prev;
          }

          return [...prev, comment];
        });
      } catch (error) {
        console.error("Failed to receive comment:", error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    console.log("✅ DataReceived listener attached");

    return () => {
      console.log("Removing DataReceived listener");
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, setComments]);
}