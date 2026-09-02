"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { CircleUserRound, Search as SearchIcon } from "lucide-react";
import { SearchBar, SearchResult } from "./Search";
import { SERMON_TOPIC_FILTERS } from "./lib/sermontags";
import { useLiveStream } from "./Context/Home_context";

type SessionUser = {
  name?: string | null;
};

type SessionResponse = {
  user?: SessionUser | null;
};

export function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const {setSelectedStreamId} = useLiveStream();


  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          return;
        }

        const session: SessionResponse = await response.json();
        console.log("Session data:", session);

        if (!active) {
          return;
        }

        setUserName(session.user?.name ?? null);
      } catch {
        if (active) {
          setUserName(null);
        }
      }
      finally {
        setChecked(true);
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#08111d]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-15 w-full max-w-[1900px] items-center gap-2 px-3 pt-2 sm:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div>
            <span className="block text-sm leading-none md:text-lg">24hr</span>
            <span className="block text-sm uppercase text-cyan-200/70 md:text-lg">watchers</span>
          </div>

          <div className="hidden w-full min-w-[260px] max-w-md md:block">
              <SearchBar
              placeholder = "Search users, videos, comments"
              filters = {SERMON_TOPIC_FILTERS}
              endpoint = "/search"
              debounceMs = {300}
              onResultSelect = {(stream:SearchResult) => setSelectedStreamId(stream.id)}
              // className = "w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((value) => !value)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-slate-950/70 text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100 md:hidden"
            aria-label={mobileSearchOpen ? "Close search" : "Open search"}
            aria-expanded={mobileSearchOpen}
          >
            <SearchIcon size={18} />
          </button>
          {checked && (
            userName ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-slate-950/70 text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100"
                  aria-label="Open profile menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <CircleUserRound size={20} />
                </button>

                {menuOpen && (
                  <div className="absolute flex flex-col items-center right-0 top-14 z-50 w-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0d1726]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="border-b border-white/10 px-3 py-3">
                      <p className="mt-1 text-sm font-medium text-white">{userName}</p>
                    </div>

                    <Link
                      href="/stream/new"
                      className="mt-2 flex items-center justify-center rounded-xl bg-cyan-400 px-2 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
                    >
                      Start a session
                    </Link>

                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="mt-2 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 px-2 py-2 text-sm text-slate-100 transition hover:border-red-400/30 hover:text-red-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 transition hover:border-cyan-400/30 hover:text-cyan-100 sm:px-4 sm:text-sm"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-cyan-300 sm:px-4 sm:text-sm"
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </div>
      </div>

      {/* Mobile/tablet search: toggled from the search icon, hidden on md+ where the inline bar shows instead */}
      {mobileSearchOpen && (
        <div className="border-t border-white/10 px-3 pb-3 pt-3 md:hidden">
          <SearchBar
            placeholder="Search users, videos, comments"
            filters={SERMON_TOPIC_FILTERS}
            endpoint="/search"
            debounceMs={300}
            onResultSelect={(stream: SearchResult) => {
              setSelectedStreamId(stream.id);
              setMobileSearchOpen(false);
            }}
          />
        </div>
      )}
    </header>
  );
}
