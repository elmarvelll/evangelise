import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/services/errors";
import { publishActivity } from "@/lib/activity-bus";

/**
 * Marks a livestream ENDED. This is the single place a livestream
 * transitions to ENDED (explicit "End Stream", the webhook reconnect-
 * grace-period timeout, and the stale-stream cron all call this) so the
 * `stream_ended` activity notification fires exactly once, from one
 * place, regardless of which path triggered the end.
 */
export async function endLivestream(livestreamId: string) {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  await prisma.livestream.update({
    where: { id: livestreamId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  publishActivity(livestream.userId, {
    type: "stream_ended",
    livestreamId: livestream.id,
  });

  return livestream;
}
