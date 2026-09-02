"use client";

import { useState } from "react";
import { useLiveStream } from "../Context/Home_context";
import api from "@/lib/axios";

export function useSendComment(selectedStreamId: string | null) {
  const [commentText, setCommentText] = useState("");
  const { roomRef, setComments } = useLiveStream();

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const text = commentText.trim();

    if (!text || !selectedStreamId) return;

    try {
      // 1. Save comment to database
      const response = await api.post(
        `/livestreams/comments/${selectedStreamId}`,
        { text }
      );

      const comment = response.data;

      console.log("Comment sent:", comment);

      // 2. Add immediately to sender's UI
      setComments((prev) => {
        if (prev.some((item) => item.id === comment.id)) {
          return prev;
        }

        return [...prev, comment];
      });

      // 3. Get LiveKit room
      const room = roomRef.current;

      console.log("LiveKit room:", room);
      console.log("LiveKit state:", room?.state);

      if (!room) {
        console.error("❌ No LiveKit room available");
        return;
      }

      if (room.state !== "connected") {
        console.error(
          "❌ LiveKit room is not connected:",
          room.state
        );
        return;
      }

      // 4. Send comment through LiveKit
      const payload = new TextEncoder().encode(
        JSON.stringify({
          type: "comment",
          comment,
        })
      );

      console.log("🚀 Publishing comment to LiveKit...");

      await room.localParticipant.publishData(payload, {
        reliable: true,
      });

      console.log("✅ Comment published to LiveKit");

      setCommentText("");

    } catch (error) {
      console.error("❌ Failed to send comment:", error);
    }
  };

  const setText = (text: string) => {
    setCommentText(text);
  };

  return {
    commentText,
    setCommentText,
    handleSubmit,
    setText,
  };
}