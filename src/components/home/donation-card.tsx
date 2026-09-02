import type { LivestreamItem } from "@/types/livestream-types";

type DonationCardProps = {
  stream: LivestreamItem | null;
};

/**
 * Bank-transfer support details for the streamer — only rendered when
 * the streamer enabled donations and filled in all three fields.
 * Never shown when donations are disabled (`stream.donationEnabled`
 * false, or the fields are null).
 */
export function DonationCard({ stream }: DonationCardProps) {
  if (
    !stream?.donationEnabled ||
    !stream.donationBankName ||
    !stream.donationAccountName ||
    !stream.donationAccountNumber
  ) {
    return null;
  }

  return (
    <article className="rounded-[10px] border border-emerald-400/15 bg-emerald-400/5 p-4 sm:p-5">
      <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200/80">
        Support this ministry
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Bank</dt>
          <dd className="text-right font-medium text-white">{stream.donationBankName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Account name</dt>
          <dd className="text-right font-medium text-white">{stream.donationAccountName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Account number</dt>
          <dd className="text-right font-medium text-white">{stream.donationAccountNumber}</dd>
        </div>
      </dl>
    </article>
  );
}
