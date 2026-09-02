import { prisma } from "@/lib/prisma";
import { endLivestream } from "./end-livestream";

const STALE_AFTER_MS = 90 * 1000; // 90 seconds

/**
 * Cron-driven sweep (see `/api/livekit/cleanup`) that ends any stream
 * still marked LIVE whose last heartbeat is older than
 * `STALE_AFTER_MS`.
 *
 * Ends each stale stream individually through `endLivestream` (rather
 * than a single bulk `updateMany`) so the `stream_ended` activity
 * notification fires for each one's owner — a small number of extra
 * queries for a job that runs every 5 minutes over what should normally
 * be zero or a handful of rows, in exchange for one consistent "a stream
 * ended" code path instead of two.
 */
export async function cleanupStaleStreams() {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const staleStreams = await prisma.livestream.findMany({
    where: {
      status: "LIVE",
      lastSeenAt: {
        lt: cutoff,
      },
    },
    select: { id: true },
  });

  for (const stream of staleStreams) {
    await endLivestream(stream.id);
  }

  console.log(`[Stale Cleanup] Ended ${staleStreams.length} stale stream(s)`);

  return staleStreams.length;
}
