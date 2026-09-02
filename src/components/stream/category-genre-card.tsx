import type { StreamCategory, StreamGenre } from "@prisma/client";
import { STREAM_CATEGORIES, STREAM_GENRES, getCategoryLabel, getGenreLabel } from "@/lib/stream-taxonomy";

type CategoryGenreCardProps = {
  category: StreamCategory | "";
  genre: StreamGenre | "";
  onCategoryChange: (category: StreamCategory) => void;
  onGenreChange: (genre: StreamGenre) => void;
};

/**
 * Category and genre are two distinct fields (e.g. category "Music",
 * genre "Worship") — kept as separate selects rather than merged into
 * one, matching the distinction the backend enforces.
 */
export function CategoryGenreCard({
  category,
  genre,
  onCategoryChange,
  onGenreChange,
}: CategoryGenreCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="mb-4 border-b border-white/10 pb-3">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
          Category &amp; genre
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as StreamCategory)}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-400/30"
          >
            <option value="" disabled>
              Select a category
            </option>
            {STREAM_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {getCategoryLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Genre</label>
          <select
            value={genre}
            onChange={(event) => onGenreChange(event.target.value as StreamGenre)}
            className="w-full rounded-2xl border border-white/10 bg-[#0b1320] px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-400/30"
          >
            <option value="" disabled>
              Select a genre
            </option>
            {STREAM_GENRES.map((value) => (
              <option key={value} value={value}>
                {getGenreLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
