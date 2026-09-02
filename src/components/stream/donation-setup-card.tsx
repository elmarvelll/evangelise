type DonationSetupCardProps = {
  enabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  onToggle: (enabled: boolean) => void;
  onBankNameChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
};

/**
 * Bank-transfer details a viewer can use to support the streamer
 * directly — not an in-app payment system. When enabled, all three
 * fields are required (enforced server-side too, in
 * `livestream.service/validate-donation-info.ts`).
 */
export function DonationSetupCard({
  enabled,
  bankName,
  accountName,
  accountNumber,
  onToggle,
  onBankNameChange,
  onAccountNameChange,
  onAccountNumberChange,
}: DonationSetupCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Donations</p>
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={[
            "h-6 w-11 shrink-0 rounded-full border p-1 transition",
            enabled ? "border-emerald-400/30 bg-emerald-400/20" : "border-white/10 bg-slate-800",
          ].join(" ")}
          aria-pressed={enabled}
          aria-label="Toggle donations"
        >
          <span
            className={[
              "block h-4 w-4 rounded-full transition",
              enabled ? "translate-x-5 bg-emerald-300" : "translate-x-0 bg-slate-400",
            ].join(" ")}
          />
        </button>
      </div>

      <p className="mb-4 text-sm leading-6 text-slate-400">
        Share bank-transfer details so viewers can support your ministry directly. All three
        fields are required if donations are enabled.
      </p>

      {enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Bank name</label>
            <input
              type="text"
              value={bankName}
              onChange={(event) => onBankNameChange(event.target.value)}
              placeholder="Access Bank"
              className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Account name</label>
            <input
              type="text"
              value={accountName}
              onChange={(event) => onAccountNameChange(event.target.value)}
              placeholder="John Doe Ministries"
              className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Account number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(event) => onAccountNumberChange(event.target.value)}
              placeholder="0123456789"
              className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/30"
            />
          </div>
        </div>
      )}
    </section>
  );
}
