import { prisma } from "@/lib/prisma";
import { endLivestream } from "@/services/livestream.service";
import { publishActivity } from "@/lib/activity-bus";
import { getLiveViewerCount } from "@/services/viewer-stats.service";

const RECONNECT_GRACE_PERIOD = 30_000; // 30 seconds

/**
 * Handles a `participant_left` LiveKit webhook event. When the
 * *broadcaster* (identity === livestream id, per this app's convention)
 * leaves, the stream isn't ended immediately — a page refresh looks the
 * same as a real disconnect. Instead we wait out
 * `RECONNECT_GRACE_PERIOD` and only end the stream if no heartbeat
 * arrived in that window (see `livestream.service`'s `recordHeartbeat`).
 *
 * Fire-and-forget by design: the webhook responds immediately and this
 * grace-period check runs on a timer afterwards.
 */
export async function handleParticipantLeft(roomName: string, participantIdentity: string) {
  const livestream = await prisma.livestream.findFirst({
    where: {
      id: roomName,
      status: "LIVE",
    },
  });

  if (!livestream) {
    console.log("No active livestream found");
    return;
  }

  if (livestream.id !== participantIdentity) {
    console.log("👤 Viewer left. Stream remains LIVE.");

    const currentViewerCount = await getLiveViewerCount(roomName, livestream.userId);
    publishActivity(livestream.userId, { type: "viewer_left", viewerCount: currentViewerCount });
    return;
  }

  console.log(
    `⏳ Streamer left. Waiting ${RECONNECT_GRACE_PERIOD / 1000}s for reconnect...`
  );

  setTimeout(async () => {
    try {
      const activeStream = await prisma.livestream.findUnique({
        where: { id: livestream.id },
      });

      if (!activeStream || activeStream.status !== "LIVE") {
        return;
      }

      const lastSeen = activeStream.lastSeenAt;

      if (
        lastSeen &&
        Date.now() - new Date(lastSeen).getTime() < RECONNECT_GRACE_PERIOD
      ) {
        console.log("🟢 Streamer reconnected. Keeping stream LIVE.");
        return;
      }

      await endLivestream(activeStream.id);

      console.log("🔴 Stream ended after reconnect grace period.");
    } catch (error) {
      console.error("❌ Grace-period cleanup error:", error);
    }
  }, RECONNECT_GRACE_PERIOD);
}
