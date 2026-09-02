// components/SearchBar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, SlidersHorizontal, Check } from "lucide-react";
import { SearchFilterOption } from "./lib/sermontags";
import api from "@/lib/axios";
export type SearchResult = {
    id: string;
    type: string;
    name: string;
    title: string;
    subtitle?: string | null;
    tags?: string[];
};


type SearchBarProps = {
    placeholder?: string;
    filters?: SearchFilterOption[];
    endpoint?: string;
    debounceMs?: number;
    onResultSelect?: (result: SearchResult) => void;
    className?: string;
};

export function SearchBar({
    placeholder = "Search users, videos, comments",
    filters = [],
    endpoint = "/search",
    debounceMs = 400,
    onResultSelect,
    className,
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const filterMenuRef = useRef<HTMLDivElement | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

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

        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            setError(null);
            return;
        }

        debounceRef.current = setTimeout(() => {
            runSearch(query, selectedFilters);
        }, debounceMs);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, selectedFilters]);

    async function runSearch(q: string, activeFilters: string[]) {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);
        setResultsOpen(true);

        try {
            const params = new URLSearchParams({ q });
            if (activeFilters.length > 0) {
                params.set("filters", activeFilters.join(","));
            }

            const response = await api.post(`${endpoint}?${params.toString()}`);

            // Ignore stale responses from an earlier keystroke
            if (requestId !== requestIdRef.current) return;

            const data: SearchResult[] = await response.data;
            if (requestId !== requestIdRef.current) return;
            setResults(data);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            console.error("Search error:", err);
            setError("Something went wrong, try again.");
            setResults([]);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }

    function toggleFilter(id: string) {
        setSelectedFilters((current) =>
            current.includes(id)
                ? current.filter((filterId) => filterId !== id)
                : [...current, id]
        );
    }

    const showDropdown = resultsOpen && query.trim().length > 0;

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
                        onFocus={() => query.trim() && setResultsOpen(true)}
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
                        className={`relative grid h-11 w-11 place-items-center rounded-full border transition ${selectedFilters.length > 0
                            ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                            : "border-white/10 bg-slate-950/70 text-slate-100 hover:border-cyan-400/30 hover:text-cyan-100"
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        {selectedFilters.length > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-cyan-400 text-[10px] font-semibold text-slate-950">
                                {selectedFilters.length}
                            </span>
                        )}
                    </button>

                    {filterMenuOpen && (
                        <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1726]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                            <p className="px-3 pb-2 pt-1 text-xs uppercase tracking-wide text-slate-500">
                                Filter by
                            </p>
                            <div className="flex max-h-60 w-full flex-col gap-1 overflow-y-auto scroll-black pr-1">
                                {filters.map((filter) => {
                                    const active = selectedFilters.includes(filter.id);
                                    return (
                                        <button
                                            key={filter.id}
                                            type="button"
                                            onClick={() => toggleFilter(filter.id)}
                                            className={`flex w-full shrink-0 items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${active
                                                ? "bg-cyan-400/10 text-cyan-100"
                                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <span className="truncate">{filter.label}</span>
                                            {active && <Check size={14} className="shrink-0 text-cyan-300" />}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedFilters.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedFilters([])}
                                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs text-slate-500 transition hover:text-red-200"
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
                            No results for &quot;{query}&quot;
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {results.map((result) => (
                                <li key={`${result.type}-${result.id}`}>
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
                                        {result.tags && result.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-0.5">
                                                {result.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-cyan-200/70"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {result.tags.length > 3 && (
                                                    <span className="px-1 text-[10px] text-slate-500">
                                                        +{result.tags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}