export default function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">{label} : </p>
      <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4">
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}