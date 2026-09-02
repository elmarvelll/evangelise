type SessionCardProps = {
  sessionName: string;
  sessionDescription: string;
  onSessionNameChange: (value: string) => void;
  onSessionDescriptionChange: (value: string) => void;
};

export function SessionCard({
  sessionName,
  sessionDescription,
  onSessionNameChange,
  onSessionDescriptionChange,
}: SessionCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Session details</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Session name</label>
          <input
            type="text"
            value={sessionName}
            onChange={(event) => onSessionNameChange(event.target.value)}
            placeholder="e.g. Open Doors Prayer Night"
            className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">Session description</label>
          <textarea
            value={sessionDescription}
            onChange={(event) => onSessionDescriptionChange(event.target.value)}
            placeholder="Tell viewers what this stream is about and what they can expect."
            rows={5}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/30"
          />
        </div>
      </div>
    </section>
  );
}
