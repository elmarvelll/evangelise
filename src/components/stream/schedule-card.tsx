type ScheduleCardProps = {
  mode: "now" | "schedule";
  scheduleDate: string;
  onModeChange: (mode: "now" | "schedule") => void;
  onScheduleDateChange: (date: string) => void;
};

export function ScheduleCard({
  mode,
  scheduleDate,
  onModeChange,
  onScheduleDateChange,
}: ScheduleCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Stream timing</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onModeChange("now")}
            className={[
              "rounded-2xl border px-4 py-3 text-left transition",
              mode === "now"
                ? "border-cyan-400/30 bg-cyan-400/10"
                : "border-white/10 bg-[#0b1320] hover:border-cyan-400/20",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-white">Start streaming now</p>
            <p className="mt-1 text-xs text-slate-400">
              Begin immediately and go live right away.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onModeChange("schedule")}
            className={[
              "rounded-2xl border px-4 py-3 text-left transition",
              mode === "schedule"
                ? "border-cyan-400/30 bg-cyan-400/10"
                : "border-white/10 bg-[#0b1320] hover:border-cyan-400/20",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-white">Schedule a stream</p>
            <p className="mt-1 text-xs text-slate-400">
              Choose a date and prepare it for later.
            </p>
          </button>
        </div>

        {mode === "schedule" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Schedule date
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(event) => onScheduleDateChange(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/30"
            />
          </div>
        )}
      </div>
    </section>
  );
}
