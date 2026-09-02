import Link from "next/link";
import { Navbar } from "@/components/home/navbar";
import { StreamSetupForm } from "@/components/stream/pages/stream-setup-form";

export default function StreamSetupPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#223042_0%,_#0b1220_45%,_#060a12_100%)] text-slate-100">
      <Navbar />

      <main className="mx-auto flex h-[calc(100vh-84px)] w-full max-w-[1120px] justify-center overflow-y-auto scroll-black px-4 py-6 md:px-6">
        <div className="w-full max-w-3xl">
          <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <Link
              href="/"
              className="w-fit rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100"
            >
              Back to home
            </Link>
          </div>
          <StreamSetupForm />
        </div>
      </main>
    </div>
  );
}
