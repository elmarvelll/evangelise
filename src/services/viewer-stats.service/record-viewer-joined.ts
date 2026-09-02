import { prisma } from "@/lib/prisma";

/**
 * Bumps the persisted counters when a viewer joins a live room (called
 * from the LiveKit `participant_joined` webhook — see
 * `livekit.service/handle-participant-joined.ts`). `totalViewCount` is a
 * lifetime join counter (a viewer who leaves and rejoins counts twice —
 * there's no viewer identity to dedupe against); `peakViewerCount` is
 * raised only if the current live count exceeds the stored peak.
 */
export async function recordViewerJoined(livestreamId: string, currentViewerCount: number) {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
    select: { peakViewerCount: true },
  });

  if (!livestream) {
    return;
  }

  await prisma.livestream.update({
    where: { id: livestreamId },
    data: {
      totalViewCount: { increment: 1 },
      peakViewerCount: Math.max(livestream.peakViewerCount, currentViewerCount),
    },
  });
}
