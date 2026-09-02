/**
 * Minimal in-memory sliding-window rate limiter (e.g. comment spam
 * protection). Keyed by an arbitrary string (typically `${action}:${userId}`).
 *
 * KNOWN LIMITATION: state lives in process memory, so it resets on
 * restart and does not share state across multiple server instances —
 * fine for this app's current single-process deployment, not a
 * substitute for a shared limiter (Redis, etc.) under multi-instance
 * production traffic. See docs/decisions/livestream-decisions.md.
 */

const hits = new Map<string, number[]>();

/** Returns true if the action is allowed, false if the caller is over the limit. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const existing = hits.get(key) ?? [];
  const recent = existing.filter((timestamp) => timestamp > windowStart);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}
