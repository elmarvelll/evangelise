"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/home/navbar";
import { StreamDashboard } from "@/components/stream/pages/stream-dashboard";
import {
  isStreamSetupComplete,
  readStreamSetupDraft,
} from "@/components/stream/utils/stream-session-storage";

export default function StreamDashboardPage() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  useEffect(()=>{console.log(checking)},[checking])
  useEffect(() => {
    const draft = readStreamSetupDraft();
   console.log(draft)
    if (!draft || !isStreamSetupComplete(draft)) {
      router.replace("/stream/new");
      return;
    }

    setChecking(false);
  }, [router]);

  return checking ? (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#223042_0%,_#0b1220_45%,_#060a12_100%)] text-slate-100">
      <Navbar />
      <main className="mx-auto flex h-[calc(100vh-84px)] w-full max-w-[1900px] items-center justify-center px-4 py-4 md:px-6">
        <div className="rounded-[24px] border border-white/10 bg-white/6 px-5 py-4 text-sm text-slate-300 shadow-2xl shadow-black/25 backdrop-blur-xl">
          Checking your stream setup...
        </div>
      </main>
    </div>
  ) : (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#223042_0%,_#0b1220_45%,_#060a12_100%)] text-slate-100">
      <Navbar />

      <main className="mx-auto flex h-[calc(100vh-84px)] w-full max-w-[1900px] flex-col overflow-hidden px-4 py-4 md:px-6">
        <div className="min-h-0 flex-1 overflow-hidden">
          <StreamDashboard />
        </div>
      </main>
    </div>
  )
}
