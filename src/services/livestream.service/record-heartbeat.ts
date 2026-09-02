import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/services/errors";

/**
 * Records a liveness heartbeat from the broadcaster's client so
 * `cleanupStaleStreams` can tell a genuinely-dead stream from one whose
 * owner is just between page loads.
 */
export async function recordHeartbeat(userId: string, roomId: string) {
  const livestream = await prisma.livestream.findFirst({
    where: {
      id: roomId,
      status: "LIVE",
      userId,
    },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  await prisma.livestream.update({
    where: { id: livestream.id },
    data: { lastSeenAt: new Date() },
  });
}
