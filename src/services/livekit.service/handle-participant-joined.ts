import { prisma } from "@/lib/prisma";
import { publishActivity } from "@/lib/activity-bus";
import { getLiveViewerCount, recordViewerJoined } from "@/services/viewer-stats.service";

/**
 * Handles a `participant_joined` LiveKit webhook event. If the
 * participant who joined is a viewer (not the broadcaster themselves
 * reconnecting), bumps `totalViewCount`/`peakViewerCount` and notifies
 * the streamer's activity feed with the fresh live count.
 */
export async function handleParticipantJoined(roomName: string, participantIdentity: string) {
  const livestream = await prisma.livestream.findFirst({
    where: { id: roomName, status: "LIVE" },
  });

  if (!livestream) {
    return;
  }

  // The broadcaster's own identity is the livestream id (see
  // `createBroadcastSession`); nothing to record for them joining/rejoining.
  if (participantIdentity === livestream.userId) {
    return;
  }

  const currentViewerCount = await getLiveViewerCount(roomName, livestream.userId);

  await recordViewerJoined(livestream.id, currentViewerCount);

  publishActivity(livestream.userId, {
    type: "viewer_joined",
    viewerCount: currentViewerCount,
  });
}
