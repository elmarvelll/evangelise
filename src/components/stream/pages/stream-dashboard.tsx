"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LiveView from "../live/LiveView";
import { useStream } from "../context/StreamContext";
import { restoreLivestreams } from "../utils/restoreLivestreams";
import { useGoLive } from "../utils/GoLive";
import { useEndStream } from "../utils/Endstream";
import useReconnectToLiveKit from "../utils/reconnectToLivestreams";
import { useLiveStream } from "@/components/home/Context/Home_context";
import api from "@/lib/axios";


type StreamViewMode = "live" | "scheduled";

export function StreamDashboard() {
  const [viewMode, setViewMode] = useState<StreamViewMode>("live");
  const [isLive, setIsLive] = useState<boolean>(false);
  const { videoTrack, audioTrack, setlocalvideoTrack, setlocalaudioTrack } = useStream();
  const { roomRef, setRoom, roomId, setroomId } = useLiveStream()
  const reconnectToLiveKit = useReconnectToLiveKit();


  useEffect(() => {
    async function getLivestreams() {
      try {
        const livestreams = await restoreLivestreams()
        console.log(livestreams)
        if (!livestreams.isLive || !livestreams.livestream) {
          setIsLive(false);
          return;
        }
        await reconnectToLiveKit(
          livestreams.livestream,
          setroomId,
          setIsLive,
          roomRef,
          setRoom
        ); setIsLive(livestreams.isLive)
      } catch (error) {
        console.error("Failed to restore livestream:", error);
      }
    }
    getLivestreams()
  }, [])

  useEffect(() => {
  if (!isLive || !roomId) {
    return;
  }

  const sendHeartbeat = async () => {
    try {
      await api.post("/livekit/heartbeat", { roomId }),
      console.log("💓 Stream heartbeat");
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  };

  // Send immediately
  sendHeartbeat();

  // Then every 10 seconds
  const interval = setInterval(sendHeartbeat, 60_000);

  return () => {
    clearInterval(interval);
  };
}, [isLive, roomId]);



  const goLive = useGoLive(
    videoTrack,
    audioTrack,
    roomRef,
    setroomId,
    setRoom,
    setIsLive,
    setlocalvideoTrack,
    setlocalaudioTrack
  );

  const endStream = useEndStream(
    roomRef,
    setIsLive,
    setRoom,
  );

  const actionLabel = isLive ? "End stream" : "Go live";
  const actionTone = isLive
    ? "border-rose-400/20 bg-rose-400/10 text-rose-100 hover:border-rose-400/30"
    : "border-cyan-400/20 bg-cyan-400 px-5 py-3 text-slate-950 hover:bg-cyan-300";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 shrink-0 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Link
            href="/stream/new"
            className="w-fit rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100"
          >
            Back to stream setup
          </Link>

          <div className="flex rounded-full border border-white/10 bg-slate-950/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode("live")}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition",
                viewMode === "live"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-white",
              ].join(" ")}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => setViewMode("scheduled")}
              className={[
                "rounded-full px-4 py-2 text-sm font-medium transition",
                viewMode === "scheduled"
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:text-white",
              ].join(" ")}
            >
              Scheduled
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-100">
            Live
          </span>
          <button
            type="button"
            onClick={() => isLive ? endStream(roomId) : goLive()}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
              actionTone,
            ].join(" ")}
          >
            {actionLabel}
          </button>
        </div>
      </div>


      {viewMode === "live" ? (
        <LiveView isLive={isLive} />
      ) : (
        // <section className="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        //   <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
        //     <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        //       <div>
        //         <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
        //           Scheduled stream
        //         </p>
        //         <h2 className="mt-1 text-xl font-semibold text-white">Pre-live overview</h2>
        //       </div>
        //       <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-yellow-100">
        //         Upcoming
        //       </span>
        //     </div>

        //     <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        //       <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
        //         <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Next stream</p>
        //         <h3 className="mt-2 text-2xl font-semibold text-white">Sunday Revival Live</h3>
        //         <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
        //           This is where the scheduled version can show the upcoming stream metadata,
        //           countdown, and launch readiness before the user toggles to live.
        //         </p>

        //         <div className="mt-5 grid gap-3 md:grid-cols-2">
        //           <InfoCard label="Start time" value="August 22, 2026 at 7:30 PM" />
        //           <InfoCard label="Countdown" value="Starts in 2 days, 4 hours" />
        //           <InfoCard label="Mode" value="Scheduled stream" />
        //           <InfoCard label="Status" value="Ready for publishing" />
        //         </div>
        //       </div>

        //       <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
        //         <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
        //           Checklist
        //         </p>
        //         <ul className="mt-4 space-y-3">
        //           {scheduledHighlights.map((item) => (
        //             <li
        //               key={item}
        //               className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300"
        //             >
        //               {item}
        //             </li>
        //           ))}
        //         </ul>
        //       </div>
        //     </div>
        <section className="flex flex-1 items-center justify-center rounded-[24px] border border-white/10 bg-white/6 p-10 shadow-2xl shadow-black/25 backdrop-blur-xl min-h-[300px]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">Scheduled Mode</h2>
            <p className="mt-2 text-slate-400 text-sm font-medium">Coming Soon</p>
          </div>

          {/* <div className="rounded-[24px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Status</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Scheduled mode</h2>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-sm leading-7 text-slate-300">
                When the stream is not live yet, this side panel can carry launch notes,
                moderation reminders, and a compact pre-flight summary.
              </p>
            </div>
          </div> */}
        </section>
      )}
    </div>
  );
}
