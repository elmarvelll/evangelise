"use client";

import { useEffect, useRef, useState } from "react";

export type ActivityFeedItem = {
  id: string;
  text: string;
  timestamp: number;
};

type ActivityEvent =
  | { type: "follow"; followerName: string; followerId: string }
  | { type: "viewer_joined"; viewerCount: number }
  | { type: "viewer_left"; viewerCount: number }
  | { type: "stream_started"; livestreamId: string }
  | { type: "stream_ended"; livestreamId: string };

function describeEvent(event: ActivityEvent): string {
  switch (event.type) {
    case "follow":
      return `${event.followerName} followed you`;
    case "viewer_joined":
      return `Someone joined the stream (${event.viewerCount} watching)`;
    case "viewer_left":
      return `Someone left the stream (${event.viewerCount} watching)`;
    case "stream_started":
      return "Stream started";
    case "stream_ended":
      return "Stream ended";
    default:
      return "Activity update";
  }
}

const MAX_FEED_ITEMS = 30;

/**
 * Subscribes to the streamer's own SSE activity feed
 * (`GET /api/livestreams/[id]/activity`) while `isLive` is true. Native
 * `EventSource` handles reconnection on its own — no custom retry loop
 * needed. Latest viewer count is exposed separately so the stats panel
 * can show a live number without parsing the feed text.
 */
export function useActivityFeed(livestreamId: string | null, isLive: boolean) {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [liveViewerCount, setLiveViewerCount] = useState<number | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let active = true;

    if (!livestreamId || !isLive) {
      queueMicrotask(() => {
        if (active) setItems([]);
      });

      return () => {
        active = false;
      };
    }

    const source = new EventSource(`/api/livestreams/${livestreamId}/activity`);
    sourceRef.current = source;

    source.onmessage = (message) => {
      try {
        const event: ActivityEvent = JSON.parse(message.data);

        if (event.type === "viewer_joined" || event.type === "viewer_left") {
          setLiveViewerCount(event.viewerCount);
        }

        setItems((current) => {
          const next: ActivityFeedItem = {
            id: `${Date.now()}-${Math.random()}`,
            text: describeEvent(event),
            timestamp: Date.now(),
          };

          return [next, ...current].slice(0, MAX_FEED_ITEMS);
        });
      } catch (error) {
        console.error("Failed to parse activity event:", error);
      }
    };

    source.onerror = () => {
      // EventSource retries automatically; nothing to do here beyond
      // letting it reconnect.
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [livestreamId, isLive]);

  return { items, liveViewerCount };
}
