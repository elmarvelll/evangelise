import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Thin wrapper around `getServerSession(authOptions)` so route controllers
 * don't each need to import and pair up both pieces themselves.
 */
export function getCurrentSession() {
  return getServerSession(authOptions);
}
