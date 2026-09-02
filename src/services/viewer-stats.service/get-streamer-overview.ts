import { prisma } from "@/lib/prisma";
import { getFollowerCount } from "@/services/follow.service";

/**
 * Aggregate stats for a streamer's own dashboard — total streams,
 * lifetime views/peak across all their streams, and follower count.
 * All real database aggregates; nothing here is a placeholder number.
 */
export async function getStreamerOverview(userId: string) {
  const [followerCount, streamAggregate, totalStreams] = await Promise.all([
    getFollowerCount(userId),
    prisma.livestream.aggregate({
      where: { userId },
      _sum: { totalViewCount: true },
      _max: { peakViewerCount: true },
    }),
    prisma.livestream.count({ where: { userId } }),
  ]);

  return {
    followerCount,
    totalStreams,
    lifetimeViews: streamAggregate._sum.totalViewCount ?? 0,
    allTimePeakViewers: streamAggregate._max.peakViewerCount ?? 0,
  };
}
