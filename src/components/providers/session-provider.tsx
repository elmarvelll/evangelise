"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Thin client-boundary wrapper so the (server) root layout can render
 * NextAuth's `SessionProvider`. Needed for `useSession()` — used by
 * `useFollow` to check whether the current viewer is signed in — to
 * work anywhere in the client component tree.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
