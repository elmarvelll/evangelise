"use client";

import type { LivestreamItem } from "@/types/livestream-types";
import viewstream from "./utils/viewstream";
import { ViewerTokenResponse } from "./home-dashboard";
import { useLiveStream } from "./Context/Home_context";
import { Loader2 } from "lucide-react";

function StatusDot({ status }: { status: LivestreamItem["status"] }) {
  const isLive = status === "LIVE";
  const isScheduled = status === "SCHEDULED";

  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isLive ? "bg-red-500" : isScheduled ? "bg-yellow-400" : "bg-slate-500",
        ].join(" ")}
      />
      {isLive ? "Live" : "Scheduled"}
    </span>
  );
}

type AvailableUsersListProps = {
  streams: LivestreamItem[];
  loading: boolean;
  selectedStreamId: string | null;
  onSelectStream: (stream: LivestreamItem) => void;
  onSetLivestream:(payload: ViewerTokenResponse) => void;
};

export function AvailableUsersList({
  streams,
  loading,
  selectedStreamId,
  onSelectStream,
  onSetLivestream
}: AvailableUsersListProps) {
  const { setTokenLoading } = useLiveStream();

  async function Clicked_stream(stream:LivestreamItem) {
    onSelectStream(stream)
    try {
      const livestream = await viewstream(stream.id)
      onSetLivestream(livestream)
    } catch (err) {
      console.error("Failed to load stream token:", err);
    }
  }

  return (
    // Mobile/tablet: a horizontally-scrolling strip of compact chips, so the
    // list doesn't eat the vertical space the video needs.
    // Desktop (md+): the original vertical list filling the column height.
    <aside className="order-2 flex h-auto min-h-0 flex-col rounded-[10px] border border-white/10 bg-white/6 px-3 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl md:order-none md:h-full md:w-[250px] md:shrink-0 md:py-4 md:pl-2 md:pr-0">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 md:mb-4 md:pb-3">
        <div>
          <h2 className="mt-1 text-base font-semibold text-white md:text-lg">Live streams</h2>
        </div>
      </div>

      <div className="min-h-0 overflow-x-auto pb-1 scroll-black md:flex-1 md:overflow-x-visible md:overflow-y-auto md:pb-0 md:pr-1">
        <div className="flex gap-3 md:block md:space-y-3">
          {loading ? (
            <div className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-8 text-sm font-medium text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : streams.length > 0 ? (
            streams.map((stream) => (
              <button
                key={stream.id}
                type="button"
                onClick={() => Clicked_stream(stream)}
                className={[
                  "flex w-[172px] shrink-0 cursor-pointer flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition hover:border-cyan-400/30 hover:bg-slate-900/80",
                  "md:w-full md:flex-row md:items-center md:gap-3 md:px-1",
                  selectedStreamId === stream.id
                    ? "border-cyan-400/30 bg-slate-900/80"
                    : "border-white/10 bg-slate-950/55",
                ].join(" ")}
              >
                <div
                  className={[
                    "h-10 w-10 shrink-0 rounded-2xl shadow-lg shadow-black/20 md:h-11 md:w-11",
                    stream.status === "LIVE" ? "bg-red-500" : "bg-yellow-400",
                  ].join(" ")}
                />
                <div className="min-w-0 w-full flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate font-medium text-white">
                      {stream.user?.firstName || "this message was not provided."}{" "}
                      {stream.user?.lastName || ""}
                    </p>
                    <StatusDot status={stream.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {stream.sessionName || "this message was not provided."}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 text-sm text-slate-400">
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
