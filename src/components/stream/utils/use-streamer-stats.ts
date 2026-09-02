"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export type StreamerOverview = {
  followerCount: number;
  totalStreams: number;
  lifetimeViews: number;
  allTimePeakViewers: number;
};

const EMPTY: StreamerOverview = {
  followerCount: 0,
  totalStreams: 0,
  lifetimeViews: 0,
  allTimePeakViewers: 0,
};

/** Real aggregate stats for the signed-in streamer, from `GET /api/users/[userId]/stats`. */
export function useStreamerStats(userId: string | null) {
  const [overview, setOverview] = useState<StreamerOverview>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!userId) {
        if (active) {
          setOverview(EMPTY);
          setLoading(false);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await api.get(`/users/${userId}/stats`);
        if (active) setOverview(response.data);
      } catch (err) {
        console.error("Failed to load streamer stats:", err);
        if (active) setError("Couldn't load stats right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [userId]);

  return { overview, loading, error };
}
