"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/home/navbar";
import { AvailableUsersList } from "@/components/home/available-users-list";
import { VideoFeed } from "@/components/home/video-feed";
import { CommentsRail } from "@/components/home/comments-rail";
import type { LivestreamItem } from "@/types/livestream-types";
import { useLiveStream } from "./Context/Home_context";
import viewstream from "./utils/viewstream";

type LivestreamsResponse =
  | {
    livestreams: LivestreamItem[];
  }
  | {
    error: string;
  };

export interface ViewerTokenResponse {
  token: string;
  roomName: string;
}
export function HomeDashboard() {
  const { streams, setStreams, selectedStreamId, setSelectedStreamId, setLivestream, setTokenLoading } = useLiveStream()
  const [loading, setLoadingState] = useState(true);

  useEffect(() => {
    let active = true;

    const loadLivestreams = async () => {
      setLoadingState(true);

      try {
        const response = await fetch("/api/livestreams");

        if (!response.ok) {
          throw new Error(`Failed to load livestreams: ${response.status}`);
        }

        const data: LivestreamsResponse = await response.json();

        if (!active) return;

        if ("error" in data) {
          setStreams([]);
          setSelectedStreamId(null);
          return;
        }

        const streamsList = data.livestreams ?? [];

        setStreams(streamsList);

        const initialStream = streamsList[0];

        if (!initialStream) {
          setSelectedStreamId(null);
          return;
        }

        setSelectedStreamId(initialStream.id);

        // Don't let token loading control the main page loading state
        setTokenLoading(true);

        try {
          const tokenPayload = await viewstream(initialStream.id);

          if (active) {
            setLivestream(tokenPayload);
          }
        } catch (err) {
          console.error(
            "Failed to auto-load initial stream token:",
            err
          );
        } finally {
          if (active) {
            setTokenLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to load livestreams:", error);

        if (active) {
          setStreams([]);
          setSelectedStreamId(null);
        }
      } finally {
        // This now finishes independently of token loading
        if (active) {
          setLoadingState(false);
        }
      }
    };

    loadLivestreams();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#223042_0%,_#0b1220_45%,_#060a12_100%)] text-slate-100 md:overflow-hidden">
      <Navbar />

      {/*
        Mobile/tablet: panels stack, the page scrolls, and the video takes
        priority over the streams list and comments (order-* below).
        Desktop (md+): fixed-height row layout, each panel scrolls internally.
      */}
      <main className="mx-auto flex w-full max-w-[1900px] flex-col gap-3 px-3 py-4 sm:px-4 md:h-[calc(100vh-84px)] md:flex-row md:gap-1 md:overflow-hidden md:px-6">
        <AvailableUsersList
          streams={streams}
          loading={loading}
          selectedStreamId={selectedStreamId}
          onSelectStream={(stream) => setSelectedStreamId(stream.id)}
          onSetLivestream={(payload: ViewerTokenResponse) => setLivestream(payload)}
        />
        <VideoFeed
          loading={loading}
        />
        <CommentsRail
          loading={loading}
        />
      </main>
    </div>
  );
}
