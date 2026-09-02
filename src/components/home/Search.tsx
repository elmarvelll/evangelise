// components/SearchBar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, SlidersHorizontal, Check } from "lucide-react";
import api from "@/lib/axios";
import {
  STREAM_CATEGORIES,
  STREAM_GENRES,
  getCategoryLabel,
  getGenreLabel,
} from "@/lib/stream-taxonomy";
import type { StreamCategory, StreamGenre } from "@prisma/client";

export type SearchResult = {
  id: string;
  name: string;
  title: string;
  subtitle?: string | null;
  category: StreamCategory;
  genre: StreamGenre;
};

type SearchBarProps = {
  placeholder?: string;
  debounceMs?: number;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
};

/**
 * Backend-powered livestream search: text search plus independent
 * category/genre filters, any combination — every request hits
 * `GET /api/livestreams`, never a static/local list.
 */
export function SearchBar({
  placeholder = "Search livestreams",
  debounceMs = 400,
  onResultSelect,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<StreamCategory | "">("");
  const [genre, setGenre] = useState<StreamGenre | "">("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const activeFilterCount = (category ? 1 : 0) + (genre ? 1 : 0);
  const hasQuery = query.trim().length > 0 || activeFilterCount > 0;

  // Close dropdowns on outside click / escape
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setResultsOpen(false);
      }
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setFilterMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setResultsOpen(false);
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Debounced search request, fires on query or filter change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!hasQuery) {
      setResults([]);
      setNextCursor(null);
      setLoading(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, genre]);

  async function runSearch() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setResultsOpen(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (category) params.set("category", category);
      if (genre) params.set("genre", genre);

      const response = await api.get(`/livestreams?${params.toString()}`);

      if (requestId !== requestIdRef.current) return;

      setResults(mapLivestreams(response.data.livestreams));
      setNextCursor(response.data.nextCursor ?? null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Search error:", err);
      setError("Something went wrong, try again.");
      setResults([]);
      setNextCursor(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (category) params.set("category", category);
      if (genre) params.set("genre", genre);
      params.set("cursor", nextCursor);

      const response = await api.get(`/livestreams?${params.toString()}`);
      setResults((current) => [...current, ...mapLivestreams(response.data.livestreams)]);
      setNextCursor(response.data.nextCursor ?? null);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setCategory("");
    setGenre("");
  }

  const showDropdown = resultsOpen && hasQuery;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-2">
        <label className="group flex w-full items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5 shadow-inner shadow-black/20 transition focus-within:border-cyan-400/30">
          <span className="text-slate-500 transition group-focus-within:text-cyan-200">
            <Search size={16} aria-hidden="true" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => hasQuery && setResultsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </label>

        <div ref={filterMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterMenuOpen((value) => !value)}
            aria-expanded={filterMenuOpen}
            aria-haspopup="menu"
            className={`relative grid h-11 w-11 place-items-center rounded-full border transition ${activeFilterCount > 0
              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
              : "border-white/10 bg-slate-950/70 text-slate-100 hover:border-cyan-400/30 hover:text-cyan-100"
              }`}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-cyan-400 text-[10px] font-semibold text-slate-950">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterMenuOpen && (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1726]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <p className="px-1 pb-2 pt-1 text-xs uppercase tracking-wide text-slate-500">
                Category
              </p>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto scroll-black pr-1">
                {STREAM_CATEGORIES.map((value) => {
                  const active = category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(active ? "" : value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${active
                        ? "bg-cyan-400/10 text-cyan-100"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <span className="truncate">{getCategoryLabel(value)}</span>
                      {active && <Check size={14} className="shrink-0 text-cyan-300" />}
                    </button>
                  );
                })}
              </div>

              <p className="px-1 pb-2 pt-3 text-xs uppercase tracking-wide text-slate-500">
                Genre
              </p>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto scroll-black pr-1">
                {STREAM_GENRES.map((value) => {
                  const active = genre === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGenre(active ? "" : value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${active
                        ? "bg-fuchsia-400/10 text-fuchsia-100"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <span className="truncate">{getGenreLabel(value)}</span>
                      {active && <Check size={14} className="shrink-0 text-fuchsia-300" />}
                    </button>
                  );
                })}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs text-slate-500 transition hover:text-red-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-14 z-50 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1726]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl scroll-black">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin text-cyan-400" />
              Searching...
            </div>
          ) : error ? (
            <p className="px-3 py-4 text-sm text-red-300">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              No streams found for these filters.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-1">
                {results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onResultSelect?.(result);
                        setResultsOpen(false);
                      }}
                      className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-slate-100">{result.title}</span>
                      </div>
                      <span className="truncate text-xs text-slate-400">{result.name}</span>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-cyan-200/70">
                          {getCategoryLabel(result.category)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-fuchsia-200/70">
                          {getGenreLabel(result.genre)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {nextCursor && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function mapLivestreams(
  livestreams: Array<{
    id: string;
    sessionName: string;
    sessionDescription: string;
    category: StreamCategory;
    genre: StreamGenre;
    user: { firstName: string; lastName: string };
  }>
): SearchResult[] {
  return livestreams.map((stream) => ({
    id: stream.id,
    name: `${stream.user.firstName} ${stream.user.lastName}`,
    title: stream.sessionName,
    subtitle: stream.sessionDescription,
    category: stream.category,
    genre: stream.genre,
  }));
}
