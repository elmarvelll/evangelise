import { prisma } from "@/lib/prisma";

const STALE_AFTER_MS = 90 * 1000; // 90 seconds

/**
 * Cron-driven sweep (see `/api/livekit/cleanup`) that ends any stream
 * still marked LIVE whose last heartbeat is older than
 * `STALE_AFTER_MS`.
 */
export async function cleanupStaleStreams() {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const result = await prisma.livestream.updateMany({
    where: {
      status: "LIVE",
      lastSeenAt: {
        lt: cutoff,
      },
    },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  console.log(`[Stale Cleanup] Ended ${result.count} stale stream(s)`);

  return result.count;
}
