import { badRequest, json, notFound, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import {
  cleanupStaleStreams,
  getActiveLivestreamForUser,
  listActiveLivestreams,
  recordHeartbeat,
} from "@/services/livestream.service";
import { NotFoundError } from "@/services/errors";

/**
 * GET /api/livestreams
 * Public feed of every currently-LIVE stream.
 */
export async function listLivestreamsController() {
  try {
    const livestreams = await listActiveLivestreams();
    return json({ livestreams });
  } catch (error) {
    console.error("Livestream GET route error:", error);
    return serverError("Unable to load livestreams right now.");
  }
}

/**
 * GET /api/livestreams/active
 * The signed-in user's own active livestream, used to restore the
 * broadcaster dashboard after a refresh.
 */
export async function getActiveLivestreamController() {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const livestream = await getActiveLivestreamForUser(session.user.id);

    if (!livestream) {
      return json({ isLive: false, livestream: null });
    }

    return json({ isLive: true, livestream });
  } catch (error) {
    console.error("Failed to get active livestream:", error);
    return serverError("Failed to get active livestream");
  }
}

/**
 * POST /api/livekit/heartbeat
 * Called periodically by the broadcaster's client to prove the stream
 * is still alive; consumed by `cleanupStaleStreams`.
 */
export async function heartbeatController(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const { roomId } = await request.json();

    if (!roomId) {
      return badRequest("Missing roomId");
    }

    await recordHeartbeat(session.user.id, roomId);

    return json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    console.error("Heartbeat error:", error);
    return serverError("Heartbeat failed");
  }
}

/**
 * GET /api/livekit/cleanup
 * Cron-only endpoint (protected by `CRON_SECRET`) that ends any stream
 * whose heartbeat has gone stale.
 */
export async function cleanupController(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is missing");
      return serverError("Server configuration error");
    }

    if (authorization !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cleanup request");
      return unauthorized();
    }

    const endedCount = await cleanupStaleStreams();

    return json({ success: true, endedCount });
  } catch (error) {
    console.error("Cleanup error:", error);
    return serverError("Failed to cleanup stale streams");
  }
}
