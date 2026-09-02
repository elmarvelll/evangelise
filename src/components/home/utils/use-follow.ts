"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/axios";

/**
 * Follow state for one streamer, backed by real API calls
 * (`/api/users/[userId]/follow*`) — no frontend-only follow state.
 * Re-fetches whenever `streamerId` changes (i.e. the viewer switches
 * which stream they're watching).
 */
export function useFollow(streamerId: string | null) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!streamerId) {
      setIsFollowing(false);
      setFollowerCount(0);
      return;
    }

    let active = true;

    api
      .get(`/users/${streamerId}/follow-status`)
      .then((response) => {
        if (!active) return;
        setIsFollowing(Boolean(response.data.isFollowing));
        setFollowerCount(Number(response.data.followerCount) || 0);
      })
      .catch((error) => {
        console.error("Failed to load follow status:", error);
      });

    return () => {
      active = false;
    };
  }, [streamerId]);

  async function toggleFollow() {
    if (!streamerId || !session?.user || loading) return;

    setLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update, reconciled against the server response below.
    setIsFollowing(!wasFollowing);
    setFollowerCount((count) => count + (wasFollowing ? -1 : 1));

    try {
      if (wasFollowing) {
        await api.delete(`/users/${streamerId}/follow`);
      } else {
        await api.post(`/users/${streamerId}/follow`);
      }
    } catch (error) {
      console.error("Failed to update follow state:", error);
      // Roll back the optimistic update on failure.
      setIsFollowing(wasFollowing);
      setFollowerCount((count) => count + (wasFollowing ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }

  return {
    isFollowing,
    followerCount,
    loading,
    canFollow: Boolean(session?.user),
    toggleFollow,
  };
}
