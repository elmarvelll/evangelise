
import type { LivestreamItem } from "@/types/livestream-types";
import { DonationCard } from "@/components/home/donation-card";

type AboutCardProps = {
  stream: LivestreamItem | null;
};

function fallbackText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "this message was not provided.";
}

export default function AboutCard({ stream }: AboutCardProps) {
  const ownerName = stream?.user
    ? `${stream.user.firstName ?? ""} ${stream.user.lastName ?? ""}`.trim()
    : "";

  return (
    <article className="p-4 transition sm:p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">
            About {ownerName || "this message was not provided."}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:leading-7">
            {fallbackText(stream?.sessionDescription)}
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-5">
        <DonationCard stream={stream} />
      </div>

      <div className="mt-4 border-t border-white/10 pt-4 sm:mt-5">
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Other videos</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-300">
            this message was not provided.
          </div>
        </div>
      </div>
    </article>
  );
}
