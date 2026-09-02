type InteractionsCardProps = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
};

export function InteractionsCard({ enabled, onToggle }: InteractionsCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Interactions</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm leading-7 text-slate-300">
          Enabling interactions allows the streamer to receive requests for interaction from users. If you disable it, users will not be able to send those requests.
        </p>

        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={[
            "flex w-full items-center justify-between rounded-2xl border px-4 py-3 transition",
            enabled
              ? "border-emerald-400/20 bg-emerald-400/10"
              : "border-white/10 bg-[#0b1320]",
          ].join(" ")}
        >
          <div>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
              {enabled ? "Users can request to join" : "Requests are turned off"}
            </p>
          </div>
          <span
            className={[
              "h-6 w-11 rounded-full border p-1 transition",
              enabled ? "border-emerald-400/30 bg-emerald-400/20" : "border-white/10 bg-slate-800",
            ].join(" ")}
          >
            <span
              className={[
                "block h-4 w-4 rounded-full transition",
                enabled ? "translate-x-5 bg-emerald-300" : "translate-x-0 bg-slate-400",
              ].join(" ")}
            />
          </span>
        </button>
      </div>
    </section>
  );
}
