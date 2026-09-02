import { ComponentType } from "react";

export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number }>;
}) {
  return (
    <div className="p-1">
      <span className="mt-4 text-xs uppercase text-slate-400">{label} : </span>
      <span className="mt-1 text-sm text-white">{value}</span>
    </div>
  );
}
