type TagsDropdownProps = {
  availableTags: string[];
  selectedTags: string[];
  isOpen: boolean;
  maxTags: number;
  onToggleOpen: () => void;
  onSelectTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
};

export function TagsDropdown({
  availableTags,
  selectedTags,
  isOpen,
  maxTags,
  onToggleOpen,
  onSelectTag,
  onRemoveTag,
}: TagsDropdownProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Tags</p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/30"
        >
          <span>
            {selectedTags.length > 0
              ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
              : "Select tags"}
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {isOpen ? "Close" : "Open"}
          </span>
        </button>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-cyan-100"
              >
                {tag} x
              </button>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-[#08111d] p-3 sm:grid-cols-2">
            {availableTags.map((tag) => {
              const selected = selectedTags.includes(tag);
              const disabled = !selected && selectedTags.length >= maxTags;

              return (
                <button
                  key={tag}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelectTag(tag)}
                  className={[
                    "rounded-2xl border px-3 py-3 text-left text-sm transition",
                    selected
                      ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-cyan-400/20 hover:bg-slate-900/80",
                    disabled ? "cursor-not-allowed opacity-40" : "",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-sm text-slate-400">
          Select up to {maxTags} tags. These help viewers understand the kind of Christian stream you are starting.
        </p>
      </div>
    </section>
  );
}
