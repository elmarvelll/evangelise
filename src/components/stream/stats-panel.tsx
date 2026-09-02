import type { StreamerOverview } from "@/components/stream/utils/use-streamer-stats";

type StatsPanelProps = {
  overview: StreamerOverview;
  loading: boolean;
  error: string | null;
  currentViewerCount: number | null;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

/** Real database/LiveKit-backed stats — never placeholder numbers. */
export function StatsPanel({ overview, loading, error, currentViewerCount }: StatsPanelProps) {
  if (loading) {
    return <p className="text-sm text-slate-400">Loading stats…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="Current viewers" value={currentViewerCount ?? 0} />
      <Stat label="Followers" value={overview.followerCount} />
      <Stat label="Lifetime views" value={overview.lifetimeViews} />
      <Stat label="Peak viewers" value={overview.allTimePeakViewers} />
      <Stat label="Total streams" value={overview.totalStreams} />
    </div>
  );
}
